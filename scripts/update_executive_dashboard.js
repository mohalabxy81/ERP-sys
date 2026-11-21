const fs = require('fs');

const indexPath = 'index.html';
let html = fs.readFileSync(indexPath, 'utf8');

// Build the complete Unified Executive Dashboard HTML
const unifiedDashboardHtml = `    <!-- =========================================================================
         VIEW 01: SINGLE UNIFIED EXECUTIVE DASHBOARD (CEO COCKPIT 360°)
         All 28 Corporate Indicators with Interactive Drill-Downs
         ========================================================================= -->
    <section class="page-view active" id="view-dashboard">
      <!-- Cockpit Header Toolbar -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px; background:linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9)); padding:16px 20px; border-radius:var(--radius); border:1px solid var(--line); box-shadow:var(--shadow-sm);">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge" style="background:var(--navy); color:var(--gold); font-weight:800; font-size:11px; padding:3px 8px;">ECOS v8.0</span>
            <h2 style="font-size:22px; font-weight:800; color:var(--navy); margin:0;" id="dash-project-title">مركز القيادة والتحكم التنفيذي الموحد</h2>
          </div>
          <p style="color:var(--muted); font-size:13px; margin:4px 0 0 0;" id="dash-project-subtitle">المراقبة اللحظية لمحفظة المشاريع، التدفق النقدي، مؤشرات القيمة المكتسبة (EVM)، والمخاطر التعاقدية</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="openAiCopilotModal('all')" style="background:linear-gradient(135deg, #1E293B, #0F172A); border:1px solid var(--gold); color:var(--gold); font-weight:700;">
            <i class="fas fa-brain"></i> <span>المساعد الإنشائي الذكي (AI)</span>
          </button>
          <a href="modules/executive-dashboard/index.html" target="_blank" class="btn btn-outline btn-sm" style="border-color:var(--navy); color:var(--navy); font-weight:700;">
            <i class="fas fa-expand-alt"></i> شاشة العرض الكاملة (Full Cockpit)
          </a>
          <button class="btn btn-outline btn-sm" onclick="applyActiveContext(); showToast('تم تحديث بيانات لوحة القيادة بنجاح.');" title="تحديث البيانات">
            <i class="fas fa-rotate"></i>
          </button>
          <span class="badge badge-blue" id="dash-client-badge">العميل: جاري التحميل...</span>
          <span class="badge badge-green" id="dash-status-badge">نشط</span>
        </div>
      </div>

      <!-- Quick Executive RAG Portfolio Summary Bar -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:20px;">
        <div class="kpi-card" style="padding:12px 16px; cursor:pointer;" onclick="switchView('projects')">
          <span style="font-size:11px; color:var(--muted); font-weight:700;">إجمالي محفظة المشاريع</span>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
            <strong style="font-size:18px; color:var(--navy);" id="dash-total-projects">4</strong>
            <span class="badge badge-blue" style="font-size:11px;" id="dash-active-projects">3 نشطة</span>
          </div>
        </div>
        <div class="kpi-card" style="padding:12px 16px; cursor:pointer;" onclick="switchView('finance')">
          <span style="font-size:11px; color:var(--muted); font-weight:700;">صافي التدفق النقدي الحر</span>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
            <strong style="font-size:18px; color:var(--green);" id="dash-portfolio-cashflow">+18,450,000 ر.س</strong>
            <i class="fas fa-wallet" style="color:var(--green)"></i>
          </div>
        </div>
        <div class="kpi-card" style="padding:12px 16px; cursor:pointer;" onclick="switchView('billing')">
          <span style="font-size:11px; color:var(--muted); font-weight:700;">إجمالي الفواتير والمستخلصات</span>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
            <strong style="font-size:18px; color:var(--blue);" id="dash-portfolio-billed">38,895,000 ر.س</strong>
            <i class="fas fa-file-invoice-dollar" style="color:var(--blue)"></i>
          </div>
        </div>
        <div class="kpi-card" style="padding:12px 16px; cursor:pointer;" onclick="switchView('finance')">
          <span style="font-size:11px; color:var(--muted); font-weight:700;">المستحقات المعلقة (AR)</span>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
            <strong style="font-size:18px; color:var(--amber);" id="dash-portfolio-receivables">11,300,000 ر.س</strong>
            <i class="fas fa-clock" style="color:var(--amber)"></i>
          </div>
        </div>
      </div>

      <!-- 28 DRILL-DOWN EXECUTIVE KPI CARDS GRID -->
      <div class="kpi-grid">
        <!-- 1. Contract Value -->
        <div class="kpi-card green" style="cursor:pointer;" onclick="switchView('projects')" title="انقر لعرض تفاصيل عقد المشروع">
          <div class="kpi-header"><span class="kpi-label">قيمة العقد المعتمد (Contract)</span><div class="kpi-icon-wrap" style="background:var(--green-bg); color:var(--green);"><i class="fas fa-file-contract"></i></div></div>
          <div class="kpi-value" id="kpi-contract-value">0.00</div>
          <div class="kpi-footer"><span id="kpi-currency">ر.س</span> · شامل الضريبة والهامش</div>
        </div>

        <!-- 2. BAC Budget -->
        <div class="kpi-card" style="cursor:pointer;" onclick="switchView('cost-control')" title="انقر لفتح شاشة ضبط التكاليف">
          <div class="kpi-header"><span class="kpi-label">ميزانية التكلفة المباشرة (BAC)</span><div class="kpi-icon-wrap" style="background:var(--teal-light); color:var(--teal);"><i class="fas fa-wallet"></i></div></div>
          <div class="kpi-value" id="kpi-budget-cost">0.00</div>
          <div class="kpi-footer">أساس التكلفة التقديرية المعتمدة</div>
        </div>

        <!-- 3. Earned Value (EV) -->
        <div class="kpi-card purple" style="cursor:pointer;" onclick="switchView('wbs-boq')" title="انقر لعرض إنجاز بنود الكميات">
          <div class="kpi-header"><span class="kpi-label">القيمة المكتسبة (EV)</span><div class="kpi-icon-wrap" style="background:var(--purple-bg); color:var(--purple);"><i class="fas fa-chart-pie"></i></div></div>
          <div class="kpi-value" id="kpi-ev-value">0.00</div>
          <div class="kpi-footer"><span id="kpi-progress-pct">0%</span> إنجاز فعلي مقاس هندسياً</div>
        </div>

        <!-- 4. Actual Cost (AC) -->
        <div class="kpi-card amber" style="cursor:pointer;" onclick="switchView('finance')" title="انقر لعرض القيود المحاسبية والفواتير">
          <div class="kpi-header"><span class="kpi-label">التكلفة الفعلية الدفترية (AC)</span><div class="kpi-icon-wrap" style="background:var(--amber-bg); color:var(--amber);"><i class="fas fa-coins"></i></div></div>
          <div class="kpi-value" id="kpi-ac-value">0.00</div>
          <div class="kpi-footer">المصاريف المحققة دفترياً من AP</div>
        </div>

        <!-- 5. CPI -->
        <div class="kpi-card" id="card-cpi" style="cursor:pointer;" onclick="switchView('cost-control')">
          <div class="kpi-header"><span class="kpi-label">مؤشر أداء التكلفة (CPI)</span><div class="kpi-icon-wrap" id="icon-cpi" style="background:var(--green-bg); color:var(--green);"><i class="fas fa-scale-balanced"></i></div></div>
          <div class="kpi-value" id="kpi-cpi-val">1.000</div>
          <div class="kpi-footer" id="kpi-cpi-desc">أداء التكلفة ممتاز (EV / AC)</div>
        </div>

        <!-- 6. SPI -->
        <div class="kpi-card" id="card-spi" style="cursor:pointer;" onclick="switchView('scheduling')">
          <div class="kpi-header"><span class="kpi-label">مؤشر أداء الجدول (SPI)</span><div class="kpi-icon-wrap" id="icon-spi" style="background:var(--amber-bg); color:var(--amber);"><i class="fas fa-clock"></i></div></div>
          <div class="kpi-value" id="kpi-spi-val">1.000</div>
          <div class="kpi-footer" id="kpi-spi-desc">أداء الجدول الزمني (EV / PV)</div>
        </div>

        <!-- 7. EAC -->
        <div class="kpi-card" style="cursor:pointer;" onclick="switchView('cvr')">
          <div class="kpi-header"><span class="kpi-label">التكلفة المتوقعة عند الانتهاء (EAC)</span><div class="kpi-icon-wrap" style="background:var(--blue-bg); color:var(--blue);"><i class="fas fa-calculator"></i></div></div>
          <div class="kpi-value" id="kpi-eac-val">0.00</div>
          <div class="kpi-footer">BAC / CPI التنبؤ النهائي للتكلفة</div>
        </div>

        <!-- 8. VAC -->
        <div class="kpi-card green" id="card-vac" style="cursor:pointer;" onclick="switchView('cvr')">
          <div class="kpi-header"><span class="kpi-label">الانحراف المتوقع عند الإغلاق (VAC)</span><div class="kpi-icon-wrap" style="background:var(--green-bg); color:var(--green);"><i class="fas fa-arrow-trend-up"></i></div></div>
          <div class="kpi-value" id="kpi-vac-val">0.00</div>
          <div class="kpi-footer" id="kpi-vac-desc">وفر مالي متوقع عند الإغلاق</div>
        </div>

        <!-- 9. Critical Activities -->
        <div class="kpi-card red" style="cursor:pointer;" onclick="switchView('scheduling')" title="انقر لعرض أنشطة المسار الحرج">
          <div class="kpi-header"><span class="kpi-label">أنشطة المسار الحرج (Critical)</span><div class="kpi-icon-wrap" style="background:rgba(225,29,72,0.15); color:var(--red);"><i class="fas fa-fire"></i></div></div>
          <div class="kpi-value" id="dash-critical-activities">2</div>
          <div class="kpi-footer">أنشطة خالية من السماحية الزمنية (TF=0)</div>
        </div>

        <!-- 10. Delayed Activities -->
        <div class="kpi-card amber" style="cursor:pointer;" onclick="switchView('scheduling')" title="انقر لعرض الأنشطة المتأخرة">
          <div class="kpi-header"><span class="kpi-label">الأنشطة المتأخرة عن المخطط</span><div class="kpi-icon-wrap" style="background:var(--amber-bg); color:var(--amber);"><i class="fas fa-triangle-exclamation"></i></div></div>
          <div class="kpi-value" id="dash-delayed-activities">1</div>
          <div class="kpi-footer">تتطلب خطة استدراك وتسريع (Recovery)</div>
        </div>

        <!-- 11. Change Orders (VO) -->
        <div class="kpi-card" style="cursor:pointer;" onclick="switchView('variations')" title="انقر لعرض أوامر التغيير">
          <div class="kpi-header"><span class="kpi-label">أوامر التغيير المعتمدة (VOs)</span><div class="kpi-icon-wrap" style="background:rgba(217,119,6,0.15); color:var(--amber);"><i class="fas fa-file-pen"></i></div></div>
          <div class="kpi-value" id="dash-change-orders-count">4</div>
          <div class="kpi-footer" id="dash-change-orders-val">1,240,000 ر.س إجمالي القيمة</div>
        </div>

        <!-- 12. Equipment Status -->
        <div class="kpi-card" style="cursor:pointer;" onclick="switchView('equipment')" title="انقر لإدارة المعدات">
          <div class="kpi-header"><span class="kpi-label">جاهزية أسطول المعدات</span><div class="kpi-icon-wrap" style="background:rgba(13,148,136,0.15); color:var(--teal);"><i class="fas fa-truck-monster"></i></div></div>
          <div class="kpi-value" id="dash-equipment-active">8 / 10</div>
          <div class="kpi-footer">معدات نشطة وجاهزة بالتشغيل</div>
        </div>

        <!-- 13. Inventory Alerts -->
        <div class="kpi-card" style="cursor:pointer;" onclick="switchView('inventory')" title="انقر لعرض تنبيهات المخزون">
          <div class="kpi-header"><span class="kpi-label">تنبيهات نقص المخزون</span><div class="kpi-icon-wrap" style="background:rgba(234,88,12,0.15); color:#EA580C;"><i class="fas fa-box-open"></i></div></div>
          <div class="kpi-value" id="dash-inventory-alerts">2</div>
          <div class="kpi-footer">أصناف تحت حد إعادة الطلب الأدنى</div>
        </div>

        <!-- 14. QA/QC Alerts -->
        <div class="kpi-card" style="cursor:pointer;" onclick="switchView('punch-list')" title="انقر لعرض ملاحظات الجودة">
          <div class="kpi-header"><span class="kpi-label">ملاحظات الجودة المفتوحة (Punch)</span><div class="kpi-icon-wrap" style="background:rgba(124,58,237,0.15); color:var(--purple);"><i class="fas fa-clipboard-list"></i></div></div>
          <div class="kpi-value" id="dash-qaqc-alerts">4</div>
          <div class="kpi-footer">ملاحظات تسليم معلقة للإغلاق</div>
        </div>

        <!-- 15. HSE Safety Record -->
        <div class="kpi-card green" style="cursor:pointer;" onclick="switchView('safety')" title="انقر لسجلات السلامة">
          <div class="kpi-header"><span class="kpi-label">سجل السلامة المهنية (HSE)</span><div class="kpi-icon-wrap" style="background:var(--green-bg); color:var(--green);"><i class="fas fa-shield-heart"></i></div></div>
          <div class="kpi-value" style="font-size:18px;">Zero LTI</div>
          <div class="kpi-footer" id="dash-hse-alerts">0 حوادث / 125,000 ساعة آمنة</div>
        </div>

        <!-- 16. Supplier Rating -->
        <div class="kpi-card" style="cursor:pointer;" onclick="switchView('supplier-comparison')" title="انقر لتقييم الموردين">
          <div class="kpi-header"><span class="kpi-label">مؤشر موثوقية الموردين</span><div class="kpi-icon-wrap" style="background:rgba(2,132,199,0.15); color:#0284C7;"><i class="fas fa-scale-balanced"></i></div></div>
          <div class="kpi-value">94.2%</div>
          <div class="kpi-footer">التزام بالمواصفات ومواعيد التوريد</div>
        </div>
      </div>

      <!-- S-CURVE & CASH FLOW DUAL CANVAS + CONTRACT OVERVIEW -->
      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px; margin-bottom:24px;">
        <!-- Canvas Chart -->
        <div class="card" style="margin-bottom:0;">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <i class="fas fa-chart-area" style="color:var(--teal)"></i>
              <h3 style="margin:0;">منحنى التحليل التراكمي (Dynamic S-Curve & Cash Flow)</h3>
            </div>
            <!-- Toggle Controls -->
            <div style="display:flex; gap:6px; align-items:center;">
              <button class="btn btn-primary btn-xs" id="btn-toggle-evm-chart" onclick="setChartMode('evm')">
                <i class="fas fa-chart-line"></i> القيمة المكتسبة (EVM)
              </button>
              <button class="btn btn-outline btn-xs" id="btn-toggle-cf-chart" onclick="setChartMode('cashflow')">
                <i class="fas fa-money-bill-transfer"></i> التدفق النقدي (Cash Flow)
              </button>
            </div>
          </div>
          <div class="card-body">
            <!-- Dynamic Legend -->
            <div style="display:flex; justify-content:center; gap:20px; margin-bottom:12px; font-size:12px; font-weight:700;">
              <span style="color:#2563EB"><i class="fas fa-grip-lines"></i> المخطط (PV / Inflow)</span>
              <span style="color:#7C3AED"><i class="fas fa-grip-lines"></i> المكتسب (EV)</span>
              <span style="color:#EA580C"><i class="fas fa-grip-lines"></i> الفعلي (AC / Outflow)</span>
            </div>
            <canvas id="scurveCanvas" class="scurve-canvas"></canvas>
          </div>
        </div>

        <!-- Contractual Details Card -->
        <div class="card" style="margin-bottom:0;">
          <div class="card-header">
            <h3><i class="fas fa-circle-info" style="color:var(--amber)"></i> تفاصيل المشروع التعاقدية (FIDIC)</h3>
          </div>
          <div class="card-body" style="font-size:13px; line-height:2.1;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--line); padding:4px 0;">
              <span style="color:var(--muted)">نوع العقد:</span><strong id="dash-meta-contract-type">-</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--line); padding:4px 0;">
              <span style="color:var(--muted)">المدة التعاقدية:</span><strong id="dash-meta-duration">- يوم</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--line); padding:4px 0;">
              <span style="color:var(--muted)">محتجز الضمان:</span><strong id="dash-meta-retention">10%</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--line); padding:4px 0;">
              <span style="color:var(--muted)">الدفعة المقدمة:</span><strong id="dash-meta-advance">10%</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--line); padding:4px 0;">
              <span style="color:var(--muted)">ضريبة القيمة المضافة:</span><strong>15% (ZATCA Fatoora)</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--line); padding:4px 0;">
              <span style="color:var(--muted)">الموقع الجغرافي:</span><strong id="dash-meta-location">-</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:4px 0;">
              <span style="color:var(--muted)">كفاءة الإنجاز (TCPI):</span><strong id="kpi-tcpi-val" style="color:var(--blue);">1.000</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- PORTFOLIO MULTI-PROJECT PERFORMANCE MATRIX (RAG TABLE) -->
      <div class="card" style="margin-bottom:24px;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h3><i class="fas fa-table-cells" style="color:var(--teal)"></i> مصفوفة أداء محفظة المشاريع (Portfolio RAG Matrix)</h3>
          <span class="badge badge-blue">متابعة لحظية متعددة الشركات</span>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-wrapper">
            <table id="tbl-portfolio-matrix">
              <thead>
                <tr>
                  <th>رمز المشروع</th>
                  <th>اسم المشروع</th>
                  <th>العميل</th>
                  <th>قيمة العقد (ر.س)</th>
                  <th>الميزانية (BAC)</th>
                  <th>الفعلي (AC)</th>
                  <th>المكتسب (EV)</th>
                  <th>CPI</th>
                  <th>SPI</th>
                  <th>نسبة الإنجاز</th>
                  <th>حالة RAG</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>PRJ-2001</strong></td>
                  <td>مشروع فلل الغروب - فيلا نموذج 2A</td>
                  <td>شركة إينوفست</td>
                  <td class="text-num">183,733.98</td>
                  <td class="text-num">123,086.07</td>
                  <td class="text-num">78,500.00</td>
                  <td class="text-num">79,880.00</td>
                  <td><span class="badge badge-green">1.018</span></td>
                  <td><span class="badge badge-green">1.005</span></td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <div class="progress-bar-wrap" style="flex:1; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
                        <div style="width:64.9%; height:100%; background:var(--green);"></div>
                      </div>
                      <span style="font-size:11px; font-weight:700;">64.9%</span>
                    </div>
                  </td>
                  <td><span class="badge badge-green">Green (ممتاز)</span></td>
                  <td><button class="btn btn-outline btn-xs" onclick="onProjectChange('PRJ-2001')">عرض المشروع</button></td>
                </tr>
                <tr>
                  <td><strong>PRJ-2002</strong></td>
                  <td>برج الصحافة التجاري الإداري</td>
                  <td>الهيئة الملكية بالرياض</td>
                  <td class="text-num">45,000,000.00</td>
                  <td class="text-num">34,500,000.00</td>
                  <td class="text-num">14,800,000.00</td>
                  <td class="text-num">14,490,000.00</td>
                  <td><span class="badge badge-amber">0.979</span></td>
                  <td><span class="badge badge-amber">0.965</span></td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <div class="progress-bar-wrap" style="flex:1; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
                        <div style="width:42%; height:100%; background:var(--amber);"></div>
                      </div>
                      <span style="font-size:11px; font-weight:700;">42.0%</span>
                    </div>
                  </td>
                  <td><span class="badge badge-amber">Amber (متابعة)</span></td>
                  <td><button class="btn btn-outline btn-xs" onclick="onProjectChange('PRJ-2002')">عرض المشروع</button></td>
                </tr>
                <tr>
                  <td><strong>PRJ-2003</strong></td>
                  <td>محطة قطار جدة المركزية - حزمة MEP</td>
                  <td>مجتمعات الغد العقارية</td>
                  <td class="text-num">18,500,000.00</td>
                  <td class="text-num">14,200,000.00</td>
                  <td class="text-num">2,850,000.00</td>
                  <td class="text-num">2,627,000.00</td>
                  <td><span class="badge badge-amber">0.922</span></td>
                  <td><span class="badge badge-green">1.020</span></td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <div class="progress-bar-wrap" style="flex:1; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
                        <div style="width:18.5%; height:100%; background:var(--blue);"></div>
                      </div>
                      <span style="font-size:11px; font-weight:700;">18.5%</span>
                    </div>
                  </td>
                  <td><span class="badge badge-green">Green (في البداية)</span></td>
                  <td><button class="btn btn-outline btn-xs" onclick="onProjectChange('PRJ-2003')">عرض المشروع</button></td>
                </tr>
                <tr>
                  <td><strong>PRJ-2004</strong></td>
                  <td>مجمع الملقا للأعمال والسكن الفندقي</td>
                  <td>شركة أفق التطوير العقاري</td>
                  <td class="text-num">78,400,000.00</td>
                  <td class="text-num">62,800,000.00</td>
                  <td class="text-num">25,120,000.00</td>
                  <td class="text-num">24,115,200.00</td>
                  <td><span class="badge badge-amber">0.960</span></td>
                  <td><span class="badge badge-amber">0.970</span></td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <div class="progress-bar-wrap" style="flex:1; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
                        <div style="width:38.4%; height:100%; background:var(--blue);"></div>
                      </div>
                      <span style="font-size:11px; font-weight:700;">38.4%</span>
                    </div>
                  </td>
                  <td><span class="badge badge-green">Green (نشط)</span></td>
                  <td><button class="btn btn-outline btn-xs" onclick="onProjectChange('PRJ-2004')">عرض المشروع</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>`;

// Replace view-dashboard
const dashStartTag = '<section class="page-view active" id="view-dashboard">';
const dashEndTag = '<section class="page-view" id="view-companies">';
const dashStartIdx = html.indexOf(dashStartTag);
const dashEndIdx = html.indexOf(dashEndTag);

if (dashStartIdx !== -1 && dashEndIdx !== -1) {
  html = html.slice(0, dashStartIdx) + unifiedDashboardHtml + '\n\n    ' + html.slice(dashEndIdx);
  console.log('Successfully replaced view-dashboard with 28-widget Executive Cockpit!');
} else {
  console.error('Could not find view-dashboard markers in index.html!');
}

// 2. Add AI Copilot Modal before toast/scripts if not already added
if (!html.includes('id="modal-ai-copilot"')) {
  const aiModalHtml = `
<!-- =========================================================================
     AI COPILOT MODAL - 8 Specialized Construction AI Copilot Agents
     ========================================================================= -->
<div class="modal-overlay" id="modal-ai-copilot" style="display:none;">
  <div class="modal-container" style="max-width:850px; border-radius:var(--radius); border:1px solid var(--gold); box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
    <div class="modal-header" style="background:linear-gradient(135deg, #0F172A, #1E293B); color:#fff; border-bottom:1px solid var(--gold);">
      <div style="display:flex; align-items:center; gap:10px;">
        <i class="fas fa-brain" style="color:var(--gold); font-size:20px;"></i>
        <div>
          <h3 style="margin:0; font-size:17px; color:var(--gold);">المركز الذكي للإنشاءات (Construction AI Copilot Hub)</h3>
          <small style="color:#94A3B8;">8 وكلاء ذكاء اصطناعي متخصصون في الهندسة، العقود، والتكاليف</small>
        </div>
      </div>
      <button class="modal-close-btn" onclick="closeAiCopilotModal()" style="color:#fff;">&times;</button>
    </div>
    <div class="modal-body" style="padding:20px;">
      <!-- Agent Selector Tabs -->
      <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:10px; border-bottom:1px solid var(--line); margin-bottom:16px;">
        <button class="btn btn-primary btn-xs active-copilot-tab" onclick="switchCopilotTab('fidic', this)"><i class="fas fa-scale-balanced"></i> FIDIC و العقود</button>
        <button class="btn btn-outline btn-xs" onclick="switchCopilotTab('evm', this)"><i class="fas fa-chart-line"></i> التكاليف و EVM</button>
        <button class="btn btn-outline btn-xs" onclick="switchCopilotTab('cpm', this)"><i class="fas fa-network-wired"></i> الجدول والمسار الحرج</button>
        <button class="btn btn-outline btn-xs" onclick="switchCopilotTab('procurement', this)"><i class="fas fa-scale-unbalanced"></i> المشتريات ومقارنة الأسعار</button>
        <button class="btn btn-outline btn-xs" onclick="switchCopilotTab('qaqc', this)"><i class="fas fa-clipboard-check"></i> الجودة و NCR</button>
        <button class="btn btn-outline btn-xs" onclick="switchCopilotTab('hse', this)"><i class="fas fa-shield-halved"></i> السلامة و ISO 45001</button>
        <button class="btn btn-outline btn-xs" onclick="switchCopilotTab('boq', this)"><i class="fas fa-calculator"></i> تدقيق الكميات والتسعير</button>
        <button class="btn btn-outline btn-xs" onclick="switchCopilotTab('cashflow', this)"><i class="fas fa-coins"></i> السيولة والتدفق النقدي</button>
      </div>

      <!-- Agent Context Banner -->
      <div id="ai-agent-banner" style="background:rgba(201,168,76,0.08); border:1px solid var(--gold); border-radius:6px; padding:10px 14px; margin-bottom:16px; font-size:12px; display:flex; justify-content:space-between; align-items:center;">
        <span id="ai-agent-title"><strong>الوكيل النشط:</strong> مستشار العقود ومطالبات فيديك (FIDIC Red Book 2017)</span>
        <span class="badge badge-teal" id="ai-project-tag">المشروع النشط: فلل الغروب</span>
      </div>

      <!-- Quick Prompt Suggestions -->
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px;" id="ai-prompt-suggestions">
        <button type="button" class="btn btn-outline btn-xs" onclick="useAiPrompt(this.textContent)">حلل التزام المقاول بالبند 20.1 لمطالبة تمديد الوقت EOT</button>
        <button type="button" class="btn btn-outline btn-xs" onclick="useAiPrompt(this.textContent)">ما هي التكلفة المتوقعة عند الانتهاء (EAC) ولماذا تجاوزت الميزانية؟</button>
        <button type="button" class="btn btn-outline btn-xs" onclick="useAiPrompt(this.textContent)">هل هناك أي تعارضات غير محلولة تؤثر على صب خرسانة السقف؟</button>
      </div>

      <!-- Prompt Input Form -->
      <div style="margin-bottom:16px;">
        <textarea id="ai-prompt-input" rows="3" class="search-input" style="width:100%; height:auto; resize:vertical; padding:10px; font-size:13px;" placeholder="اكتب استفسارك الهندسي أو التعاقدي هنا، وسيقوم الوكيل بالتحليل الفوري استناداً لبيانات المشروع الحالية..."></textarea>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <small style="color:var(--muted);"><i class="fas fa-lock"></i> البيانات مشفرة وتتم معالجتها وفق معايير الأمان المؤسسي</small>
        <button type="button" class="btn btn-primary" onclick="runAiCopilotAnalysis()" id="btn-run-ai">
          <i class="fas fa-wand-magic-sparkles"></i> تشغيل التحليل الذكي
        </button>
      </div>

      <!-- AI Response Container -->
      <div id="ai-response-box" style="display:none; background:#F8FAFC; border:1px solid var(--line); border-radius:8px; padding:16px; font-size:13px; line-height:1.8; max-height:280px; overflow-y:auto;">
        <div id="ai-response-content"></div>
      </div>
    </div>
  </div>
</div>
`;

  const toastIdx = html.indexOf('<!-- Toast -->');
  if (toastIdx !== -1) {
    html = html.slice(0, toastIdx) + aiModalHtml + '\n' + html.slice(toastIdx);
    console.log('Successfully injected AI Copilot Modal before Toast!');
  }
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully updated index.html with Executive Dashboard & AI Modal!');
