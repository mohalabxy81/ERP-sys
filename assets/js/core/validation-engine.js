/**
 * ============================================================================
 * VALIDATION-ENGINE.JS — Enterprise Validation & Regulatory Rules Framework
 * Standard: SBC 2018/2024 · ZATCA Phase 2 · FIDIC · ISO 9001 QA/QC
 * ============================================================================
 */

(function(window) {
  'use strict';

  // ==========================================================================
  // 1. ATOMIC VALIDATION RULES
  // ==========================================================================

  const RULES = {
    required(val) {
      if (val === null || val === undefined) return false;
      if (typeof val === 'string') return val.trim().length > 0;
      if (Array.isArray(val)) return val.length > 0;
      return true;
    },

    numeric(val, min = -Infinity, max = Infinity) {
      if (val === null || val === undefined || val === '') return true;
      const num = Number(val);
      if (isNaN(num)) return false;
      return num >= min && num <= max;
    },

    positive(val) {
      if (val === null || val === undefined || val === '') return true;
      const num = Number(val);
      return !isNaN(num) && num > 0;
    },

    percent(val, min = 0, max = 100) {
      return RULES.numeric(val, min, max);
    },

    email(val) {
      if (!val) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim());
    },

    phoneKSA(val) {
      if (!val) return true;
      // Matches 05XXXXXXXX or +9665XXXXXXXX
      const clean = String(val).replace(/[\s\-\(\)]/g, '');
      return /^(?:(?:\+?966)|0)?5\d{8}$/.test(clean);
    },

    vatKSA(val) {
      if (!val) return true;
      // ZATCA 15-digit VAT: starts with 3, ends with 3, total 15 digits
      const clean = String(val).replace(/\D/g, '');
      return /^3\d{13}3$/.test(clean);
    },

    crKSA(val) {
      if (!val) return true;
      // Saudi Commercial Registration: 10 digits
      const clean = String(val).replace(/\D/g, '');
      return /^\d{10}$/.test(clean);
    },

    unspscCode(val) {
      if (!val) return true;
      // 8-digit UNSPSC code
      return /^\d{8}$/.test(String(val).trim());
    },

    masterformat(val) {
      if (!val) return true;
      // CSI MasterFormat: XX XX XX or XX XX
      return /^\d{2}\s\d{2}(?:\s\d{2})?$/.test(String(val).trim());
    }
  };

  // ==========================================================================
  // 2. SCHEMA-BASED FORM VALIDATOR
  // ==========================================================================

  class ValidationEngine {
    /**
     * Validate arbitrary data against a declarative field schema
     * @param {Object} schema Field rules definitions
     * @param {Object} data Input values
     * @returns {{ isValid: boolean, errors: Object, cleanData: Object }}
     */
    static validate(schema, data) {
      const errors = {};
      const cleanData = {};

      Object.keys(schema).forEach(fieldKey => {
        const fieldRules = schema[fieldKey];
        const val = data ? data[fieldKey] : undefined;
        const fieldErrors = [];

        // Required check
        if (fieldRules.required && !RULES.required(val)) {
          fieldErrors.push(fieldRules.requiredMsg || `الحقل (${fieldRules.label || fieldKey}) مطلوب ولا يمكن تركه فارغاً.`);
        }

        if (val !== undefined && val !== null && val !== '') {
          // Numeric check
          if (fieldRules.numeric && !RULES.numeric(val, fieldRules.min, fieldRules.max)) {
            const minMsg = fieldRules.min !== undefined ? ` وأكبر من أو يساوي ${fieldRules.min}` : '';
            const maxMsg = fieldRules.max !== undefined ? ` وأصغر من أو يساوي ${fieldRules.max}` : '';
            fieldErrors.push(fieldRules.numericMsg || `يجب أن تكون قيمة (${fieldRules.label || fieldKey}) رقماً صحيحاً${minMsg}${maxMsg}.`);
          }

          // Positive check
          if (fieldRules.positive && !RULES.positive(val)) {
            fieldErrors.push(`يجب أن تكون قيمة (${fieldRules.label || fieldKey}) موجبة أكبر من صفر.`);
          }

          // Phone KSA
          if (fieldRules.phoneKSA && !RULES.phoneKSA(val)) {
            fieldErrors.push('رقم الهاتف يجب أن يكون بصيغة سعودية صحيحة (05XXXXXXXX).');
          }

          // VAT KSA (ZATCA)
          if (fieldRules.vatKSA && !RULES.vatKSA(val)) {
            fieldErrors.push('الرقم الضريبي يجب أن يتكون من 15 رقماً ويبدأ وينتهي بالرقم 3 وفق معايير هيئة الزكاة والضريبة والجمارك (ZATCA).');
          }

          // CR KSA
          if (fieldRules.crKSA && !RULES.crKSA(val)) {
            fieldErrors.push('رقم السجل التجاري يجب أن يتكون من 10 أرقام نظامية.');
          }

          // Email
          if (fieldRules.email && !RULES.email(val)) {
            fieldErrors.push('صيغة البريد الإلكتروني غير صحيحة.');
          }

          // UNSPSC Code
          if (fieldRules.unspsc && !RULES.unspscCode(val)) {
            fieldErrors.push('كود UNSPSC يجب أن يتكون من 8 أرقام تصنيف دولية.');
          }

          // Custom function validator
          if (typeof fieldRules.custom === 'function') {
            const customResult = fieldRules.custom(val, data);
            if (customResult !== true) {
              fieldErrors.push(typeof customResult === 'string' ? customResult : 'القيمة المدخلة غير مقبولة هندسياً.');
            }
          }
        }

        if (fieldErrors.length > 0) {
          errors[fieldKey] = fieldErrors;
        } else {
          // Cleaned normalized value
          if (fieldRules.numeric && val !== '' && val !== null && val !== undefined) {
            cleanData[fieldKey] = Number(val);
          } else if (typeof val === 'string') {
            cleanData[fieldKey] = window.DOMSanitizer ? window.DOMSanitizer.clean(val.trim()) : val.trim();
          } else {
            cleanData[fieldKey] = val;
          }
        }
      });

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        cleanData
      };
    }

    // ========================================================================
    // 3. DOMAIN-SPECIFIC PRE-BUILT SCHEMAS
    // ========================================================================

    static validateSubcontract(data) {
      const schema = {
        sub_id: { label: 'رقم العقد', required: true },
        contractor_name: { label: 'مقاول الباطن', required: true },
        scope: { label: 'نطاق العمل التعاقدي', required: true },
        original_value: { label: 'القيمة الأصلية للعقد', required: true, numeric: true, positive: true },
        approved_vos: { label: 'أوامر التغيير', numeric: true, min: 0 },
        retention_pct: { 
          label: 'نسبة محتجز الضمان (Retention)', 
          required: true, 
          numeric: true, 
          min: 5.0, 
          max: 15.0,
          custom: (v) => (v >= 5 && v <= 15) ? true : 'نسبة محتجز الضمان وفق فيديك FIDIC يجب أن تتراوح بين 5% و 15% (القياسي 10%).'
        }
      };
      return this.validate(schema, data);
    }

    static validateContractor(data) {
      const schema = {
        contractor_id: { label: 'كود المقاول', required: true },
        contractor_name: { label: 'اسم المقاول', required: true },
        specialty: { label: 'التخصص الإنشائي', required: true },
        total_crew: { label: 'إجمالي الطاقم', required: true, numeric: true, min: 1 },
        cr_number: { label: 'السجل التجاري', crKSA: true },
        vat_number: { label: 'الرقم الضريبي', vatKSA: true },
        phone: { label: 'رقم الاتصال', phoneKSA: true }
      };
      return this.validate(schema, data);
    }

    static validateMaterial(data) {
      const schema = {
        item_code: { label: 'كود المادة', required: true },
        desc: { label: 'توصيف الخامة والمواصفة', required: true },
        unit: { label: 'الوحدة', required: true },
        price_before_vat: { label: 'السعر قبل الضريبة', required: true, numeric: true, positive: true },
        vat_pct: { label: 'نسبة الضريبة %', required: true, numeric: true, min: 0, max: 100 },
        unspsc_code: { label: 'كود UNSPSC', unspsc: true }
      };
      return this.validate(schema, data);
    }
  }

  // ==========================================================================
  // EXPORT TO GLOBAL WINDOW
  // ==========================================================================

  window.RULES = RULES;
  window.ValidationEngine = ValidationEngine;

})(window);
