const fs = require('fs');

const indexPath = 'index.html';
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Build the 26-Discipline Sidebar HTML
const newSidebarNav = `    <!-- =========================================================================
         ERP-SYS V8 ENTERPRISE CONSTRUCTION OPERATING SYSTEM (ECOS)
         26-Discipline Expandable Tree Navigation
         ========================================================================= -->

    <!-- DISCIPLINE 1: لوحات القيادة والمتابعة -->
    <div class="nav-group" id="nav-grp-dashboard">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-gauge-high nav-group-icon"></i>
          <span>لوحات القيادة (Dashboard Center)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">3</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item active" onclick="switchView('dashboard')">
          <i class="fas fa-gauge-high"></i><span class="nav-text">لوحة التحكم التنفيذية الموحدة</span>
        </a>
        <a class="nav-item" onclick="switchView('cost-control')">
          <i class="fas fa-chart-line"></i><span class="nav-text">ضبط التكاليف (EVM)</span>
          <span class="badge-pill" style="background:rgba(0,141,218,0.3)">AACE</span>
        </a>
        <a class="nav-item" onclick="switchView('evm')">
          <i class="fas fa-chart-gantt"></i><span class="nav-text">مرصد القيمة المكتسبة المتكامل</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 2: المشاريع والمحفظة -->
    <div class="nav-group collapsed" id="nav-grp-projects">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-diagram-project nav-group-icon"></i>
          <span>المشاريع (Projects Center)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">3</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('projects')">
          <i class="fas fa-list-check"></i><span class="nav-text">محفظة المشاريع والعقود</span>
        </a>
        <a class="nav-item" onclick="switchView('companies')">
          <i class="fas fa-building-user"></i><span class="nav-text">الشركات القابضة والفروع</span>
        </a>
        <a class="nav-item" onclick="switchView('partners')">
          <i class="fas fa-handshake-simple"></i><span class="nav-text">الشركاء والعملاء (BP 360°)</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 3: التخطيط والجدولة الزمنية -->
    <div class="nav-group collapsed" id="nav-grp-scheduling">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-calendar-days nav-group-icon"></i>
          <span>التخطيط والجدولة (Planning & Scheduling)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('scheduling')">
          <i class="fas fa-network-wired"></i><span class="nav-text">الجدول الزمني والمسار الحرج CPM</span>
          <span class="badge-pill" style="background:rgba(16,185,129,0.25)">P6 XER</span>
        </a>
        <a class="nav-item" onclick="switchView('site-diary')">
          <i class="fas fa-calendar-check"></i><span class="nav-text">يوميات وسجلات الموقع</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 4: المكتب الفني والاعتمادات -->
    <div class="nav-group collapsed" id="nav-grp-techoffice">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-drafting-compass nav-group-icon"></i>
          <span>المكتب الفني (Technical Office)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">5</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('submittals')">
          <i class="fas fa-file-circle-check"></i><span class="nav-text">اعتمادات المخططات والمواد</span>
          <span class="badge-pill" style="background:rgba(13,148,136,0.3)">Codes A-D</span>
        </a>
        <a class="nav-item" onclick="switchView('rfi')">
          <i class="fas fa-circle-question"></i><span class="nav-text">استفسارات الموقع الفنية RFI</span>
        </a>
        <a class="nav-item" onclick="switchView('rebar')">
          <i class="fas fa-bars-staggered"></i><span class="nav-text">تفريد حديد التسليح (BBS)</span>
        </a>
        <a class="nav-item" onclick="switchView('bim-viewer')">
          <i class="fas fa-cubes"></i><span class="nav-text">نمذجة البناء 3D / 4D BIM</span>
        </a>
        <a class="nav-item" onclick="switchView('clash')">
          <i class="fas fa-arrows-to-dot"></i><span class="nav-text">فحص التعارضات (BIM Clash)</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 5: جدول الكميات وحصر الأعمال -->
    <div class="nav-group collapsed" id="nav-grp-qs">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-ruler-combined nav-group-icon"></i>
          <span>حصر الكميات (BOQ & QS)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">4</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('wbs-boq')">
          <i class="fas fa-sitemap"></i><span class="nav-text">جدول الكميات وهيكل WBS/BOQ</span>
        </a>
        <a class="nav-item" onclick="switchView('takeoff')">
          <i class="fas fa-clipboard-check"></i><span class="nav-text">دفتر الحصر الهندسي (QTO)</span>
        </a>
        <a class="nav-item" onclick="switchView('rate-analysis')">
          <i class="fas fa-calculator"></i><span class="nav-text">التحليل السعري للبنود</span>
        </a>
        <a class="nav-item" onclick="switchView('billing')">
          <i class="fas fa-file-invoice-dollar"></i><span class="nav-text">المستخلصات التراكمية (IPC)</span>
          <span class="badge-pill" style="background:rgba(5,150,105,0.3)">ZATCA</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 6: مراقبة التكاليف -->
    <div class="nav-group collapsed" id="nav-grp-costcontrol">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-chart-line nav-group-icon"></i>
          <span>مراقبة التكاليف (Cost Control)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('cost-control')">
          <i class="fas fa-chart-pie"></i><span class="nav-text">محرك ضبط التكاليف والقيمة المكتسبة</span>
        </a>
        <a class="nav-item" onclick="switchView('cvr')">
          <i class="fas fa-scale-balanced"></i><span class="nav-text">سجل CVR — تسوية التكلفة والقيمة</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 7: المشتريات -->
    <div class="nav-group collapsed" id="nav-grp-procurement">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-cart-shopping nav-group-icon"></i>
          <span>المشتريات (Procurement)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('procurement')">
          <i class="fas fa-file-invoice"></i><span class="nav-text">أوامر الشراء والتوريد (PO)</span>
        </a>
        <a class="nav-item" onclick="switchView('supplier-comparison')">
          <i class="fas fa-scale-balanced"></i><span class="nav-text">مقارنة عروض الأسعار (3-Way)</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 8: الموردون -->
    <div class="nav-group collapsed" id="nav-grp-suppliers">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-truck-moving nav-group-icon"></i>
          <span>الموردون (Suppliers Intelligence)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('partners')">
          <i class="fas fa-address-book"></i><span class="nav-text">دليل الموردين المعتمدين والمؤهلين</span>
        </a>
        <a class="nav-item" onclick="switchView('supplier-comparison')">
          <i class="fas fa-star-half-stroke"></i><span class="nav-text">تقييم أداء وموثوقية الموردين</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 9: المواد والمواصفات -->
    <div class="nav-group collapsed" id="nav-grp-materials">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-cubes-stacked nav-group-icon"></i>
          <span>المواد (Materials Intelligence)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('inventory')">
          <i class="fas fa-list"></i><span class="nav-text">كتالوج المواد والمواصفات الفنية</span>
        </a>
        <a class="nav-item" onclick="switchView('takeoff')">
          <i class="fas fa-layer-group"></i><span class="nav-text">تتبع استهلاك المواد وربط BOQ</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 10: مقاولو الباطن -->
    <div class="nav-group collapsed" id="nav-grp-subcontractors">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-users-gear nav-group-icon"></i>
          <span>مقاولو الباطن (Subcontractors)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('subcontracts')">
          <i class="fas fa-file-contract"></i><span class="nav-text">إدارة عقود مقاولي الباطن</span>
        </a>
        <a class="nav-item" onclick="switchView('contractors-matrix')">
          <i class="fas fa-ranking-star"></i><span class="nav-text">مصفوفة تصنيف وتقييم المقاولين</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 11: العقود -->
    <div class="nav-group collapsed" id="nav-grp-contracts">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-file-signature nav-group-icon"></i>
          <span>العقود (Contracts Administration)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('contract-admin')">
          <i class="fas fa-book"></i><span class="nav-text">إدارة العقود الرئيسية (FIDIC Red Book)</span>
        </a>
        <a class="nav-item" onclick="switchView('subcontracts')">
          <i class="fas fa-file-lines"></i><span class="nav-text">ملحقات العقود والضمانات البنكية</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 12: المطالبات وأوامر التغيير -->
    <div class="nav-group collapsed" id="nav-grp-claims">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-file-pen nav-group-icon"></i>
          <span>المطالبات والتغييرات (Claims & Variations)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('variations')">
          <i class="fas fa-hand-holding-dollar"></i><span class="nav-text">أوامر التغيير (Change Orders)</span>
          <span class="badge-pill" style="background:rgba(217,119,6,0.3)">Variations</span>
        </a>
        <a class="nav-item" onclick="switchView('contract-admin')">
          <i class="fas fa-clock-rotate-left"></i><span class="nav-text">تمديد المدة والمطالبات التعاقدية (EOT)</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 13: المستودعات والمخازن -->
    <div class="nav-group collapsed" id="nav-grp-inventory">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-warehouse nav-group-icon"></i>
          <span>المستودعات (Inventory & Warehouse)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">1</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('inventory')">
          <i class="fas fa-boxes-stacked"></i><span class="nav-text">إدارة المخازن المتعددة وأذونات الصرف</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 14: المعدات والآليات -->
    <div class="nav-group collapsed" id="nav-grp-equipment">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-truck-monster nav-group-icon"></i>
          <span>المعدات والآليات (Plant & Equipment)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">1</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('equipment')">
          <i class="fas fa-screwdriver-wrench"></i><span class="nav-text">أسطول الآليات، التشغيل والصيانة</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 15: الموارد الإنشائية -->
    <div class="nav-group collapsed" id="nav-grp-resources">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-people-carry-box nav-group-icon"></i>
          <span>الموارد (Resource Management)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('scheduling')">
          <i class="fas fa-users-viewfinder"></i><span class="nav-text">تخصيص وتحميل الموارد الإنشائية</span>
        </a>
        <a class="nav-item" onclick="switchView('equipment')">
          <i class="fas fa-gas-pump"></i><span class="nav-text">كفاءة تشغيل المعدات والمحروقات</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 16: الموارد البشرية والرواتب -->
    <div class="nav-group collapsed" id="nav-grp-hr">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-user-tie nav-group-icon"></i>
          <span>الموارد البشرية (HR & Payroll)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('hr')">
          <i class="fas fa-id-card"></i><span class="nav-text">الكادر الوظيفي والعمالة الإنشائية</span>
        </a>
        <a class="nav-item" onclick="switchView('payroll')">
          <i class="fas fa-money-bill-wave"></i><span class="nav-text">مسيرات الرواتب وحماية الأجور WPS</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 17: الإدارة المالية -->
    <div class="nav-group collapsed" id="nav-grp-finance">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-landmark nav-group-icon"></i>
          <span>الإدارة المالية (Finance & Accounts)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('finance')">
          <i class="fas fa-coins"></i><span class="nav-text">الحسابات العامة ومراكز التكلفة</span>
        </a>
        <a class="nav-item" onclick="switchView('billing')">
          <i class="fas fa-file-invoice"></i><span class="nav-text">الفواتير الضريبية ZATCA Fatoora</span>
          <span class="badge-pill" style="background:rgba(5,150,105,0.3)">Phase 2</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 18: إدارة علاقات العملاء -->
    <div class="nav-group collapsed" id="nav-grp-crm">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-handshake nav-group-icon"></i>
          <span>علاقات العملاء (Construction CRM)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">1</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('crm')">
          <i class="fas fa-funnel-dollar"></i><span class="nav-text">الفرص التعاقدية وسجل العملاء</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 19: ضبط وتوكيد الجودة -->
    <div class="nav-group collapsed" id="nav-grp-qaqc">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-clipboard-check nav-group-icon"></i>
          <span>الجودة (QA/QC Management)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('qa-qc')">
          <i class="fas fa-list-check"></i><span class="nav-text">خطط الفحص والاختبار (ITP / NCR)</span>
        </a>
        <a class="nav-item" onclick="switchView('punch-list')">
          <i class="fas fa-clipboard-list"></i><span class="nav-text">قوائم الملاحظات والتسليم (Punch List)</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 20: السلامة والصحة المهنية والبيئة -->
    <div class="nav-group collapsed" id="nav-grp-hse">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-hard-hat nav-group-icon"></i>
          <span>السلامة والبيئة (HSE ISO 45001)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">1</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('safety')">
          <i class="fas fa-shield-heart"></i><span class="nav-text">إدارة السلامة وتصاريح العمل PTW</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 21: إدارة الوثائق والمراسلات -->
    <div class="nav-group collapsed" id="nav-grp-doccontrol">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-folder-tree nav-group-icon"></i>
          <span>إدارة الوثائق (Document Control)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('doc-control')">
          <i class="fas fa-envelope-open-text"></i><span class="nav-text">المراسلات الرسمية والترانزميتال</span>
        </a>
        <a class="nav-item" onclick="switchView('cde')">
          <i class="fas fa-cloud-arrow-up"></i><span class="nav-text">بيئة البيانات المشتركة CDE (ISO 19650)</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 22: المناقصات والعطاءات -->
    <div class="nav-group collapsed" id="nav-grp-tenders">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-gavel nav-group-icon"></i>
          <span>المناقصات (Tenders & Bidding)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">1</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('tenders')">
          <i class="fas fa-award"></i><span class="nav-text">حزم العطاءات والتسعير التنافسي</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 23: مكتب إدارة المشاريع المؤسسي -->
    <div class="nav-group collapsed" id="nav-grp-pmo">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-sitemap nav-group-icon"></i>
          <span>مكتب إدارة المشاريع (PMO)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('reports')">
          <i class="fas fa-chart-column"></i><span class="nav-text">مؤشرات حوكمة المحفظة</span>
        </a>
        <a class="nav-item" onclick="switchView('cvr')">
          <i class="fas fa-balance-scale-right"></i><span class="nav-text">تقرير CVR التنفيذي</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 24: مركز الذكاء الاصطناعي الإنشائي -->
    <div class="nav-group collapsed" id="nav-grp-ai">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-brain nav-group-icon" style="color:var(--gold)"></i>
          <span>الذكاء الاصطناعي (AI Center)</span>
        </div>
        <div class="nav-group-meta">
          <span class="badge-pill" style="background:rgba(201,168,76,0.3); color:var(--gold); font-size:10px;">8 Copilots</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="openAiCopilotModal('fidic')">
          <i class="fas fa-scale-balanced" style="color:var(--gold)"></i><span class="nav-text">محلل بنود FIDIC والعقود</span>
        </a>
        <a class="nav-item" onclick="openAiCopilotModal('evm')">
          <i class="fas fa-chart-line" style="color:var(--teal)"></i><span class="nav-text">التنبؤ بانحراف التكلفة EVM</span>
        </a>
        <a class="nav-item" onclick="openAiCopilotModal('procurement')">
          <i class="fas fa-microchip" style="color:var(--blue)"></i><span class="nav-text">مساعد تدقيق عروض الأسعار</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 25: مركز التقارير و BI -->
    <div class="nav-group collapsed" id="nav-grp-reports">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-chart-pie nav-group-icon"></i>
          <span>التقارير و BI (Reports Center)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('reports')">
          <i class="fas fa-chart-simple"></i><span class="nav-text">التقارير المؤسسية وذكاء الأعمال</span>
        </a>
        <a class="nav-item" onclick="switchView('audit-trail')">
          <i class="fas fa-fingerprint"></i><span class="nav-text">سجل التدقيق الأمني (Audit Log)</span>
        </a>
      </div>
    </div>

    <!-- DISCIPLINE 26: إدارة المنظومة -->
    <div class="nav-group collapsed" id="nav-grp-admin">
      <div class="nav-group-header" onclick="toggleNavGroup(this)">
        <div class="nav-group-title">
          <i class="fas fa-gears nav-group-icon"></i>
          <span>إدارة المنظومة (Administration)</span>
        </div>
        <div class="nav-group-meta">
          <span class="nav-group-count">2</span>
          <i class="fas fa-chevron-down nav-group-chevron"></i>
        </div>
      </div>
      <div class="nav-group-items">
        <a class="nav-item" onclick="switchView('settings')">
          <i class="fas fa-sliders"></i><span class="nav-text">إعدادات المنظومة وصلاحيات RBAC</span>
        </a>
        <a class="nav-item" onclick="switchView('audit-trail')">
          <i class="fas fa-shield-halved"></i><span class="nav-text">أمان النظام والتدقيق والامتثال</span>
        </a>
      </div>
    </div>`;

// Replace sidebar nav in index.html
const navStartTag = '<nav class="sidebar-nav">';
const navEndTag = '</nav>';
const navStartIdx = html.indexOf(navStartTag);
const navEndIdx = html.indexOf(navEndTag, navStartIdx);

if (navStartIdx !== -1 && navEndIdx !== -1) {
  const actionsHeader = `    <div class="sidebar-nav-actions">
      <button type="button" class="nav-action-btn" onclick="collapseAllNavGroups(true)" title="طي جميع الأقسام">
        <i class="fas fa-compress-alt"></i> <span>طي الكل</span>
      </button>
      <button type="button" class="nav-action-btn" onclick="collapseAllNavGroups(false)" title="فتح جميع الأقسام">
        <i class="fas fa-expand-alt"></i> <span>توسيع الكل</span>
      </button>
    </div>\n\n`;

  html = html.slice(0, navStartIdx + navStartTag.length) + '\n' + actionsHeader + newSidebarNav + '\n  ' + html.slice(navEndIdx);
  console.log('Sidebar navigation updated successfully to 26 disciplines!');
} else {
  console.error('Could not find sidebar nav boundaries!');
}

// Update version label
html = html.replace('v7.0.0 Enterprise SaaS', 'v8.0.0 Enterprise Construction OS (ECOS)');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully saved sidebar changes to index.html');
