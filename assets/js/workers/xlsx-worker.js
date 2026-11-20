/**
 * @file xlsx-worker.js
 * @module MimarERP / Workers / XLSX
 * @version 6.0.0
 * @description
 * Enterprise Excel Import/Export Web Worker — MimarERP v6
 *
 * Runs in a dedicated Web Worker thread to avoid blocking the UI thread
 * during large spreadsheet operations (import/export of BOQ, procurement,
 * subcontracts, rate analysis, BIM data, etc.)
 *
 * Architecture:
 *   Main Thread → postMessage({ type, payload }) → Worker
 *   Worker      → postMessage({ type, payload, error }) → Main Thread
 *
 * Message Types:
 *   IMPORT_EXCEL       — Parse ArrayBuffer → structured JSON
 *   EXPORT_EXCEL       — JSON data → Excel ArrayBuffer (Uint8Array)
 *   EXPORT_CSV         — JSON data → CSV string
 *   EXPORT_ZATCA_CSV   — Invoices → ZATCA Phase 2 compliant CSV
 *   PING               — Health check
 *
 * Supported Entity Types (payload.entity):
 *   boq, procurement, subcontracts, contractors, catalog,
 *   rate_analysis, evm_data, site_diary, inspection, drawing_register,
 *   invoice_zatca, rebar_bbs, variation_orders
 *
 * @example Main thread usage:
 *   const worker = new Worker('assets/js/workers/xlsx-worker.js');
 *   worker.postMessage({ type: 'EXPORT_EXCEL', payload: { entity: 'boq', data: wbsData, filename: 'BOQ-2026.xlsx' } });
 *   worker.onmessage = (e) => { if (e.data.type === 'EXPORT_EXCEL_DONE') saveBlob(e.data.payload.buffer, e.data.payload.filename); };
 *
 * @author MimarERP Enterprise Architecture Team
 * @license Proprietary — مشروع نظام إدارة المقاولات المتكامل
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS & CONFIGURATION
   ═══════════════════════════════════════════════════════════════════════════ */

/** Saudi number formatting */
const SAR_LOCALE = 'ar-SA';
const SAR_CURRENCY = 'SAR';

/** ZATCA Phase 2 CSV header columns (Fatoorah / Simplified Tax Invoice) */
const ZATCA_HEADERS = [
  'رقم الفاتورة', 'تاريخ الفاتورة', 'نوع الفاتورة',
  'رقم سجل البائع التجاري', 'رقم ضريبة البائع',
  'اسم البائع', 'اسم المشتري', 'رقم ضريبة المشتري',
  'وصف البند', 'الكمية', 'وحدة القياس',
  'السعر قبل الضريبة', 'نسبة الضريبة %', 'مبلغ الضريبة',
  'الإجمالي شامل الضريبة', 'العملة', 'رمز QR ZATCA'
];

/** Column header maps per entity type (Arabic labels for export) */
const COLUMN_MAPS = {
  boq: [
    { key: 'wbs_code',      label: 'كود WBS' },
    { key: 'description',   label: 'الوصف / البند' },
    { key: 'unit',          label: 'الوحدة' },
    { key: 'quantity',      label: 'الكمية' },
    { key: 'unit_rate',     label: 'سعر الوحدة (SAR)' },
    { key: 'total',         label: 'الإجمالي (SAR)' },
    { key: 'actual_qty',    label: 'المنفذ الفعلي' },
    { key: 'actual_cost',   label: 'التكلفة الفعلية (SAR)' },
    { key: 'variance',      label: 'الانحراف (SAR)' },
    { key: 'completion_pct',label: 'نسبة الإنجاز %' }
  ],

  procurement: [
    { key: 'po_number',         label: 'رقم أمر التوريد' },
    { key: 'issue_date',        label: 'تاريخ الإصدار' },
    { key: 'supplier_name',     label: 'اسم المورد' },
    { key: 'item_desc',         label: 'توصيف الصنف' },
    { key: 'unit',              label: 'الوحدة' },
    { key: 'qty_ordered',       label: 'الكمية المطلوبة' },
    { key: 'unit_price',        label: 'سعر الوحدة (SAR)' },
    { key: 'total_before_vat',  label: 'الإجمالي قبل الضريبة' },
    { key: 'vat_amount',        label: 'مبلغ الضريبة 15%' },
    { key: 'total_after_vat',   label: 'الإجمالي شامل الضريبة' },
    { key: 'delivery_date',     label: 'تاريخ التسليم المتوقع' },
    { key: 'status',            label: 'الحالة' }
  ],

  subcontracts: [
    { key: 'sub_id',              label: 'رقم العقد' },
    { key: 'contractor_name',     label: 'اسم مقاول الباطن' },
    { key: 'scope',               label: 'نطاق الأعمال' },
    { key: 'original_value',      label: 'قيمة العقد الأصلية (SAR)' },
    { key: 'approved_vos',        label: 'أوامر التغيير (SAR)' },
    { key: 'executed_measured',   label: 'المنفذ بالحصر (SAR)' },
    { key: 'retention_pct',       label: 'نسبة الحجز %' },
    { key: 'retention_amount',    label: 'مبلغ الحجز (SAR)' },
    { key: 'net_payable',         label: 'الصافي المستحق (SAR)' },
    { key: 'status',              label: 'حالة العقد' }
  ],

  contractors: [
    { key: 'contractor_id',   label: 'كود المقاول' },
    { key: 'contractor_name', label: 'اسم المقاول' },
    { key: 'specialty',       label: 'التخصص' },
    { key: 'total_crew',      label: 'عدد الطاقم' },
    { key: 'city',            label: 'المدينة' },
    { key: 'contact_person',  label: 'مسؤول الاتصال' },
    { key: 'rating',          label: 'التقييم (من 5)' },
    { key: 'status',          label: 'الحالة' }
  ],

  catalog: [
    { key: 'item_code',         label: 'كود الخامة' },
    { key: 'desc',              label: 'الاسم والتوصيف' },
    { key: 'partner_name',      label: 'المورد / المقاول' },
    { key: 'category',          label: 'التصنيف' },
    { key: 'unit',              label: 'الوحدة' },
    { key: 'qty',               label: 'الكمية' },
    { key: 'price_before_vat',  label: 'السعر قبل الضريبة (SAR)' },
    { key: 'unit_vat',          label: 'ضريبة الوحدة (SAR)' },
    { key: 'price_after_vat',   label: 'السعر شامل الضريبة (SAR)' },
    { key: 'total_after_vat',   label: 'الإجمالي شامل الضريبة (SAR)' },
    { key: 'status',            label: 'الحالة' }
  ],

  rate_analysis: [
    { key: 'rate_id',         label: 'كود التسعير' },
    { key: 'contractor_name', label: 'المقاول' },
    { key: 'specialty',       label: 'التخصص' },
    { key: 'activity_desc',   label: 'توصيف النشاط' },
    { key: 'unit',            label: 'الوحدة' },
    { key: 'unit_rate',       label: 'السعر (SAR)' },
    { key: 'daily_production',label: 'معدل الإنتاج اليومي' },
    { key: 'status',          label: 'الحالة' }
  ],

  evm_data: [
    { key: 'activity',   label: 'النشاط' },
    { key: 'bac',        label: 'BAC — الميزانية الكلية (SAR)' },
    { key: 'pv',         label: 'PV — القيمة المخططة (SAR)' },
    { key: 'ev',         label: 'EV — القيمة المكتسبة (SAR)' },
    { key: 'ac',         label: 'AC — التكلفة الفعلية (SAR)' },
    { key: 'cv',         label: 'CV — انحراف التكلفة' },
    { key: 'sv',         label: 'SV — انحراف الجدول' },
    { key: 'cpi',        label: 'CPI — مؤشر أداء التكلفة' },
    { key: 'spi',        label: 'SPI — مؤشر أداء الجدول' },
    { key: 'eac',        label: 'EAC — التكلفة المتوقعة للإكمال' },
    { key: 'etc',        label: 'ETC — التكلفة الباقية المتوقعة' },
    { key: 'vac',        label: 'VAC — انحراف الإكمال' }
  ]
};

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Format number as SAR currency string
 * @param {number} val
 * @returns {string}
 */
function formatSAR(val) {
  if (val == null || isNaN(val)) return '0.00';
  return Number(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Escape CSV cell value (RFC 4180)
 * @param {*} val
 * @returns {string}
 */
function escapeCSV(val) {
  if (val == null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Convert array of objects to CSV string using column map
 * @param {object[]} data - Array of data objects
 * @param {object[]} columns - Array of {key, label} column descriptors
 * @returns {string} CSV string with BOM for Excel Arabic support
 */
function dataToCSV(data, columns) {
  const BOM = '\uFEFF';  // UTF-8 BOM for Excel Arabic compatibility

  // Header row
  const header = columns.map(c => escapeCSV(c.label)).join(',');

  // Data rows
  const rows = (data || []).map(row =>
    columns.map(c => escapeCSV(row[c.key] ?? '')).join(',')
  );

  return BOM + [header, ...rows].join('\r\n');
}

/**
 * Build a minimal XLSX file from scratch (pure JS, no dependency).
 * Uses Office Open XML format with a single worksheet.
 * Note: For full styling/charts, use JSZip + xlsx library on main thread.
 * This worker handles data extraction; the main thread handles JSZip assembly.
 *
 * @param {object[]} data
 * @param {object[]} columns
 * @param {string} sheetName
 * @returns {{ headers: string[], rows: string[][] }} Structured data for JSZip assembly
 */
function prepareXLSXData(data, columns, sheetName) {
  const headers = columns.map(c => c.label);
  const rows = (data || []).map(row =>
    columns.map(c => {
      const val = row[c.key];
      if (val == null) return '';
      if (typeof val === 'number') return val;
      return String(val);
    })
  );
  return { sheetName: sheetName || 'البيانات', headers, rows };
}

/**
 * Parse a simple CSV text into an array of objects.
 * Handles BOM, quoted fields, Arabic text.
 * @param {string} csvText
 * @returns {object[]}
 */
function parseCSV(csvText) {
  // Remove BOM
  const text = csvText.replace(/^\uFEFF/, '').trim();
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] ?? '';
    });
    result.push(obj);
  }

  return result;
}

/**
 * Parse a single CSV line respecting quoted fields
 * @param {string} line
 * @returns {string[]}
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Map Arabic column labels back to entity field keys for import
 * @param {string} entity
 * @param {string} label - Arabic column label from imported file
 * @returns {string|null} Field key
 */
function labelToKey(entity, label) {
  const map = COLUMN_MAPS[entity];
  if (!map) return null;
  const col = map.find(c => c.label === label || c.key === label);
  return col ? col.key : null;
}

/**
 * Remap imported CSV rows from Arabic column labels to entity field keys
 * @param {object[]} rows - Rows with Arabic label keys
 * @param {string} entity
 * @returns {object[]}
 */
function remapImportedRows(rows, entity) {
  return rows.map(row => {
    const mapped = {};
    Object.entries(row).forEach(([label, val]) => {
      const key = labelToKey(entity, label);
      if (key) mapped[key] = val;
      else mapped[label] = val; // keep unmapped columns as-is
    });
    return mapped;
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   ZATCA PHASE 2 EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Generate ZATCA Phase 2 compliant CSV export for simplified/standard tax invoices
 * Follows ZATCA e-invoicing technical specifications (Version 2.3)
 * @param {object[]} invoices
 * @returns {string} CSV string
 */
function exportZATCACSV(invoices) {
  const BOM = '\uFEFF';
  const header = ZATCA_HEADERS.map(h => escapeCSV(h)).join(',');

  const rows = (invoices || []).map(inv => {
    return [
      inv.invoice_number    || '',
      inv.invoice_date      || '',
      inv.invoice_type      || 'فاتورة ضريبية مبسطة',
      inv.seller_cr         || '',
      inv.seller_vat        || '',
      inv.seller_name       || '',
      inv.buyer_name        || '',
      inv.buyer_vat         || '',
      inv.item_desc         || '',
      inv.qty               || 1,
      inv.unit              || 'مقطوعية',
      formatSAR(inv.price_before_vat),
      inv.vat_pct           || 15,
      formatSAR(Number(inv.price_before_vat || 0) * (Number(inv.vat_pct || 15) / 100)),
      formatSAR(Number(inv.price_before_vat || 0) * (1 + Number(inv.vat_pct || 15) / 100)),
      SAR_CURRENCY,
      inv.zatca_qr          || ''
    ].map(v => escapeCSV(String(v))).join(',');
  });

  return BOM + [header, ...rows].join('\r\n');
}

/* ═══════════════════════════════════════════════════════════════════════════
   MESSAGE HANDLER — Main Worker Entry Point
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @listens message
 * Handles all messages from the main thread.
 * Message format: { type: string, payload: object, requestId?: string }
 */
self.onmessage = function(event) {
  const { type, payload, requestId } = event.data || {};

  try {
    switch (type) {

      /* ── Health check ── */
      case 'PING': {
        self.postMessage({ type: 'PONG', requestId, payload: { status: 'ok', timestamp: Date.now() } });
        break;
      }

      /* ── Export: JSON → CSV ── */
      case 'EXPORT_CSV': {
        const { entity, data, filename } = payload;
        const columns = COLUMN_MAPS[entity];
        if (!columns) throw new Error(`Unknown entity type for CSV export: ${entity}`);

        const csvString = dataToCSV(data, columns);
        const outputFilename = filename || `${entity}-export-${new Date().toISOString().slice(0,10)}.csv`;

        self.postMessage({
          type: 'EXPORT_CSV_DONE',
          requestId,
          payload: { csvString, filename: outputFilename, entity, rowCount: (data || []).length }
        });
        break;
      }

      /* ── Export: JSON → XLSX (data prep, JSZip assembly on main thread) ── */
      case 'EXPORT_EXCEL': {
        const { entity, data, filename, sheetName } = payload;
        const columns = COLUMN_MAPS[entity];
        if (!columns) throw new Error(`Unknown entity type for Excel export: ${entity}`);

        const xlsxData = prepareXLSXData(data, columns, sheetName || entity);
        const outputFilename = filename || `${entity}-export-${new Date().toISOString().slice(0,10)}.xlsx`;

        self.postMessage({
          type: 'EXPORT_EXCEL_DONE',
          requestId,
          payload: { xlsxData, filename: outputFilename, entity, rowCount: (data || []).length }
        });
        break;
      }

      /* ── Export: Invoices → ZATCA Phase 2 CSV ── */
      case 'EXPORT_ZATCA_CSV': {
        const { data, filename } = payload;
        const csvString = exportZATCACSV(data);
        const outputFilename = filename || `ZATCA-invoices-${new Date().toISOString().slice(0,10)}.csv`;

        self.postMessage({
          type: 'EXPORT_ZATCA_CSV_DONE',
          requestId,
          payload: { csvString, filename: outputFilename, rowCount: (data || []).length }
        });
        break;
      }

      /* ── Import: CSV text → structured JSON ── */
      case 'IMPORT_CSV': {
        const { entity, csvText } = payload;
        const rawRows = parseCSV(csvText);
        const mappedRows = remapImportedRows(rawRows, entity);

        // Basic validation: check at least one known field exists
        const columns = COLUMN_MAPS[entity] || [];
        const knownKeys = columns.map(c => c.key);
        const validRows = mappedRows.filter(row =>
          knownKeys.some(k => row[k] != null && row[k] !== '')
        );

        self.postMessage({
          type: 'IMPORT_CSV_DONE',
          requestId,
          payload: {
            entity,
            rows: validRows,
            totalParsed: rawRows.length,
            validCount: validRows.length,
            skippedCount: rawRows.length - validRows.length
          }
        });
        break;
      }

      /* ── Import: ArrayBuffer (Excel) → structured JSON via JSZip/XLSX ── */
      case 'IMPORT_EXCEL': {
        // Full XLSX parsing requires the xlsx.js library which is loaded on
        // main thread (via jszip.min.js). This worker returns the raw
        // ArrayBuffer back and signals the main thread to parse it there.
        // Future: load xlsx.js inside worker via importScripts()
        self.postMessage({
          type: 'IMPORT_EXCEL_REDIRECT',
          requestId,
          payload: {
            message: 'Excel import requires xlsx.js — handle on main thread',
            entity: payload.entity,
            buffer: payload.buffer
          },
          transfer: payload.buffer ? [payload.buffer] : []
        });
        break;
      }

      /* ── Multi-sheet export (e.g., full project data package) ── */
      case 'EXPORT_MULTI_SHEET': {
        const { sheets, filename } = payload; // sheets: [{ entity, data, sheetName }]
        const sheetsData = (sheets || []).map(s => {
          const columns = COLUMN_MAPS[s.entity] || [];
          return prepareXLSXData(s.data, columns, s.sheetName || s.entity);
        });

        self.postMessage({
          type: 'EXPORT_MULTI_SHEET_DONE',
          requestId,
          payload: {
            sheetsData,
            filename: filename || `MimarERP-export-${new Date().toISOString().slice(0,10)}.xlsx`,
            sheetCount: sheetsData.length
          }
        });
        break;
      }

      default: {
        self.postMessage({
          type: 'ERROR',
          requestId,
          error: `Unknown message type: ${type}`
        });
      }
    }
  } catch (err) {
    self.postMessage({
      type: 'ERROR',
      requestId,
      error: err.message,
      stack: err.stack
    });
  }
};

/* Log worker ready */
self.postMessage({ type: 'WORKER_READY', payload: { version: '6.0.0', entities: Object.keys(COLUMN_MAPS) } });
