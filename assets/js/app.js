/* ==========================================================================
   APP.JS - Main Controller, Navigation & View Generators
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  populateCompanyDropdown();
  populateProjectDropdown();
  applyActiveContext();
  renderAllViews();
  drawSCurve();
});

function populateCompanyDropdown() {
  const sel = document.getElementById("ctx-company");
  if (!sel) return;
  sel.innerHTML = "";
  MimarERP.companies.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.company_id;
    opt.textContent = `${c.company_name_ar} (${c.company_code})`;
    if (c.company_id === MimarERP.currentCompanyId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function populateProjectDropdown() {
  const sel = document.getElementById("ctx-project");
  if (!sel) return;
  sel.innerHTML = "";
  const matching = MimarERP.projects.filter(p => p.company_id === MimarERP.currentCompanyId);
  matching.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.project_id;
    opt.textContent = `${p.project_name_ar} (${p.project_code})`;
    if (p.project_id === MimarERP.currentProjectId) opt.selected = true;
    sel.appendChild(opt);
  });
  if (matching.length > 0 && !matching.some(p => p.project_id === MimarERP.currentProjectId)) {
    MimarERP.currentProjectId = matching[0].project_id;
  }
}

function onCompanyChange(newCompanyId) {
  MimarERP.currentCompanyId = newCompanyId;
  populateProjectDropdown();
  applyActiveContext();
  renderAllViews();
  showToast("تم تحويل سياق الشركة إلى: " + getActiveCompany().company_name_ar);
}

function onProjectChange(newProjectId) {
  MimarERP.currentProjectId = newProjectId;
  applyActiveContext();
  renderAllViews();
  showToast("تم تحويل سياق المشروع إلى: " + getActiveProject().project_name_ar);
}

function onRoleChange(newRole) {
  MimarERP.currentRole = newRole;
  showToast("تم تفعيل صلاحيات دور: " + newRole);
}

function getActiveCompany() {
  return MimarERP.companies.find(c => c.company_id === MimarERP.currentCompanyId) || MimarERP.companies[0];
}

function getActiveProject() {
  return MimarERP.projects.find(p => p.project_id === MimarERP.currentProjectId) || MimarERP.projects[0];
}

function applyActiveContext() {
  const prj = getActiveProject();
  const client = MimarERP.partners.find(p => p.partner_id === prj.client_id);

  document.getElementById("dash-project-title").textContent = prj.project_name_ar;
  document.getElementById("dash-project-subtitle").textContent = `${prj.project_code} · ${prj.location} · ${prj.contract_type}`;
  document.getElementById("dash-client-badge").textContent = "العميل: " + (client ? client.partner_name : "غير محدد");
  document.getElementById("dash-status-badge").textContent = prj.status;

  document.getElementById("dash-meta-contract-type").textContent = prj.contract_type;
  document.getElementById("dash-meta-duration").textContent = prj.contract_duration_days + " يوم";
  document.getElementById("dash-meta-retention").textContent = prj.retention_pct + "%";
  document.getElementById("dash-meta-advance").textContent = prj.advance_payment_pct + "%";
  document.getElementById("dash-meta-location").textContent = prj.location;

  calculateEVM(prj);
}

function switchView(viewId) {
  document.querySelectorAll(".page-view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  
  const target = document.getElementById("view-" + viewId);
  if (target) target.classList.add("active");

  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(n => {
    if (n.getAttribute("onclick") && n.getAttribute("onclick").includes(viewId)) {
      n.classList.add("active");
    }
  });

  if (viewId === "dashboard") drawSCurve();
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}

function renderAllViews() {
  renderCompaniesTable();
  renderBranchesTable();
  renderPartnersTable();
  renderProjectsTable();
  renderWBSBOQTree();
  renderTakeoffTable();
  renderRateAnalysisCards();
  renderProcurementTable();
  renderInventoryTable();
  renderSubcontractsTable();
  renderScheduleTable();
  renderBillingTable();
  renderInspectionsTable();
  renderDrawingsTable();
  renderSelectedReport("rep-cvr");
}

function renderCompaniesTable() {
  const tbody = document.querySelector("#tbl-companies tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  MimarERP.companies.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${c.company_code}</strong></td>
      <td><strong>${c.company_name_ar}</strong></td>
      <td>${c.company_name_en}</td>
      <td class="text-num">${c.commercial_registration}</td>
      <td class="text-num">${c.tax_identification_number}</td>
      <td class="text-center"><span class="badge badge-blue">${c.base_currency}</span></td>
      <td class="text-num">${c.phone}</td>
      <td><span class="badge badge-green">${c.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderBranchesTable() {
  const tbody = document.querySelector("#tbl-branches tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  MimarERP.branches.forEach(b => {
    const comp = MimarERP.companies.find(c => c.company_id === b.company_id);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num">${b.branch_id}</td>
      <td>${comp ? comp.company_name_ar : b.company_id}</td>
      <td class="text-num">${b.branch_code}</td>
      <td>${b.branch_name_ar}</td>
      <td>${b.location}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPartnersTable() {
  const tbody = document.querySelector("#tbl-partners tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  document.getElementById("count-partners").textContent = MimarERP.partners.length + " شريك معتمد";
  
  MimarERP.partners.forEach(p => {
    const typeBadge = p.partner_type === "Client" ? "badge-green" : (p.partner_type === "Supplier" ? "badge-blue" : (p.partner_type === "Subcontractor" ? "badge-purple" : "badge-amber"));
    const itemsCount = (MimarERP.partnerCatalog || []).filter(c => c.partner_id === p.partner_id).length;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${p.partner_code}</strong></td>
      <td><strong>${p.partner_name}</strong></td>
      <td><span class="badge ${typeBadge}">${p.partner_type}</span></td>
      <td>${p.category}</td>
      <td class="text-num">${p.tax_number}</td>
      <td class="text-num">${p.cr_number}</td>
      <td><small><i class="fas fa-location-dot" style="color:var(--red); margin-left:4px;"></i>${p.location || 'المملكة العربية السعودية'}</small></td>
      <td><small><i class="fas fa-user-tie" style="color:var(--navy); margin-left:4px;"></i>${p.owner || 'الإدارة التنفيذية'}</small></td>
      <td>${p.contact}</td>
      <td class="text-center"><span class="badge badge-green">${p.rating}</span></td>
      <td><span class="badge badge-green">${p.status}</span></td>
      <td class="text-center">
        ${itemsCount > 0 ? 
          `<button class="btn btn-outline btn-xs" onclick="filterCatalogByPartner('${p.partner_id}')" title="عرض خامات وأسعار هذا الشريك"><i class="fas fa-boxes-stacked"></i> الخامات (${itemsCount})</button>` : 
          `<button class="btn btn-outline btn-xs" onclick="openAddCatalogModal('${p.partner_id}')" title="إضافة خامات لهذا الشريك"><i class="fas fa-plus"></i> إضافة خامة</button>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });

  populateCatalogPartnerDropdowns();
}

function filterPartnersTable() {
  const q = (document.getElementById("search-partners").value || "").trim().toLowerCase();
  const typeFilter = document.getElementById("filter-partner-type").value;
  const tbody = document.querySelector("#tbl-partners tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filtered = MimarERP.partners.filter(p => {
    const matchType = !typeFilter || p.partner_type === typeFilter;
    const matchQ = !q || 
      (p.partner_name && p.partner_name.toLowerCase().includes(q)) ||
      (p.partner_code && p.partner_code.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q)) ||
      (p.owner && p.owner.toLowerCase().includes(q)) ||
      (p.cr_number && p.cr_number.includes(q)) ||
      (p.tax_number && p.tax_number.includes(q));
    return matchType && matchQ;
  });

  filtered.forEach(p => {
    const typeBadge = p.partner_type === "Client" ? "badge-green" : (p.partner_type === "Supplier" ? "badge-blue" : (p.partner_type === "Subcontractor" ? "badge-purple" : "badge-amber"));
    const itemsCount = (MimarERP.partnerCatalog || []).filter(c => c.partner_id === p.partner_id).length;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${p.partner_code}</strong></td>
      <td><strong>${p.partner_name}</strong></td>
      <td><span class="badge ${typeBadge}">${p.partner_type}</span></td>
      <td>${p.category}</td>
      <td class="text-num">${p.tax_number}</td>
      <td class="text-num">${p.cr_number}</td>
      <td><small><i class="fas fa-location-dot" style="color:var(--red); margin-left:4px;"></i>${p.location || 'المملكة العربية السعودية'}</small></td>
      <td><small><i class="fas fa-user-tie" style="color:var(--navy); margin-left:4px;"></i>${p.owner || 'الإدارة التنفيذية'}</small></td>
      <td>${p.contact}</td>
      <td class="text-center"><span class="badge badge-green">${p.rating}</span></td>
      <td><span class="badge badge-green">${p.status}</span></td>
      <td class="text-center">
        ${itemsCount > 0 ? 
          `<button class="btn btn-outline btn-xs" onclick="filterCatalogByPartner('${p.partner_id}')" title="عرض خامات وأسعار هذا الشريك"><i class="fas fa-boxes-stacked"></i> الخامات (${itemsCount})</button>` : 
          `<button class="btn btn-outline btn-xs" onclick="openAddCatalogModal('${p.partner_id}')" title="إضافة خامات لهذا الشريك"><i class="fas fa-plus"></i> إضافة خامة</button>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPartnerCatalogTable() {
  const tbody = document.querySelector("#tbl-partner-catalog tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const catalog = MimarERP.partnerCatalog || [];
  let sumExcl = 0;
  let sumVat = 0;
  let sumIncl = 0;
  const uniquePartners = new Set();

  catalog.forEach(item => {
    sumExcl += item.total_before_vat || 0;
    sumVat += item.total_vat || 0;
    sumIncl += item.total_after_vat || 0;
    uniquePartners.add(item.partner_id);

    const typeBadge = item.partner_type === "Supplier" ? "badge-blue" : "badge-purple";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${item.item_code}</strong></td>
      <td><strong>${item.desc}</strong></td>
      <td><span class="badge ${typeBadge}" style="margin-left:4px;">${item.partner_code}</span>${item.partner_name}</td>
      <td><span class="badge ${typeBadge}">${item.partner_type}</span></td>
      <td>${item.category}</td>
      <td class="text-center"><span class="badge badge-blue">${item.unit}</span></td>
      <td class="text-num">${(item.qty || 0).toLocaleString()}</td>
      <td class="text-num">${(item.price_before_vat || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      <td class="text-num" style="color:var(--text-muted)">${(item.unit_vat || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      <td class="text-num" style="color:var(--blue); font-weight:bold;">${(item.price_after_vat || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      <td class="text-num">${(item.total_before_vat || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      <td class="text-num">${(item.total_vat || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      <td class="text-num" style="color:var(--teal); font-weight:bold;">${(item.total_after_vat || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      <td><small><i class="fas fa-location-dot" style="color:var(--red); margin-left:4px;"></i>${item.location || '-'}</small></td>
      <td><small><i class="fas fa-user-check" style="color:var(--green); margin-left:4px;"></i>${item.owner || '-'}</small></td>
      <td><span class="badge badge-green">${item.status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  // Update KPI counters
  const elTotalItems = document.getElementById("cat-kpi-total-items");
  if (elTotalItems) elTotalItems.textContent = catalog.length;
  const elPartnersCount = document.getElementById("cat-kpi-partners-count");
  if (elPartnersCount) elPartnersCount.textContent = uniquePartners.size;
  const elTotalExcl = document.getElementById("cat-kpi-total-excl");
  if (elTotalExcl) elTotalExcl.textContent = sumExcl.toLocaleString(undefined, {maximumFractionDigits:0}) + " SAR";
  const elTotalIncl = document.getElementById("cat-kpi-total-incl");
  if (elTotalIncl) elTotalIncl.textContent = sumIncl.toLocaleString(undefined, {maximumFractionDigits:0}) + " SAR";

  // Footers
  const fExcl = document.getElementById("cat-foot-excl");
  if (fExcl) fExcl.textContent = sumExcl.toLocaleString(undefined, {minimumFractionDigits:2});
  const fVat = document.getElementById("cat-foot-vat");
  if (fVat) fVat.textContent = sumVat.toLocaleString(undefined, {minimumFractionDigits:2});
  const fIncl = document.getElementById("cat-foot-incl");
  if (fIncl) fIncl.textContent = sumIncl.toLocaleString(undefined, {minimumFractionDigits:2});
}

function filterCatalogTable() {
  const q = (document.getElementById("search-catalog").value || "").trim().toLowerCase();
  const pFilter = document.getElementById("filter-catalog-partner").value;
  const tFilter = document.getElementById("filter-catalog-type").value;
  const tbody = document.querySelector("#tbl-partner-catalog tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const catalog = MimarERP.partnerCatalog || [];
  let sumExcl = 0;
  let sumVat = 0;
  let sumIncl = 0;

  const filtered = catalog.filter(c => {
    const matchPartner = !pFilter || c.partner_id === pFilter;
    const matchType = !tFilter || c.partner_type === tFilter;
    const matchQ = !q || 
      (c.item_code && c.item_code.toLowerCase().includes(q)) ||
      (c.desc && c.desc.toLowerCase().includes(q)) ||
      (c.partner_name && c.partner_name.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      (c.owner && c.owner.toLowerCase().includes(q));
    return matchPartner && matchType && matchQ;
  });

  filtered.forEach(item => {
    sumExcl += item.total_before_vat || 0;
    sumVat += item.total_vat || 0;
    sumIncl += item.total_after_vat || 0;

    const typeBadge = item.partner_type === "Supplier" ? "badge-blue" : "badge-purple";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${item.item_code}</strong></td>
      <td><strong>${item.desc}</strong></td>
      <td><span class="badge ${typeBadge}" style="margin-left:4px;">${item.partner_code}</span>${item.partner_name}</td>
      <td><span class="badge ${typeBadge}">${item.partner_type}</span></td>
      <td>${item.category}</td>
      <td class="text-center"><span class="badge badge-blue">${item.unit}</span></td>
      <td class="text-num">${(item.qty || 0).toLocaleString()}</td>
      <td class="text-num">${(item.price_before_vat || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      <td class="text-num" style="color:var(--text-muted)">${(item.unit_vat || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      <td class="text-num" style="color:var(--blue); font-weight:bold;">${(item.price_after_vat || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      <td class="text-num">${(item.total_before_vat || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      <td class="text-num">${(item.total_vat || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      <td class="text-num" style="color:var(--teal); font-weight:bold;">${(item.total_after_vat || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      <td><small><i class="fas fa-location-dot" style="color:var(--red); margin-left:4px;"></i>${item.location || '-'}</small></td>
      <td><small><i class="fas fa-user-check" style="color:var(--green); margin-left:4px;"></i>${item.owner || '-'}</small></td>
      <td><span class="badge badge-green">${item.status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  const fExcl = document.getElementById("cat-foot-excl");
  if (fExcl) fExcl.textContent = sumExcl.toLocaleString(undefined, {minimumFractionDigits:2});
  const fVat = document.getElementById("cat-foot-vat");
  if (fVat) fVat.textContent = sumVat.toLocaleString(undefined, {minimumFractionDigits:2});
  const fIncl = document.getElementById("cat-foot-incl");
  if (fIncl) fIncl.textContent = sumIncl.toLocaleString(undefined, {minimumFractionDigits:2});
}

function filterCatalogByPartner(partnerId) {
  const pSelect = document.getElementById("filter-catalog-partner");
  if (pSelect) {
    pSelect.value = partnerId;
    filterCatalogTable();
  }
  const catCard = document.getElementById("tbl-partner-catalog");
  if (catCard) catCard.scrollIntoView({ behavior: 'smooth' });
}

function resetCatalogFilter() {
  document.getElementById("search-catalog").value = "";
  document.getElementById("filter-catalog-partner").value = "";
  document.getElementById("filter-catalog-type").value = "";
  filterCatalogTable();
}

function populateCatalogPartnerDropdowns() {
  const pSelect = document.getElementById("filter-catalog-partner");
  const modalSelect = document.getElementById("modal-cat-partner");
  if (!pSelect || !modalSelect) return;

  pSelect.innerHTML = '<option value="">جميع الموردين والمقاولين</option>';
  modalSelect.innerHTML = '<option value="">-- اختر الشريك التجاري --</option>';

  const eligiblePartners = MimarERP.partners.filter(p => p.partner_type === "Supplier" || p.partner_type === "Subcontractor");
  eligiblePartners.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.partner_id;
    opt.textContent = `${p.partner_code} - ${p.partner_name} (${p.partner_type})`;
    pSelect.appendChild(opt);

    const mOpt = document.createElement("option");
    mOpt.value = p.partner_id;
    mOpt.textContent = `${p.partner_code} - ${p.partner_name} (${p.partner_type})`;
    modalSelect.appendChild(mOpt);
  });
}

function openAddCatalogModal(defaultPartnerId = "") {
  populateCatalogPartnerDropdowns();
  const modal = document.getElementById("modal-add-catalog");
  if (!modal) return;
  modal.style.display = "flex";

  if (defaultPartnerId) {
    document.getElementById("modal-cat-partner").value = defaultPartnerId;
    onModalPartnerChange();
  } else {
    recalcModalCatalog();
  }
}

function closeAddCatalogModal() {
  const modal = document.getElementById("modal-add-catalog");
  if (modal) modal.style.display = "none";
}

function onModalPartnerChange() {
  const pid = document.getElementById("modal-cat-partner").value;
  const partner = MimarERP.partners.find(p => p.partner_id === pid);
  if (partner) {
    document.getElementById("modal-cat-category").value = partner.category || "";
    document.getElementById("modal-cat-loc").value = partner.location || "";
    document.getElementById("modal-cat-owner").value = partner.owner || "";
    
    // Auto suggest code
    const existingCount = (MimarERP.partnerCatalog || []).filter(c => c.partner_id === pid).length;
    const prefix = partner.partner_type === "Supplier" ? "MAT" : "SUB";
    document.getElementById("modal-cat-code").value = `${prefix}-${partner.partner_code.split('-')[1] || '01'}-0${existingCount + 1}`;
  }
  recalcModalCatalog();
}

function recalcModalCatalog() {
  const qty = parseFloat(document.getElementById("modal-cat-qty").value) || 0;
  const price = parseFloat(document.getElementById("modal-cat-price").value) || 0;
  const vatPct = parseFloat(document.getElementById("modal-cat-vat-pct").value) || 15;

  const unitVat = price * (vatPct / 100);
  const priceAfter = price + unitVat;
  const totExcl = qty * price;
  const totVat = qty * unitVat;
  const totIncl = totExcl + totVat;

  document.getElementById("modal-cat-price-after").value = priceAfter.toFixed(2);
  document.getElementById("modal-preview-excl").textContent = totExcl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + " SAR";
  document.getElementById("modal-preview-incl").textContent = totIncl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + " SAR";
}

function saveNewCatalogItem(e) {
  e.preventDefault();
  const pid = document.getElementById("modal-cat-partner").value;
  const partner = MimarERP.partners.find(p => p.partner_id === pid);
  if (!partner) {
    alert("يرجى اختيار الشريك التجاري أولاً");
    return;
  }

  const itemCode = document.getElementById("modal-cat-code").value.trim();
  const desc = document.getElementById("modal-cat-desc").value.trim();
  const category = document.getElementById("modal-cat-category").value.trim() || partner.category;
  const unit = document.getElementById("modal-cat-unit").value;
  const qty = parseFloat(document.getElementById("modal-cat-qty").value) || 0;
  const priceBefore = parseFloat(document.getElementById("modal-cat-price").value) || 0;
  const vatPct = parseFloat(document.getElementById("modal-cat-vat-pct").value) || 15;
  const loc = document.getElementById("modal-cat-loc").value.trim() || partner.location || "المملكة العربية السعودية";
  const owner = document.getElementById("modal-cat-owner").value.trim() || partner.owner || "الإدارة التنفيذية";

  const unitVat = Math.round(priceBefore * (vatPct / 100) * 100) / 100;
  const priceAfter = Math.round((priceBefore + unitVat) * 100) / 100;
  const totExcl = Math.round((qty * priceBefore) * 100) / 100;
  const totVat = Math.round((qty * unitVat) * 100) / 100;
  const totIncl = Math.round((totExcl + totVat) * 100) / 100;

  const newItem = {
    partner_id: partner.partner_id,
    partner_code: partner.partner_code,
    partner_name: partner.partner_name,
    partner_type: partner.partner_type,
    category: category,
    item_code: itemCode,
    desc: desc,
    unit: unit,
    qty: qty,
    price_before_vat: priceBefore,
    vat_pct: vatPct,
    unit_vat: unitVat,
    price_after_vat: priceAfter,
    total_before_vat: totExcl,
    total_vat: totVat,
    total_after_vat: totIncl,
    location: loc,
    owner: owner,
    status: "معتمد"
  };

  if (!MimarERP.partnerCatalog) MimarERP.partnerCatalog = [];
  MimarERP.partnerCatalog.unshift(newItem);

  renderPartnersTable();
  renderPartnerCatalogTable();
  renderSupplierComparisonTable();
  renderContractorsMatrixTable();
  closeAddCatalogModal();
  showToast(`تم إضافة الخامة (${itemCode} - ${desc}) بنجاح إلى كتالوج ${partner.partner_name}`);
}

function renderProjectsTable() {
  const tbody = document.querySelector("#tbl-projects-list tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const prjList = MimarERP.projects || [];
  let totVal = 0;
  let totDirect = 0;
  let totProgress = 0;

  prjList.forEach(p => {
    const comp = MimarERP.companies.find(c => c.company_id === p.company_id);
    const client = MimarERP.partners.find(bp => bp.partner_id === p.client_id);
    const contractVal = p.contract_value_incl_vat || p.contract_value || 0;
    const directVal = p.direct_cost_budget || 0;
    const prog = p.physical_progress_pct || 0;

    totVal += contractVal;
    totDirect += directVal;
    totProgress += prog;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong style="color:var(--teal)">${p.project_code}</strong></td>
      <td><strong>${p.project_name_ar}</strong></td>
      <td>${comp ? comp.company_name_ar : '-'}</td>
      <td>${client ? client.partner_name : '-'}</td>
      <td class="text-num" style="font-weight:700;">${contractVal.toLocaleString("ar-SA", {maximumFractionDigits: 0})}</td>
      <td class="text-num">${directVal.toLocaleString("ar-SA", {maximumFractionDigits: 0})}</td>
      <td class="text-center">${p.contract_duration_days} يوم</td>
      <td class="text-center"><strong style="color:var(--green)">${prog}%</strong></td>
      <td><span class="badge ${p.status==='In Progress'?'badge-green':(p.status==='Mobilization'?'badge-blue':'badge-amber')}">${p.status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl("prj-kpi-total-val", (totVal / 1000000).toFixed(2) + " م ر.س");
  setEl("prj-kpi-count", prjList.length + " مشاريع");
  setEl("prj-kpi-direct-cost", (totDirect / 1000000).toFixed(2) + " م ر.س");
  const avgProg = prjList.length > 0 ? (totProgress / prjList.length).toFixed(1) : 0;
  setEl("prj-kpi-avg-progress", avgProg + "%");
  setEl("prj-kpi-badge-active", prjList.length + " مشاريع نشطة");
}

function renderWBSBOQTree() {
  const tbody = document.querySelector("#tbl-wbs-boq tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const prj = getActiveProject();
  const projectWBS = MimarERP.wbs.filter(w => w.project_id === prj.project_id);

  let totalDirect = 0;
  let totalSelling = 0;

  projectWBS.forEach(node => {
    const trNode = document.createElement("tr");
    const indentClass = `tree-indent-${node.level}`;
    const rowClass = `tree-row-l${node.level}`;
    
    const nodeItems = MimarERP.boq.filter(b => b.wbs === node.code || b.division === node.code);
    const nodeDirectCost = nodeItems.reduce((acc, it) => acc + (it.total_cost_direct || 0), 0);
    const nodeSellingAmount = nodeItems.reduce((acc, it) => acc + (it.total_selling_amount || 0), 0);

    trNode.className = rowClass;
    trNode.innerHTML = `
      <td class="${indentClass}">
        <i class="fas fa-folder toggle-icon"></i>
        <strong>${node.code} - ${node.title_ar}</strong>
      </td>
      <td class="text-center">-</td>
      <td class="text-center">-</td>
      <td class="text-center">-</td>
      <td class="text-center">-</td>
      <td class="text-center">-</td>
      <td class="text-num"><strong>${nodeDirectCost > 0 ? nodeDirectCost.toLocaleString() : '-'}</strong></td>
      <td class="text-num"><strong>${nodeSellingAmount > 0 ? nodeSellingAmount.toLocaleString() : '-'}</strong></td>
      <td class="text-center"><strong>${node.weight}%</strong></td>
    `;
    tbody.appendChild(trNode);

    if (node.level === 3 || nodeItems.length > 0) {
      nodeItems.forEach(item => {
        totalDirect += (item.total_cost_direct || 0);
        totalSelling += (item.total_selling_amount || 0);

        const trItem = document.createElement("tr");
        trItem.className = "tree-row-l4";
        trItem.innerHTML = `
          <td class="tree-indent-4">
            <i class="fas fa-file-lines" style="color:var(--muted); margin-left:6px;"></i>
            ${item.item}
          </td>
          <td class="text-num"><span class="badge badge-blue">${item.code}</span></td>
          <td class="text-center">${item.unit}</td>
          <td class="text-num">${item.qty_approved.toLocaleString()}</td>
          <td class="text-num">${item.rate_direct_total.toFixed(2)}</td>
          <td class="text-num">${item.rate_selling.toFixed(2)}</td>
          <td class="text-num">${item.total_cost_direct.toLocaleString()}</td>
          <td class="text-num">${item.total_selling_amount.toLocaleString()}</td>
          <td class="text-center">${((item.total_selling_amount / prj.contract_value) * 100).toFixed(1)}%</td>
        `;
        tbody.appendChild(trItem);
      });
    }
  });

  document.getElementById("boq-foot-direct").textContent = totalDirect.toLocaleString('en-US', {minimumFractionDigits:2});
  document.getElementById("boq-foot-selling").textContent = totalSelling.toLocaleString('en-US', {minimumFractionDigits:2});
}

function renderTakeoffTable() {
  const tbody = document.querySelector("#tbl-takeoff tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  MimarERP.takeoff.forEach((t, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td class="text-num"><strong>${t.boq_id}</strong></td>
      <td><span class="badge badge-purple">${t.location}</span></td>
      <td>${t.description}</td>
      <td class="text-center">${t.unit}</td>
      <td class="text-num">${t.count || 1}</td>
      <td class="text-num">${t.length || 0}</td>
      <td class="text-num">${t.width || 0}</td>
      <td class="text-num">${t.height || 0}</td>
      <td class="text-num">${(t.gross_qty || 0).toFixed(2)}</td>
      <td class="text-num" style="color:var(--red);">${(t.openings_deduction || 0).toFixed(2)}</td>
      <td class="text-num" style="font-weight:800; color:var(--teal);">${(t.net_qty || 0).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderRateAnalysisCards() {
  const tableBody = document.querySelector("#tbl-rate-analysis-main tbody");
  const container = document.getElementById("rate-analysis-container");
  if (!tableBody && !container) return;

  const raList = MimarERP.rateAnalysis || [];
  const boqList = MimarERP.boq || [];

  let totDirect = 0;
  let totLabor = 0;
  let totMaterial = 0;
  let grandTotalValue = 0;
  let totalUnitSelling = 0;

  if (tableBody) tableBody.innerHTML = "";
  if (container) container.innerHTML = "";

  raList.forEach(ra => {
    // Match BOQ item to get approved quantity
    const boqItem = boqList.find(b => b.id === ra.boq_id) || {};
    const qty = boqItem.qty_approved || 1;
    const directCost = ra.direct_cost || (ra.total_material + ra.total_labor + (ra.total_equipment || 0) + (ra.total_subcontract || 0));
    const sellingUnit = ra.selling_price_excl_vat || (directCost * 1.25);
    const itemTotal = qty * sellingUnit;

    totDirect += (directCost * qty);
    totLabor += ((ra.total_labor || 0) * qty);
    totMaterial += ((ra.total_material || 0) * qty);
    grandTotalValue += itemTotal;
    totalUnitSelling += sellingUnit;

    // 1. Populate Main Table Row
    if (tableBody) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong style="color:var(--teal)">${ra.boq_id}</strong></td>
        <td><strong>${ra.item_name}</strong></td>
        <td class="text-center">${ra.unit}</td>
        <td class="text-num">${qty.toLocaleString("ar-SA")}</td>
        <td class="text-num">${(ra.total_material || 0).toLocaleString("ar-SA", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td class="text-num">${(ra.total_labor || 0).toLocaleString("ar-SA", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td class="text-num">${ra.target_profit_pct || 12}%</td>
        <td class="text-num" style="font-weight:700; color:var(--blue);">${sellingUnit.toLocaleString("ar-SA", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td class="text-num" style="font-weight:800; color:var(--navy);">${itemTotal.toLocaleString("ar-SA", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      `;
      tableBody.appendChild(tr);
    }

    // 2. Populate Detail Collapsible Card
    if (container) {
      const totalComp = (ra.components || []).reduce((acc, c) => acc + (c.cost || 0), 0);
      const card = document.createElement("div");
      card.className = "card";
      card.style.marginBottom = "12px";
      card.innerHTML = `
        <div class="card-header" style="background:#0F2B46; color:white; cursor:pointer;" onclick="const b=this.nextElementSibling; b.style.display=b.style.display==='none'?'block':'none';">
          <h3 style="color:white; font-size:14px;"><i class="fas fa-layer-group"></i> ${ra.boq_id} - ${ra.item_name}</h3>
          <div style="display:flex; gap:12px; align-items:center;">
            <span style="font-size:13px; color:#94A3B8;">تكلفة الوحدة المباشرة: <strong>${directCost.toFixed(2)} ر.س</strong></span>
            <span style="font-size:13px; font-weight:800; color:#38BDF8;">سعر البيع: ${sellingUnit.toFixed(2)} ر.س / ${ra.unit}</span>
            <i class="fas fa-chevron-down" style="font-size:12px; color:#94A3B8;"></i>
          </div>
        </div>
        <div class="card-body" style="padding:0; display:none;">
          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>نوع المورد</th><th>اسم المورد والمواصفة</th><th>معدل الاستهلاك للوحدة</th>
                <th>الوحدة</th><th>سعر الأساس</th><th>الهالك %</th><th>تكلفة المكون للوحدة (ر.س)</th>
              </tr></thead>
              <tbody>
                ${(ra.components || []).map(c => `
                  <tr>
                    <td><span class="badge ${c.type==='Material'?'badge-blue':(c.type==='Labor'?'badge-green':'badge-amber')}">${c.type}</span></td>
                    <td><strong>${c.name}</strong></td>
                    <td class="text-num">${c.qty_per_unit}</td>
                    <td class="text-center">${c.unit}</td>
                    <td class="text-num">${(c.rate || 0).toFixed(2)}</td>
                    <td class="text-num">${c.waste_pct || 0}%</td>
                    <td class="text-num" style="font-weight:700;">${(c.cost || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
      container.appendChild(card);
    }
  });

  // Update KPI Cards
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl("ra-kpi-total-items", raList.length);
  const laborPct = totDirect > 0 ? ((totLabor / totDirect) * 100).toFixed(1) : "0.0";
  const matPct = totDirect > 0 ? ((totMaterial / totDirect) * 100).toFixed(1) : "0.0";
  setEl("ra-kpi-avg-labor", laborPct + "%");
  setEl("ra-kpi-avg-material", matPct + "%");
  setEl("ra-kpi-total-value", grandTotalValue.toLocaleString("ar-SA", {maximumFractionDigits: 0}));

  // Update Table Footers
  setEl("ra-foot-total-unit", totalUnitSelling.toLocaleString("ar-SA", {minimumFractionDigits: 2, maximumFractionDigits: 2}));
  setEl("ra-foot-grand-total", grandTotalValue.toLocaleString("ar-SA", {minimumFractionDigits: 2, maximumFractionDigits: 2}));
}

function renderProcurementTable() {
  const tbody = document.querySelector("#tbl-po-list tbody");
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td class="text-num"><strong>PO-2026-001</strong></td>
      <td>شركة أسمنت ينبع والمدينة</td>
      <td>أسمنت بورتلاندي عادي 50 كجم</td>
      <td class="text-num">1,000 كيس</td>
      <td class="text-num">16.50</td>
      <td class="text-num"><strong>16,500.00</strong></td>
      <td class="text-num">2026-03-01</td>
      <td class="text-num">2026-03-05</td>
      <td><span class="badge badge-green">مستلم بالكامل (GRN-01)</span></td>
    </tr>
    <tr>
      <td class="text-num"><strong>PO-2026-002</strong></td>
      <td>شركة هضاب الخليج للسيراميك</td>
      <td>سيراميك وبورسلان وبلاط أحواش</td>
      <td class="text-num">650 م²</td>
      <td class="text-num">38.12</td>
      <td class="text-num"><strong>24,780.00</strong></td>
      <td class="text-num">2026-03-10</td>
      <td class="text-num">2026-03-15</td>
      <td><span class="badge badge-green">مستلم بالكامل (GRN-02)</span></td>
    </tr>
    <tr>
      <td class="text-num"><strong>PO-2026-003</strong></td>
      <td>شركة دهانات الجزيرة</td>
      <td>غراء لاصق Santex C2TE</td>
      <td class="text-num">180 كيس</td>
      <td class="text-num">49.71</td>
      <td class="text-num"><strong>8,947.80</strong></td>
      <td class="text-num">2026-03-18</td>
      <td class="text-num">2026-03-22</td>
      <td><span class="badge badge-blue">قيد التوريد والتسليم</span></td>
    </tr>
  `;
}

function renderInventoryTable() {
  const tbody = document.querySelector("#tbl-inventory tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const ledger = MimarERP.inventoryLedger || [];
  let totInVal = 0;
  let totIssuedVal = 0;
  const warehouses = new Set();

  ledger.forEach(item => {
    warehouses.add(item.warehouse);
    const inVal = (item.qty_in || 0) * (item.unit_cost || 0);
    const outVal = (item.qty_out || 0) * (item.unit_cost || 0);
    totInVal += inVal;
    totIssuedVal += outVal;

    const typeBadge = item.tx_type.includes("استلام") ? "badge-green" :
                      (item.tx_type.includes("صرف") ? "badge-amber" : "badge-blue");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong style="color:var(--teal)">${item.tx_id}</strong></td>
      <td><span class="badge ${typeBadge}">${item.tx_type}</span></td>
      <td>${item.warehouse}</td>
      <td><strong>${item.item_name}</strong></td>
      <td class="text-num">${item.batch_no}</td>
      <td class="text-num" style="color:var(--green); font-weight:700;">${item.qty_in > 0 ? item.qty_in.toLocaleString("ar-SA") : '-'}</td>
      <td class="text-num" style="color:var(--amber); font-weight:700;">${item.qty_out > 0 ? item.qty_out.toLocaleString("ar-SA") : '-'}</td>
      <td class="text-num">${item.unit_cost.toLocaleString("ar-SA", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td><span class="badge badge-blue">${item.wbs_ref}</span></td>
      <td class="text-num">${item.tx_date}</td>
    `;
    tbody.appendChild(tr);
  });

  const currentStockVal = Math.max(0, totInVal - totIssuedVal);
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl("inv-kpi-total-val", currentStockVal.toLocaleString("ar-SA", {maximumFractionDigits: 0}) + " ر.س");
  setEl("inv-kpi-tx-count", ledger.length + " حركة");
  setEl("inv-kpi-issued-val", totIssuedVal.toLocaleString("ar-SA", {maximumFractionDigits: 0}) + " ر.س");
  setEl("inv-kpi-warehouse-count", warehouses.size + " مستودعات");
}

function renderSubcontractsTable() {
  const tbody = document.querySelector("#tbl-subcontracts tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const subs = MimarERP.subcontractsMaster || [];
  let totVal = 0;
  let totMeasured = 0;
  let totRetention = 0;
  let totPaid = 0;

  subs.forEach(s => {
    const totalCommitment = s.original_value + (s.approved_vos || 0);
    totVal += totalCommitment;
    totMeasured += (s.executed_measured || 0);
    totRetention += (s.retention_val || 0);
    totPaid += (s.net_paid || 0);

    const statusBadge = s.status === "مكتمل ومسلّم" ? "badge-green" : "badge-blue";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong style="color:var(--purple)">${s.sub_id}</strong></td>
      <td><strong>${s.contractor_name}</strong></td>
      <td>${s.scope}</td>
      <td class="text-num">${s.original_value.toLocaleString("ar-SA", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td class="text-num">${(s.approved_vos || 0).toLocaleString("ar-SA", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td class="text-num" style="font-weight:700;">${(s.executed_measured || 0).toLocaleString("ar-SA", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td class="text-num">${(s.approved_billings || 0).toLocaleString("ar-SA", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td class="text-num" style="color:var(--amber); font-weight:700;">${(s.retention_val || 0).toLocaleString("ar-SA", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td class="text-num" style="color:var(--green); font-weight:800;">${(s.net_paid || 0).toLocaleString("ar-SA", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td><span class="badge ${statusBadge}">${s.status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl("sub-kpi-total-val", totVal.toLocaleString("ar-SA", {maximumFractionDigits: 0}) + " ر.س");
  setEl("sub-kpi-measured-val", totMeasured.toLocaleString("ar-SA", {maximumFractionDigits: 0}) + " ر.س");
  setEl("sub-kpi-retention-val", totRetention.toLocaleString("ar-SA", {maximumFractionDigits: 0}) + " ر.س");
  setEl("sub-kpi-paid-val", totPaid.toLocaleString("ar-SA", {maximumFractionDigits: 0}) + " ر.س");
}

function renderScheduleTable() {
  const tbody = document.querySelector("#tbl-schedule tbody");
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td class="text-num"><strong>ACT-101</strong></td><td>WBS-09.1</td>
      <td>أعمال لياسة الحوائط الداخلية</td><td class="text-center">30</td>
      <td class="text-num">2026-02-01</td><td class="text-num">2026-03-02</td>
      <td class="text-center">-</td><td class="text-center">20.5%</td>
      <td class="text-center"><strong style="color:var(--green)">100%</strong></td>
      <td><span class="badge badge-green">مكتمل</span></td>
    </tr>
    <tr>
      <td class="text-num"><strong>ACT-102</strong></td><td>WBS-09.2</td>
      <td>أعمال تركيب السيراميك والبورسلان</td><td class="text-center">25</td>
      <td class="text-num">2026-03-05</td><td class="text-num">2026-03-30</td>
      <td class="text-center">ACT-101 (FS)</td><td class="text-center">24.2%</td>
      <td class="text-center"><strong style="color:var(--blue)">75%</strong></td>
      <td><span class="badge badge-blue">جاري العمل</span></td>
    </tr>
  `;
}

function renderBillingTable() {
  const tbody = document.querySelector("#tbl-billing-ipcs tbody");
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td class="text-num"><strong>IPC-01</strong></td><td>مستخلص مالك (Client)</td>
      <td>شركة إينوفست</td><td class="text-num">2026-05-01 / 2026-05-15</td>
      <td class="text-num">28,450.00</td><td class="text-num">0.00</td>
      <td class="text-num">28,450.00</td><td class="text-num">2,845.00</td>
      <td class="text-num">25,605.00</td><td class="text-num">3,840.75</td>
      <td class="text-num" style="font-weight:800; color:var(--green);">29,445.75</td>
      <td><span class="badge badge-green">معتمد ومصروف</span></td>
    </tr>
    <tr>
      <td class="text-num"><strong>IPC-02</strong></td><td>مستخلص مالك (Client)</td>
      <td>شركة إينوفست</td><td class="text-num">2026-05-16 / 2026-05-31</td>
      <td class="text-num">62,570.00</td><td class="text-num">28,450.00</td>
      <td class="text-num">34,120.00</td><td class="text-num">3,412.00</td>
      <td class="text-num">30,708.00</td><td class="text-num">4,606.20</td>
      <td class="text-num" style="font-weight:800; color:var(--green);">35,314.20</td>
      <td><span class="badge badge-green">معتمد ومصروف</span></td>
    </tr>
  `;
}

function renderInspectionsTable() {
  const tbody = document.querySelector("#tbl-inspections tbody");
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td class="text-num"><strong>WIR-01</strong></td><td><span class="badge badge-blue">WIR أعمال</span></td>
      <td>لياسة داخلية - الطرطشة والبؤج والأوتار</td><td class="text-num">BOQ-01</td>
      <td>الدور الأرضي</td><td class="text-num">2026-05-03</td>
      <td><span class="badge badge-green">Code A (معتمد)</span></td><td><span class="badge badge-green">مغلق</span></td>
    </tr>
    <tr>
      <td class="text-num"><strong>MIR-01</strong></td><td><span class="badge badge-purple">MIR مواد</span></td>
      <td>فحص عينات بورسلان وسيراميك هضاب الخليج</td><td class="text-num">BOQ-04</td>
      <td>الموقع العام</td><td class="text-num">2026-05-04</td>
      <td><span class="badge badge-green">Code A (معتمد)</span></td><td><span class="badge badge-green">مغلق</span></td>
    </tr>
  `;
}

function renderDrawingsTable() {
  const tbody = document.querySelector("#tbl-drawings tbody");
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td class="text-num"><strong>A101</strong></td><td>مسقط الدور الأرضي المعماري والأبعاد التنفيذية</td>
      <td>Architectural</td><td class="text-center">Rev 02</td>
      <td class="text-num">2026-04-10</td><td><span class="badge badge-green">IFC (صالح للتنفيذ)</span></td>
    </tr>
    <tr>
      <td class="text-num"><strong>A301</strong></td><td>القطاعات الرأسية وتفاصيل عزل الأسطح</td>
      <td>Architectural</td><td class="text-center">Rev 02</td>
      <td class="text-num">2026-04-12</td><td><span class="badge badge-green">IFC (محدث وفق خيار PU)</span></td>
    </tr>
  `;
}

function renderSelectedReport(repType) {
  const container = document.getElementById("report-view-container");
  if (!container) return;

  const prj = getActiveProject();
  const comp = getActiveCompany();
  const dateStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  // Standard report header template
  const makeReportHeader = (title, subtitle, badgeText, badgeClass="badge-blue") => `
    <div class="card-header" style="background:#FFFFFF; border-bottom:2px solid var(--line); padding:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div>
        <div style="font-size:11px; font-weight:800; color:var(--teal); text-transform:uppercase; margin-bottom:4px;">${comp.company_name_ar} · ${prj.project_name_ar} (${prj.project_code})</div>
        <h3 style="font-size:18px; font-weight:800; color:var(--navy); margin:0;">${title}</h3>
        <p style="color:var(--muted); font-size:12px; margin:4px 0 0 0;">${subtitle}</p>
      </div>
      <div style="text-align:left;">
        <span class="badge ${badgeClass}" style="font-size:12px; margin-bottom:4px; display:inline-block;">${badgeText}</span>
        <div style="font-size:11px; color:var(--muted);">تاريخ الإصدار: <strong>${dateStr}</strong></div>
      </div>
    </div>
  `;

  if (repType === "rep-cvr") {
    container.innerHTML = `
      <div class="card" style="margin-bottom:0;">
        ${makeReportHeader(
          "تقرير التكلفة والقيمة والمصالحة الشهرية (Cost Value Reconciliation - CVR)",
          "تحليل المقارنة بين الإيرادات المعتمدة بالمستخلصات والتكاليف الفعلية لتحديد الربحية اللحظية",
          "CVR Closed Month",
          "badge-green"
        )}
        <div class="card-body" style="padding:20px;">
          <!-- KPI Summary -->
          <div class="kpi-grid" style="margin-bottom:20px; grid-template-columns:repeat(5, 1fr);">
            <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">قيمة العقد المعتمد</span></div><div class="kpi-value text-num">${(prj.contract_value || 183733).toLocaleString('ar-SA')}</div><div class="kpi-footer">ر.س</div></div>
            <div class="kpi-card green"><div class="kpi-header"><span class="kpi-label">الإيراد المعتمد (IPC)</span></div><div class="kpi-value text-num">119,243</div><div class="kpi-footer">ر.س · مستخلص 01 + 02</div></div>
            <div class="kpi-card amber"><div class="kpi-header"><span class="kpi-label">التكلفة الفعلية (AC)</span></div><div class="kpi-value text-num">79,880</div><div class="kpi-footer">ر.س · المصاريف المحققة</div></div>
            <div class="kpi-card green"><div class="kpi-header"><span class="kpi-label">الربح الدفتري المحقق</span></div><div class="kpi-value text-num" style="color:var(--green)">+39,363</div><div class="kpi-footer">ر.س · Gross Profit</div></div>
            <div class="kpi-card" style="border-top:4px solid var(--teal);"><div class="kpi-header"><span class="kpi-label">هامش الربحية الفعلي</span></div><div class="kpi-value text-num" style="color:var(--teal)">33.0%</div><div class="kpi-footer">المستهدف: 12.0%</div></div>
          </div>

          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>حزمة الأعمال (WBS Division)</th>
                <th class="text-num">قيمة العقد المعتمد</th>
                <th class="text-num">التكلفة المباشرة المقدرة</th>
                <th class="text-num">الإيراد المعتمد (Revenue)</th>
                <th class="text-num">التكلفة الفعلية (AC)</th>
                <th class="text-num">الربح الدفتري (ر.س)</th>
                <th class="text-center">هامش الربحية %</th>
                <th class="text-center">حالة الحزمة</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td><strong>WBS-09 التشطيبات المعمارية والداخلية</strong></td>
                  <td class="text-num">125,850.00</td>
                  <td class="text-num">84,320.00</td>
                  <td class="text-num">78,400.00</td>
                  <td class="text-num">51,200.00</td>
                  <td class="text-num" style="font-weight:800; color:var(--green);">+27,200.00</td>
                  <td class="text-center" style="font-weight:700;">34.7%</td>
                  <td><span class="badge badge-green">ربحية ممتازة</span></td>
                </tr>
                <tr>
                  <td><strong>WBS-07 العوازل المائية والحرارية</strong></td>
                  <td class="text-num">29,750.00</td>
                  <td class="text-num">19,930.00</td>
                  <td class="text-num">29,750.00</td>
                  <td class="text-num">19,930.00</td>
                  <td class="text-num" style="font-weight:800; color:var(--green);">+9,820.00</td>
                  <td class="text-center" style="font-weight:700;">33.0%</td>
                  <td><span class="badge badge-green">مكتمل 100%</span></td>
                </tr>
                <tr>
                  <td><strong>WBS-08 الأبواب والنوافذ والفتحات</strong></td>
                  <td class="text-num">28,133.98</td>
                  <td class="text-num">18,836.07</td>
                  <td class="text-num">11,093.00</td>
                  <td class="text-num">8,750.00</td>
                  <td class="text-num" style="font-weight:800; color:var(--green);">+2,343.00</td>
                  <td class="text-center" style="font-weight:700;">21.1%</td>
                  <td><span class="badge badge-blue">قيد التوريد</span></td>
                </tr>
              </tbody>
              <tfoot>
                <tr style="background:#E2E8F0; font-weight:800;">
                  <td>الإجمالي المجمع للمشروع</td>
                  <td class="text-num">183,733.98</td>
                  <td class="text-num">123,086.07</td>
                  <td class="text-num">119,243.00</td>
                  <td class="text-num">79,880.00</td>
                  <td class="text-num" style="color:var(--green); font-size:14px;">+39,363.00</td>
                  <td class="text-center" style="color:var(--teal); font-size:14px;">33.0%</td>
                  <td><span class="badge badge-green">مطابق للمستهدف</span></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `;
  } else if (repType === "rep-evm") {
    container.innerHTML = `
      <div class="card" style="margin-bottom:0;">
        ${makeReportHeader(
          "تقرير إدارة القيمة المكتسبة والأداء المالي والزمني (EVM Summary)",
          "تحليل شامل لمؤشرات الأداء المعتمدة من PMI و AACE لقياس التكلفة والجدول الزمني والتنبؤ عند الإغلاق",
          "AACE Class 1 Audited",
          "badge-purple"
        )}
        <div class="card-body" style="padding:20px;">
          <div class="kpi-grid" style="margin-bottom:20px; grid-template-columns:repeat(6, 1fr);">
            <div class="kpi-card green"><div class="kpi-header"><span class="kpi-label">الميزانية الأصلية (BAC)</span></div><div class="kpi-value text-num">123,086</div><div class="kpi-footer">ر.س</div></div>
            <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">المخطط التراكمي (PV)</span></div><div class="kpi-value text-num">88,620</div><div class="kpi-footer">ر.س</div></div>
            <div class="kpi-card purple"><div class="kpi-header"><span class="kpi-label">القيمة المكتسبة (EV)</span></div><div class="kpi-value text-num">79,880</div><div class="kpi-footer">ر.س</div></div>
            <div class="kpi-card amber"><div class="kpi-header"><span class="kpi-label">التكلفة الفعلية (AC)</span></div><div class="kpi-value text-num">79,880</div><div class="kpi-footer">ر.س</div></div>
            <div class="kpi-card" style="border-top:4px solid var(--green);"><div class="kpi-header"><span class="kpi-label">مؤشر التكلفة (CPI)</span></div><div class="kpi-value text-num" style="color:var(--green)">1.000</div><div class="kpi-footer">EV / AC (على الميزانية)</div></div>
            <div class="kpi-card" style="border-top:4px solid var(--amber);"><div class="kpi-header"><span class="kpi-label">مؤشر الجدول (SPI)</span></div><div class="kpi-value text-num" style="color:var(--amber)">0.901</div><div class="kpi-footer">EV / PV (تأخر طفيف)</div></div>
          </div>

          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>المؤشر الهندسي</th><th>الوصف والرمز</th><th class="text-num">القيمة الحالية</th><th>المعيار المرجعي</th><th>التقييم الفني والرقابي</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td><strong>انحراف التكلفة (Cost Variance)</strong></td><td>CV = EV - AC</td>
                  <td class="text-num" style="font-weight:700; color:var(--green);">0.00 ر.س</td><td>&gt;= 0 (وفر أو التزام)</td>
                  <td><span class="badge badge-green">مطابق تماماً للميزانية المباشرة</span></td>
                </tr>
                <tr>
                  <td><strong>انحراف الجدول الزمني (Schedule Variance)</strong></td><td>SV = EV - PV</td>
                  <td class="text-num" style="font-weight:700; color:var(--amber);">-8,740.00 ر.س</td><td>&gt;= 0 (متقدم أو على الموعد)</td>
                  <td><span class="badge badge-amber">تأخر بقيمة 8.7 ألف ر.س جاري تداركه بالمسار الحرج</span></td>
                </tr>
                <tr>
                  <td><strong>التكلفة المتوقعة عند الانتهاء (EAC)</strong></td><td>EAC = BAC / CPI</td>
                  <td class="text-num" style="font-weight:700;">123,086.07 ر.س</td><td>= BAC المعتمد</td>
                  <td><span class="badge badge-green">لا يوجد تجاوز متوقع في التكلفة</span></td>
                </tr>
                <tr>
                  <td><strong>الانحراف عند الانتهاء (VAC)</strong></td><td>VAC = BAC - EAC</td>
                  <td class="text-num" style="font-weight:700; color:var(--green);">0.00 ر.س</td><td>&gt;= 0</td>
                  <td><span class="badge badge-green">التكلفة النهائية تطابق الميزانية بدقة 100%</span></td>
                </tr>
                <tr>
                  <td><strong>مؤشر الأداء لإكمال العمل (TCPI)</strong></td><td>(BAC - EV) / (BAC - AC)</td>
                  <td class="text-num" style="font-weight:700;">1.000</td><td>&lt;= 1.10 قابل للتحقيق</td>
                  <td><span class="badge badge-green">كفاءة تشغيلية واقعية وقابلة للإنجاز بسلاسة</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else if (repType === "rep-procurement") {
    container.innerHTML = `
      <div class="card" style="margin-bottom:0;">
        ${makeReportHeader(
          "تقرير مراقبة المشتريات ومطابقة التوريدات (Procurement & GRN Matching)",
          "متابعة أوامر الشراء ومطابقة الاستلام المخزني مع الفواتير المالية (3-Way Matching)",
          "Procurement 3-Way Verified",
          "badge-blue"
        )}
        <div class="card-body" style="padding:20px;">
          <div class="kpi-grid" style="margin-bottom:20px;">
            <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">أوامر الشراء المعتمدة</span></div><div class="kpi-value text-num">12 PO</div><div class="kpi-footer">بقيمة 412,500 ر.س</div></div>
            <div class="kpi-card green"><div class="kpi-header"><span class="kpi-label">المستلم بالموقع (GRN)</span></div><div class="kpi-value text-num">98.5%</div><div class="kpi-footer">مطابقة الاستلام</div></div>
            <div class="kpi-card amber"><div class="kpi-header"><span class="kpi-label">توريدات قيد الشحن</span></div><div class="kpi-value text-num">2 شحنة</div><div class="kpi-footer">تصل خلال 48 ساعة</div></div>
            <div class="kpi-card green"><div class="kpi-header"><span class="kpi-label">نسبة التطابق المالي</span></div><div class="kpi-value text-num">100%</div><div class="kpi-footer">بدون فروق تسعيرية</div></div>
          </div>

          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>رقم أمر الشراء</th><th>المورد التجاري</th><th>المادة / الخامة</th>
                <th class="text-num">الكمية المطلوبة</th><th class="text-num">الكمية المستلمة</th>
                <th class="text-num">القيمة (ر.س)</th><th>رقم إشعار الاستلام</th><th>حالة المطابقة الثلاثية</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td><strong style="color:var(--teal)">PO-2026-001</strong></td>
                  <td>شركة أسمنت ينبع والمدينة المتحدة</td>
                  <td>أسمنت بورتلاندي عادي 50 كجم</td>
                  <td class="text-num">1,000 كيس</td><td class="text-num">1,000 كيس</td>
                  <td class="text-num">16,500.00</td><td>GRN-01</td>
                  <td><span class="badge badge-green">مطابق بالكامل 100%</span></td>
                </tr>
                <tr>
                  <td><strong style="color:var(--teal)">PO-2026-002</strong></td>
                  <td>شركة هضاب الخليج للسيراميك</td>
                  <td>سيراميك أرضيات حمامات ومطابخ 40×40</td>
                  <td class="text-num">650 م²</td><td class="text-num">650 م²</td>
                  <td class="text-num">20,800.00</td><td>GRN-02</td>
                  <td><span class="badge badge-green">مطابق بالكامل 100%</span></td>
                </tr>
                <tr>
                  <td><strong style="color:var(--teal)">PO-2026-003</strong></td>
                  <td>شركة دهانات الجزيرة الصناعية</td>
                  <td>دهان مائي داخلي الجزيرة جرين</td>
                  <td class="text-num">80 برميل</td><td class="text-num">80 برميل</td>
                  <td class="text-num">16,800.00</td><td>GRN-03</td>
                  <td><span class="badge badge-green">مطابق بالكامل 100%</span></td>
                </tr>
                <tr>
                  <td><strong style="color:var(--teal)">PO-2026-004</strong></td>
                  <td>شركة سابك لحديد التسليح</td>
                  <td>حديد تسليح عالي المقاومة گريد 60</td>
                  <td class="text-num">45 طن</td><td class="text-num">45 طن</td>
                  <td class="text-num">128,250.00</td><td>GRN-04</td>
                  <td><span class="badge badge-green">مطابق بالكامل 100%</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else if (repType === "rep-subcontracts") {
    container.innerHTML = `
      <div class="card" style="margin-bottom:0;">
        ${makeReportHeader(
          "تقرير التزامات ومستخلصات مقاولي الباطن (Subcontractor Commitments & Retention)",
          "متابعة العقود المبرمة مع مقاولي الباطن، الأعمال المقاسة، وحسم محتجز الضمان (10%)",
          "Subcontracts Register",
          "badge-purple"
        )}
        <div class="card-body" style="padding:20px;">
          <div class="kpi-grid" style="margin-bottom:20px;">
            <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">إجمالي التزامات العقود</span></div><div class="kpi-value text-num">152,400</div><div class="kpi-footer">ر.س · 5 مقاولي باطن</div></div>
            <div class="kpi-card green"><div class="kpi-header"><span class="kpi-label">الأعمال المنفذة المعتمدة</span></div><div class="kpi-value text-num">98,250</div><div class="kpi-footer">ر.س · نسبة 64.5%</div></div>
            <div class="kpi-card amber"><div class="kpi-header"><span class="kpi-label">محتجز الضمان المحتجز (10%)</span></div><div class="kpi-value text-num">9,825</div><div class="kpi-footer">ر.س · يُفرج عنه بعد سنة الضمان</div></div>
            <div class="kpi-card" style="border-top:4px solid var(--blue);"><div class="kpi-header"><span class="kpi-label">صافي المدفوع للمقاولين</span></div><div class="kpi-value text-num">88,425</div><div class="kpi-footer">ر.س · بعد حسم المحتجز</div></div>
          </div>

          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>رقم العقد</th><th>مقاول الباطن</th><th>حزمة الأعمال</th>
                <th class="text-num">قيمة العقد</th><th class="text-num">المنفذ المعتمد</th>
                <th class="text-num">محتجز 10%</th><th class="text-num">الصافي المصروف</th><th class="text-center">حالة العقد</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td><strong style="color:var(--purple)">SUB-01</strong></td>
                  <td>شركة رواد العزل المتطورة (Waterseal)</td>
                  <td>عزل الأسطح والمناطق الرطبة</td>
                  <td class="text-num">41,850.00</td><td class="text-num">41,850.00</td>
                  <td class="text-num">4,185.00</td><td class="text-num">37,665.00</td>
                  <td class="text-center"><span class="badge badge-green">مكتمل ومسلّم</span></td>
                </tr>
                <tr>
                  <td><strong style="color:var(--purple)">SUB-02</strong></td>
                  <td>مصنع البراك للألمنيوم والواجهات</td>
                  <td>شبابيك سرايا وواجهات زجاجية</td>
                  <td class="text-num">112,600.00</td><td class="text-num">45,000.00</td>
                  <td class="text-num">4,500.00</td><td class="text-num">40,500.00</td>
                  <td class="text-center"><span class="badge badge-blue">قيد التركيب بالموقع</span></td>
                </tr>
                <tr>
                  <td><strong style="color:var(--purple)">SUB-03</strong></td>
                  <td>مؤسسة إتقان الجبس والديكور</td>
                  <td>أسقف معلقة جبس بورد مقاوم رطوبة</td>
                  <td class="text-num">50,200.00</td><td class="text-num">11,400.00</td>
                  <td class="text-num">1,140.00</td><td class="text-num">10,260.00</td>
                  <td class="text-center"><span class="badge badge-amber">جاري التثبيت</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else if (repType === "rep-cashflow") {
    container.innerHTML = `
      <div class="card" style="margin-bottom:0;">
        ${makeReportHeader(
          "تقرير التدفقات النقدية التقديرية والفعلية (Project Cash Flow Forecast vs Actual)",
          "بيان التدفقات الداخلة من مستخلصات المالك والتدفقات الخارجة للمواد والأجور والمقاولين والمتبقي",
          "Cash Flow Position: Positive",
          "badge-green"
        )}
        <div class="card-body" style="padding:20px;">
          <div class="kpi-grid" style="margin-bottom:20px; grid-template-columns:repeat(4, 1fr);">
            <div class="kpi-card green"><div class="kpi-header"><span class="kpi-label">إجمالي المقبوضات (Inflow)</span></div><div class="kpi-value text-num">137,000</div><div class="kpi-footer">ر.س · شامل الدفعة المقدمة</div></div>
            <div class="kpi-card amber"><div class="kpi-header"><span class="kpi-label">إجمالي المدفوعات (Outflow)</span></div><div class="kpi-value text-num">79,880</div><div class="kpi-footer">ر.س · مشتريات وأجور ومقاولين</div></div>
            <div class="kpi-card green" style="border-top:4px solid var(--green);"><div class="kpi-header"><span class="kpi-label">صافي الفائض النقدي</span></div><div class="kpi-value text-num" style="color:var(--green)">+57,120</div><div class="kpi-footer">ر.س · رصيد تشغيلي إيجابي</div></div>
            <div class="kpi-card" style="border-top:4px solid var(--blue);"><div class="kpi-header"><span class="kpi-label">مؤشر السيولة للمشروع</span></div><div class="kpi-value text-num" style="color:var(--blue)">1.71</div><div class="kpi-footer">معدل تغطية التدفقات النقدية</div></div>
          </div>

          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>الشهر</th>
                <th class="text-num">التدفق الداخل المقدر</th><th class="text-num">التدفق الداخل الفعلي</th>
                <th class="text-num">التدفق الخارج المقدر</th><th class="text-num">التدفق الخارج الفعلي</th>
                <th class="text-num">صافي التدفق الشهري</th><th class="text-num">الرصيد التراكمي (Cash Balance)</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td><strong>يناير 2026 (الدفعة المقدمة)</strong></td>
                  <td class="text-num">18,373.40</td><td class="text-num">18,373.40</td>
                  <td class="text-num">12,000.00</td><td class="text-num">9,500.00</td>
                  <td class="text-num" style="color:var(--green);">+8,873.40</td>
                  <td class="text-num" style="font-weight:700;">8,873.40</td>
                </tr>
                <tr>
                  <td><strong>فبراير 2026</strong></td>
                  <td class="text-num">25,000.00</td><td class="text-num">25,000.00</td>
                  <td class="text-num">22,000.00</td><td class="text-num">18,400.00</td>
                  <td class="text-num" style="color:var(--green);">+6,600.00</td>
                  <td class="text-num" style="font-weight:700;">15,473.40</td>
                </tr>
                <tr>
                  <td><strong>مارس 2026 (مستخلص 01)</strong></td>
                  <td class="text-num">45,000.00</td><td class="text-num">47,620.00</td>
                  <td class="text-num">32,000.00</td><td class="text-num">29,800.00</td>
                  <td class="text-num" style="color:var(--green);">+17,820.00</td>
                  <td class="text-num" style="font-weight:700;">33,293.40</td>
                </tr>
                <tr>
                  <td><strong>أبريل 2026</strong></td>
                  <td class="text-num">45,000.00</td><td class="text-num">46,006.60</td>
                  <td class="text-num">28,000.00</td><td class="text-num">22,180.00</td>
                  <td class="text-num" style="color:var(--green);">+23,826.60</td>
                  <td class="text-num" style="font-weight:700; color:var(--green);">57,120.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else if (repType === "rep-suppliers") {
    container.innerHTML = `
      <div class="card" style="margin-bottom:0;">
        ${makeReportHeader(
          "تقرير مقارنة أسعار الموردين والوفر المالي المحقق (Supplier Price Benchmark & Savings)",
          "تحليل أفضل عروض الأسعار المسجلة في قاعدة Master Data وتحديد المورد الأرخص والوفر الإجمالي",
          "SSOT Price Benchmarking",
          "badge-green"
        )}
        <div class="card-body" style="padding:20px;">
          <div class="kpi-grid" style="margin-bottom:20px; grid-template-columns:repeat(4, 1fr);">
            <div class="kpi-card green"><div class="kpi-header"><span class="kpi-label">إجمالي الوفر المالي المحقق</span></div><div class="kpi-value text-num" style="color:var(--green)">18,450</div><div class="kpi-footer">ر.س · باختيار أقل سعر توريد</div></div>
            <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">عدد المواد المقارنة</span></div><div class="kpi-value text-num">30 صنف</div><div class="kpi-footer">خامات ومواد إنشائية</div></div>
            <div class="kpi-card" style="border-top:4px solid var(--teal);"><div class="kpi-header"><span class="kpi-label">متوسط نسبة التوفير</span></div><div class="kpi-value text-num" style="color:var(--teal)">9.8%</div><div class="kpi-footer">مقارنة بمتوسط السوق</div></div>
            <div class="kpi-card" style="border-top:4px solid var(--navy);"><div class="kpi-header"><span class="kpi-label">المورد الأكثر تنافسية</span></div><div class="kpi-value" style="font-size:16px; font-weight:800; color:var(--navy);">أسمنت ينبع</div><div class="kpi-footer">حائز على 65% من البنود</div></div>
          </div>

          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>المادة الخام</th><th>الوحدة</th>
                <th class="text-num">أقل سعر (🟩)</th>
                <th class="text-num">ثاني أقل سعر (🟨)</th>
                <th class="text-num">أعلى سعر (🟥)</th>
                <th class="text-num">فرق السعر (الوفر)</th>
                <th>المورد الفائز الموصى به</th>
                <th class="text-center">تقييم المورد</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td><strong>أسمنت بورتلاندي عادي 50 كجم</strong></td><td>كيس</td>
                  <td class="text-num" style="background:#D1FAE5; font-weight:800; color:#065F46;">16.50</td>
                  <td class="text-num" style="background:#FEF3C7; color:#92400E;">17.50</td>
                  <td class="text-num" style="background:#FEE2E2; color:#991B1B;">19.00</td>
                  <td class="text-num" style="font-weight:700; color:var(--green);">2.50 ر.س (13.1%)</td>
                  <td><strong>شركة أسمنت ينبع والمدينة</strong></td>
                  <td class="text-center"><span class="badge badge-green">A+ معتمد</span></td>
                </tr>
                <tr>
                  <td><strong>رمل أحمر مغسول ناعم</strong></td><td>م³</td>
                  <td class="text-num" style="background:#D1FAE5; font-weight:800; color:#065F46;">42.00</td>
                  <td class="text-num" style="background:#FEF3C7; color:#92400E;">45.00</td>
                  <td class="text-num" style="background:#FEE2E2; color:#991B1B;">48.00</td>
                  <td class="text-num" style="font-weight:700; color:var(--green);">6.00 ر.س (12.5%)</td>
                  <td><strong>مؤسسة الرمال الحديثة</strong></td>
                  <td class="text-center"><span class="badge badge-green">A معتمد</span></td>
                </tr>
                <tr>
                  <td><strong>حديد تسليح سابك گريد 60</strong></td><td>طن</td>
                  <td class="text-num" style="background:#D1FAE5; font-weight:800; color:#065F46;">2,850.00</td>
                  <td class="text-num" style="background:#FEF3C7; color:#92400E;">2,920.00</td>
                  <td class="text-num" style="background:#FEE2E2; color:#991B1B;">3,050.00</td>
                  <td class="text-num" style="font-weight:700; color:var(--green);">200.00 ر.س (6.5%)</td>
                  <td><strong>شركة سابك للحديد والصلب</strong></td>
                  <td class="text-center"><span class="badge badge-green">AAA معتمد</span></td>
                </tr>
                <tr>
                  <td><strong>دهان مائي داخلي نصف لمعة</strong></td><td>برميل</td>
                  <td class="text-num" style="background:#D1FAE5; font-weight:800; color:#065F46;">210.00</td>
                  <td class="text-num" style="background:#FEF3C7; color:#92400E;">225.00</td>
                  <td class="text-num" style="background:#FEE2E2; color:#991B1B;">240.00</td>
                  <td class="text-num" style="font-weight:700; color:var(--green);">30.00 ر.س (12.5%)</td>
                  <td><strong>شركة دهانات الجزيرة</strong></td>
                  <td class="text-center"><span class="badge badge-green">A معتمد</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
}

function openModal(id) { document.getElementById(id)?.classList.add("show"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("show"); }

function showToast(msg) {
  const t = document.getElementById("toast-msg");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3500);
}

function switchProcTab(btn, tabId) {
  btn.parentElement.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active"));
  document.querySelectorAll("#view-procurement .tab-content").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById(tabId)?.classList.add("active");
}

function exportPrimaveraXER() {
  showToast("تم توليد وتصدير ملف الجدول الزمني بصيغة Primavera P6 XER بنجاح.");
}

function calculateCPM() {
  showToast("تم إجراء تحليل المسار الحرج (CPM): المسار الحرج يمر عبر بند لياسة الحوائط والدهانات.");
}

async function connectExcel() {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'Excel Workbook', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }]
    });
    MimarERP.excelHandle = handle;
    const file = await handle.getFile();
    MimarERP.workbookZip = await window.JSZip.loadAsync(await file.arrayBuffer());
    document.querySelector("#btn-excel-sync span").textContent = "متصل: " + file.name;
    document.querySelector("#btn-excel-sync").className = "btn btn-success btn-sm";
    showToast("تم ربط قاعدة بيانات Excel المؤسسية بنجاح: " + file.name);
  } catch (e) {
    if (e.name !== 'AbortError') showToast("تعذر ربط الملف: " + e.message);
  }
}


// -------------------------------------------------------------
// SUPPLIER PRICE COMPARISON RENDERING (3-Color Benchmarking)
// -------------------------------------------------------------
function renderSupplierComparisonTable() {
  const tbody = document.querySelector("#tbl-supplier-comparison tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const compData = MimarERP.priceComparisonMaster || [];
  compData.forEach(item => {
    const tr = document.createElement("tr");

    // Determine colors
    const p1 = item.price_sup1;
    const p2 = item.price_sup2;
    const p3 = item.price_sup3;
    const p4 = item.price_sup4;
    const minP = item.min_price;
    const secP = item.second_min_price;
    const maxP = item.max_price;

    function getStyle(p) {
      if (p === minP) return 'style="background:#DCFCE7; color:#166534; font-weight:bold;" title="أقل سعر"';
      if (p === secP) return 'style="background:#FEF3C7; color:#92400E; font-weight:bold;" title="ثاني أقل سعر"';
      if (p === maxP) return 'style="background:#FEE2E2; color:#991B1B;" title="أعلى سعر"';
      return '';
    }

    tr.innerHTML = `
      <td><strong>${item.item_name}</strong></td>
      <td class="text-center"><span class="badge badge-blue">${item.unit}</span></td>
      <td>${item.category}</td>
      <td class="text-num" ${getStyle(p1)}>${p1.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" ${getStyle(p2)}>${p2.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" ${getStyle(p3)}>${p3.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" ${getStyle(p4)}>${p4.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" style="background:#DCFCE7; color:#166534; font-weight:bold;">${minP.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" style="background:#FEF3C7; color:#92400E; font-weight:bold;">${secP.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" style="font-weight:bold;">${item.price_diff.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-center"><span class="badge badge-green">${item.savings_pct}%</span></td>
      <td><span class="badge badge-teal" style="font-size:11px;"><i class="fas fa-award" style="margin-left:4px;"></i>${item.best_supplier}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function filterSupplierComparison() {
  const q = (document.getElementById("search-comp-items").value || "").trim().toLowerCase();
  const catFilter = document.getElementById("filter-comp-category").value;
  const tbody = document.querySelector("#tbl-supplier-comparison tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const compData = MimarERP.priceComparisonMaster || [];
  const filtered = compData.filter(item => {
    const matchCat = !catFilter || item.category === catFilter;
    const matchQ = !q || item.item_name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.best_supplier.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  filtered.forEach(item => {
    const tr = document.createElement("tr");
    const p1 = item.price_sup1;
    const p2 = item.price_sup2;
    const p3 = item.price_sup3;
    const p4 = item.price_sup4;
    const minP = item.min_price;
    const secP = item.second_min_price;
    const maxP = item.max_price;

    function getStyle(p) {
      if (p === minP) return 'style="background:#DCFCE7; color:#166534; font-weight:bold;"';
      if (p === secP) return 'style="background:#FEF3C7; color:#92400E; font-weight:bold;"';
      if (p === maxP) return 'style="background:#FEE2E2; color:#991B1B;"';
      return '';
    }

    tr.innerHTML = `
      <td><strong>${item.item_name}</strong></td>
      <td class="text-center"><span class="badge badge-blue">${item.unit}</span></td>
      <td>${item.category}</td>
      <td class="text-num" ${getStyle(p1)}>${p1.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" ${getStyle(p2)}>${p2.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" ${getStyle(p3)}>${p3.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" ${getStyle(p4)}>${p4.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" style="background:#DCFCE7; color:#166534; font-weight:bold;">${minP.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" style="background:#FEF3C7; color:#92400E; font-weight:bold;">${secP.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" style="font-weight:bold;">${item.price_diff.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-center"><span class="badge badge-green">${item.savings_pct}%</span></td>
      <td><span class="badge badge-teal" style="font-size:11px;"><i class="fas fa-award" style="margin-left:4px;"></i>${item.best_supplier}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// -------------------------------------------------------------
// CONTRACTORS MATRIX & RATES RENDERING
// -------------------------------------------------------------
function renderContractorsMatrixTable() {
  const tbodyCon = document.querySelector("#tbl-contractors-matrix tbody");
  if (tbodyCon) {
    tbodyCon.innerHTML = "";
    (MimarERP.contractorsMaster || []).forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-num"><strong>${c.contractor_id}</strong></td>
        <td><strong>${c.contractor_name}</strong></td>
        <td><span class="badge badge-teal">${c.specialty}</span></td>
        <td class="text-center">${c.labor_count}</td>
        <td class="text-center">${c.tech_count}</td>
        <td class="text-center">${c.supervisor_count}</td>
        <td class="text-center" style="font-weight:bold; color:var(--blue);">${c.total_crew} فرد</td>
        <td>${c.city}</td>
        <td><small>${c.contact_person} | ${c.phone}</small></td>
        <td class="text-center"><span class="badge badge-green">${c.rating}</span></td>
        <td class="text-center"><small>${c.speed_rating}</small></td>
        <td class="text-center">${c.prev_projects} مشروع</td>
        <td><span class="badge badge-green">${c.status}</span></td>
      `;
      tbodyCon.appendChild(tr);
    });
  }

  const tbodyRates = document.querySelector("#tbl-contractor-rates tbody");
  if (tbodyRates) {
    tbodyRates.innerHTML = "";
    (MimarERP.contractorRatesMaster || []).forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-num"><strong>${r.rate_id}</strong></td>
        <td><strong>${r.contractor_name}</strong></td>
        <td><span class="badge badge-blue">${r.specialty}</span></td>
        <td>${r.activity_desc}</td>
        <td class="text-center"><span class="badge badge-teal">${r.unit}</span></td>
        <td class="text-num" style="font-weight:bold; color:var(--teal);">${r.unit_rate.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
        <td><small>${r.daily_production}</small></td>
        <td><small>${r.waste_resp}</small></td>
        <td class="text-center"><span class="badge badge-green">${r.safety_comp}</span></td>
        <td><span class="badge badge-green">${r.status}</span></td>
      `;
      tbodyRates.appendChild(tr);
    });
  }
}

function filterContractorsMatrix() {
  const q = (document.getElementById("search-contractors").value || "").trim().toLowerCase();
  const specFilter = document.getElementById("filter-contractor-spec").value;
  const tbodyCon = document.querySelector("#tbl-contractors-matrix tbody");
  if (!tbodyCon) return;
  tbodyCon.innerHTML = "";

  const filtered = (MimarERP.contractorsMaster || []).filter(c => {
    const matchSpec = !specFilter || c.specialty.includes(specFilter);
    const matchQ = !q || c.contractor_name.toLowerCase().includes(q) || c.specialty.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
    return matchSpec && matchQ;
  });

  filtered.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${c.contractor_id}</strong></td>
      <td><strong>${c.contractor_name}</strong></td>
      <td><span class="badge badge-teal">${c.specialty}</span></td>
      <td class="text-center">${c.labor_count}</td>
      <td class="text-center">${c.tech_count}</td>
      <td class="text-center">${c.supervisor_count}</td>
      <td class="text-center" style="font-weight:bold; color:var(--blue);">${c.total_crew} فرد</td>
      <td>${c.city}</td>
      <td><small>${c.contact_person} | ${c.phone}</small></td>
      <td class="text-center"><span class="badge badge-green">${c.rating}</span></td>
      <td class="text-center"><small>${c.speed_rating}</small></td>
      <td class="text-center">${c.prev_projects} مشروع</td>
      <td><span class="badge badge-green">${c.status}</span></td>
    `;
    tbodyCon.appendChild(tr);
  });
}

// =============================================================================
// SECTION: COST CONTROL — EVM REGISTER
// =============================================================================
function renderCostControlTable() {
  const tbody = document.getElementById("tbl-cost-control-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const data = MimarERP.costControlRegister || [];
  if (!data.length) return;

  let totBAC=0,totPV=0,totEV=0,totAC=0,totEAC=0,totCV=0;

  data.forEach(r => {
    const cpi = r.ac > 0 ? r.ev / r.ac : 1;
    const spi = r.pv > 0 ? r.ev / r.pv : 1;
    const eac = cpi > 0 ? r.bac / cpi : r.bac;
    const cv  = r.ev - r.ac;
    totBAC+=r.bac; totPV+=r.pv; totEV+=r.ev; totAC+=r.ac; totEAC+=eac; totCV+=cv;

    const cpiColor = cpi >= 1 ? "var(--green)" : (cpi >= 0.9 ? "var(--amber)" : "var(--red)");
    const spiColor = spi >= 1 ? "var(--green)" : (spi >= 0.9 ? "var(--amber)" : "var(--red)");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:var(--teal)">${r.wbs_code}</strong></td>
      <td>${r.description}</td>
      <td class="text-num">${r.bac.toLocaleString("ar-SA")}</td>
      <td class="text-num">${r.pv.toLocaleString("ar-SA")}</td>
      <td class="text-num">${r.ev.toLocaleString("ar-SA")}</td>
      <td class="text-num">${r.ac.toLocaleString("ar-SA")}</td>
      <td class="text-num" style="font-weight:800;color:${cpiColor}">${cpi.toFixed(2)}</td>
      <td class="text-num" style="font-weight:800;color:${spiColor}">${spi.toFixed(2)}</td>
      <td class="text-num">${eac.toLocaleString("ar-SA",{maximumFractionDigits:0})}</td>
      <td class="text-num" style="color:${cv>=0?"var(--green)":"var(--red)"}">${cv.toLocaleString("ar-SA",{maximumFractionDigits:0})}</td>
    `;
    tbody.appendChild(tr);
  });

  // Update KPI cards
  const fmt = (n) => (n/1000000).toFixed(2) + " م";
  const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  setEl("cc-kpi-bac", fmt(totBAC));
  setEl("cc-kpi-ac",  fmt(totAC));
  const projCPI = totAC>0 ? totEV/totAC : 1;
  const projSPI = totPV>0 ? totEV/totPV : 1;
  const projEAC = projCPI>0 ? totBAC/projCPI : totBAC;
  const projVAC = totBAC - projEAC;
  setEl("cc-kpi-cpi", projCPI.toFixed(3));
  setEl("cc-kpi-spi", projSPI.toFixed(3));
  setEl("cc-kpi-eac", fmt(projEAC));
  setEl("cc-kpi-vac", fmt(projVAC));

  // Footer totals
  setEl("cc-foot-bac", totBAC.toLocaleString("ar-SA",{maximumFractionDigits:0}));
  setEl("cc-foot-pv",  totPV.toLocaleString("ar-SA",{maximumFractionDigits:0}));
  setEl("cc-foot-ev",  totEV.toLocaleString("ar-SA",{maximumFractionDigits:0}));
  setEl("cc-foot-ac",  totAC.toLocaleString("ar-SA",{maximumFractionDigits:0}));
  setEl("cc-foot-cpi", projCPI.toFixed(3));
  setEl("cc-foot-spi", projSPI.toFixed(3));
  setEl("cc-foot-eac", projEAC.toLocaleString("ar-SA",{maximumFractionDigits:0}));
  setEl("cc-foot-cv",  totCV.toLocaleString("ar-SA",{maximumFractionDigits:0}));
}

// =============================================================================
// SECTION: CRM — OPPORTUNITY PIPELINE
// =============================================================================
function renderCRMTable() {
  const tbody = document.getElementById("tbl-crm-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const data = MimarERP.crmOpportunities || [];

  const stageCount = {lead:0, qualification:0, proposal:0, negotiation:0, closing:0};
  const stageBadge = {
    "عميل محتمل":   "badge-blue",
    "تأهيل":         "badge-blue",
    "عرض":           "badge-amber",
    "تفاوض":         "badge-purple",
    "إغلاق":         "badge-green",
    "خسارة":         "badge-red"
  };

  data.forEach(r => {
    // Count pipeline stages
    if(r.stage==="عميل محتمل") stageCount.lead++;
    else if(r.stage==="تأهيل") stageCount.qualification++;
    else if(r.stage==="عرض") stageCount.proposal++;
    else if(r.stage==="تفاوض") stageCount.negotiation++;
    else if(r.stage==="إغلاق") stageCount.closing++;

    const badge = stageBadge[r.stage] || "badge-blue";
    const probColor = r.win_probability >= 70 ? "var(--green)" : (r.win_probability >= 40 ? "var(--amber)" : "var(--red)");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:var(--teal)">${r.opp_id}</strong></td>
      <td><strong>${r.client_name}</strong></td>
      <td>${r.project_name}</td>
      <td class="text-num">${Number(r.estimated_value).toLocaleString("ar-SA")}</td>
      <td><span class="badge ${badge}">${r.stage}</span></td>
      <td class="text-num" style="font-weight:800;color:${probColor}">${r.win_probability}%</td>
      <td>${r.owner}</td>
      <td>${r.expected_close}</td>
      <td><span class="badge ${r.status==="نشط"?"badge-green":"badge-red"}">${r.status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  // Update pipeline stage counters
  const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  setEl("crm-stage-lead",      stageCount.lead);
  setEl("crm-stage-qualify",   stageCount.qualification);
  setEl("crm-stage-proposal",  stageCount.proposal);
  setEl("crm-stage-negotiate", stageCount.negotiation);
  setEl("crm-stage-close",     stageCount.closing);
}

// =============================================================================
// SECTION: TENDERS — TENDER REGISTER
// =============================================================================
function renderTendersTable() {
  const tbody = document.getElementById("tbl-tenders-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const data = MimarERP.tendersMaster || [];

  let active=0, submitted=0, won=0;

  data.forEach(r => {
    if(r.status==="قيد الدراسة") active++;
    if(r.status==="مقدمة") submitted++;
    if(r.award_result==="رابح") won++;

    const statusBadge = r.status==="مقدمة"?"badge-amber":r.status==="قيد الدراسة"?"badge-blue":"badge-green";
    const awardBadge  = r.award_result==="رابح"?"badge-green":r.award_result==="خاسر"?"badge-red":"badge-blue";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:var(--teal)">${r.tender_id}</strong></td>
      <td><strong>${r.project_name}</strong></td>
      <td>${r.owner}</td>
      <td><span class="badge badge-blue">${r.contract_type}</span></td>
      <td class="text-num">${Number(r.bid_value).toLocaleString("ar-SA")}</td>
      <td>${r.deadline}</td>
      <td><span class="badge ${statusBadge}">${r.status}</span></td>
      <td><span class="badge ${awardBadge}">${r.award_result}</span></td>
    `;
    tbody.appendChild(tr);
  });

  const total = submitted + won;
  const winRate = total > 0 ? Math.round((won / total) * 100) : 0;
  const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  setEl("tndr-kpi-active",    active);
  setEl("tndr-kpi-submitted", submitted);
  setEl("tndr-kpi-won",       won);
  setEl("tndr-kpi-win-rate",  winRate + "%");
}

// =============================================================================
// SECTION: HR — EMPLOYEE REGISTER
// =============================================================================
function renderHRTable() {
  const tbody = document.getElementById("tbl-hr-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const data = MimarERP.hrEmployees || [];

  let totalEmp = data.length;
  let activeEmp = data.filter(e => e.status === "نشط").length;
  let onLeave   = data.filter(e => e.status === "إجازة").length;
  let expiring  = data.filter(e => {
    if (!e.contract_end) return false;
    const end = new Date(e.contract_end);
    const now = new Date();
    const diff = (end - now) / (1000*60*60*24);
    return diff > 0 && diff <= 30;
  }).length;

  data.forEach(r => {
    const statusBadge = r.status==="نشط"?"badge-green":r.status==="إجازة"?"badge-amber":"badge-red";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:var(--teal)">${r.emp_id}</strong></td>
      <td><strong>${r.name}</strong></td>
      <td>${r.title}</td>
      <td>${r.department}</td>
      <td>${r.project}</td>
      <td><span class="badge badge-blue">${r.contract_type}</span></td>
      <td>${r.hire_date}</td>
      <td class="text-num">${Number(r.basic_salary).toLocaleString("ar-SA")} ر.س</td>
      <td><span class="badge ${statusBadge}">${r.status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  setEl("hr-kpi-total",    totalEmp);
  setEl("hr-kpi-active",   activeEmp);
  setEl("hr-kpi-leave",    onLeave);
  setEl("hr-kpi-expiring", expiring);
}

// =============================================================================
// SECTION: PAYROLL — SALARY REGISTER
// =============================================================================
function renderPayrollTable() {
  const tbody = document.getElementById("tbl-payroll-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const data = MimarERP.payrollRecords || [];

  let totBasic=0, totAllowances=0, totDeductions=0, totNet=0;

  data.forEach(r => {
    const allowances = (r.housing||0) + (r.transport||0) + (r.performance||0);
    const net = r.basic_salary + allowances - (r.deductions||0);
    totBasic      += r.basic_salary;
    totAllowances += allowances;
    totDeductions += (r.deductions||0);
    totNet        += net;

    const statusBadge = r.payroll_status==="مدفوع"?"badge-green":"badge-amber";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${r.name}</strong></td>
      <td>${r.department}</td>
      <td class="text-num">${Number(r.basic_salary).toLocaleString("ar-SA")}</td>
      <td class="text-num">${Number(r.housing||0).toLocaleString("ar-SA")}</td>
      <td class="text-num">${Number(r.transport||0).toLocaleString("ar-SA")}</td>
      <td class="text-num">${Number(r.performance||0).toLocaleString("ar-SA")}</td>
      <td class="text-num" style="color:var(--red)">${Number(r.deductions||0).toLocaleString("ar-SA")}</td>
      <td class="text-num" style="font-weight:800;color:var(--green)">${net.toLocaleString("ar-SA")}</td>
      <td><span class="badge ${statusBadge}">${r.payroll_status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  // Totals row
  const tfoot = document.getElementById("tbl-payroll-foot");
  if (tfoot) {
    tfoot.innerHTML = `
      <tr style="background:#E2E8F0;font-weight:800;">
        <td colspan="2" style="text-align:center;">الإجمالي الكلي</td>
        <td class="text-num">${totBasic.toLocaleString("ar-SA")}</td>
        <td class="text-num" colspan="3">${totAllowances.toLocaleString("ar-SA")}</td>
        <td class="text-num" style="color:var(--red)">${totDeductions.toLocaleString("ar-SA")}</td>
        <td class="text-num" style="color:var(--green)">${totNet.toLocaleString("ar-SA")}</td>
        <td></td>
      </tr>
    `;
  }

  const fmt = (n) => (n/1000).toFixed(1) + "K";
  const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  setEl("pay-kpi-basic",      fmt(totBasic));
  setEl("pay-kpi-allowances", fmt(totAllowances));
  setEl("pay-kpi-deductions", fmt(totDeductions));
  setEl("pay-kpi-net",        fmt(totNet));
}

// =============================================================================
// SECTION: FINANCE TABS
// =============================================================================
function switchFinanceTab(btn, tabId) {
  btn.parentElement.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active"));
  document.querySelectorAll("#view-finance .tab-content").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add("active");
}

function renderFinanceTabs() {
  renderFinanceBillings();
  renderFinanceAP();
  renderFinanceBudget();
}

function renderFinanceBillings() {
  const tbody = document.getElementById("tbl-finance-billings-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const data = MimarERP.financeBillings || [];
  let totSubmitted=0, totCollected=0;
  data.forEach(r => {
    totSubmitted += r.amount;
    totCollected += r.collected || 0;
    const statusBadge = r.status==="محصل"?"badge-green":r.status==="موافق عليه"?"badge-blue":"badge-amber";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:var(--teal)">${r.billing_id}</strong></td>
      <td>${r.project}</td>
      <td>${r.owner}</td>
      <td class="text-num">${Number(r.amount).toLocaleString("ar-SA")}</td>
      <td>${r.submission_date}</td>
      <td>${r.approval_date || "—"}</td>
      <td><span class="badge ${statusBadge}">${r.status}</span></td>
      <td class="text-num" style="color:var(--green)">${Number(r.collected||0).toLocaleString("ar-SA")}</td>
    `;
    tbody.appendChild(tr);
  });
  const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  setEl("fin-kpi-submitted", (totSubmitted/1000000).toFixed(2) + " م");
  setEl("fin-kpi-collected", (totCollected/1000000).toFixed(2) + " م");
  const outstanding = totSubmitted - totCollected;
  setEl("fin-kpi-outstanding", (outstanding/1000000).toFixed(2) + " م");
}

function renderFinanceAP() {
  const tbody = document.getElementById("tbl-finance-ap-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const data = MimarERP.financeAP || [];
  data.forEach(r => {
    const isOverdue = r.status === "متأخر";
    const statusBadge = r.status==="مدفوع"?"badge-green":isOverdue?"badge-red":"badge-amber";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:var(--teal)">${r.invoice_id}</strong></td>
      <td>${r.supplier}</td>
      <td class="text-num">${Number(r.amount).toLocaleString("ar-SA")}</td>
      <td>${r.due_date}</td>
      <td><span class="badge ${statusBadge}">${r.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderFinanceBudget() {
  const tbody = document.getElementById("tbl-finance-budget-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const data = MimarERP.financeBudget || [];
  data.forEach(r => {
    const pct = r.budget > 0 ? ((r.spent / r.budget)*100).toFixed(1) : 0;
    const remaining = r.budget - r.spent;
    const barColor = pct >= 90 ? "var(--red)" : pct >= 70 ? "var(--amber)" : "var(--green)";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${r.item}</strong></td>
      <td class="text-num">${Number(r.budget).toLocaleString("ar-SA")}</td>
      <td class="text-num">${Number(r.spent).toLocaleString("ar-SA")}</td>
      <td class="text-num" style="color:${remaining>=0?"var(--green)":"var(--red)"}">${Number(remaining).toLocaleString("ar-SA")}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="flex:1;height:8px;background:#E2E8F0;border-radius:4px;">
            <div style="width:${Math.min(pct,100)}%;height:100%;background:${barColor};border-radius:4px;"></div>
          </div>
          <span style="font-weight:700;color:${barColor};min-width:40px;">${pct}%</span>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// =============================================================================
// SECTION: EQUIPMENT — FLEET MANAGEMENT
// =============================================================================
function renderEquipmentTable() {
  const tbody = document.getElementById("tbl-equipment-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const data = MimarERP.equipmentMaster || [];

  let activeCount=0, maintenanceCount=0, idleCount=0;
  data.forEach(r => {
    if(r.status==="تشغيل") activeCount++;
    else if(r.status==="صيانة") maintenanceCount++;
    else idleCount++;
  });

  data.forEach(r => {
    const statusBadge = r.status==="تشغيل"?"badge-green":r.status==="صيانة"?"badge-amber":"badge-red";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:var(--teal)">${r.equip_id}</strong></td>
      <td><strong>${r.name}</strong></td>
      <td>${r.type}</td>
      <td>${r.model}</td>
      <td>${r.project}</td>
      <td class="text-num">${Number(r.operating_hours).toLocaleString("ar-SA")}</td>
      <td class="text-num">${Number(r.maintenance_hours).toLocaleString("ar-SA")}</td>
      <td class="text-num">${Number(r.daily_cost).toLocaleString("ar-SA")} ر.س</td>
      <td><span class="badge ${statusBadge}">${r.status}</span></td>
      <td>${r.next_maintenance}</td>
    `;
    tbody.appendChild(tr);
  });

  const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  setEl("equip-kpi-total",       data.length);
  setEl("equip-kpi-active",      activeCount);
  setEl("equip-kpi-maintenance", maintenanceCount);
  setEl("equip-kpi-idle",        idleCount);
}

// =============================================================================
// UPDATE renderAllViews to include new modules
// =============================================================================
const _origRenderAll = window.renderAllViews;
window.renderAllViews = function() {
  if (typeof _origRenderAll === "function") _origRenderAll();
  renderCostControlTable();
  renderCRMTable();
  renderTendersTable();
  renderHRTable();
  renderPayrollTable();
  renderFinanceTabs();
  renderEquipmentTable();
};


// =============================================================================
// UNIVERSAL EXPORT UTILITY (Arabic UTF-8 BOM CSV / Excel Compatible)
// =============================================================================
function exportTableToExcel(tableId, defaultFilename = "ERP-Export.csv") {
  const table = typeof tableId === 'string' ? document.getElementById(tableId) : tableId;
  if (!table) {
    showToast("لم يتم العثور على جدول بيانات للتصدير.");
    return;
  }

  let csv = [];
  const rows = table.querySelectorAll("tr");

  for (let i = 0; i < rows.length; i++) {
    const row = [];
    const cols = rows[i].querySelectorAll("th, td");
    for (let j = 0; j < cols.length; j++) {
      let text = (cols[j].innerText || "").replace(/\r?\n|\r/g, " ").replace(/"/g, '""').trim();
      row.push('"' + text + '"');
    }
    if (row.length > 0) csv.push(row.join(","));
  }

  const csvString = "\uFEFF" + csv.join("\r\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("تم تصدير الجدول بنجاح بصيغة متوافقة مع Excel: " + defaultFilename);
}

function exportCurrentViewTable() {
  const activeView = document.querySelector(".page-view.active");
  if (!activeView) return;
  const table = activeView.querySelector("table");
  if (!table) {
    showToast("لا يوجد جدول بيانات قابل للتصدير في الشاشة الحالية.");
    return;
  }
  const viewId = activeView.id.replace("view-", "");
  exportTableToExcel(table, `Mimar-ERP-${viewId}.csv`);
}


// =============================================================================
// BIM 3D VIEWER & 4D TIME SIMULATION CONTROLLER (Vanilla WebGL / 2.5D Canvas)
// =============================================================================
let bimState = {
  yaw: 35, // degrees
  pitch: 25, // degrees
  zoom: 1.0,
  panX: 0,
  panY: 0,
  selectedId: null,
  currentPhase: 4,
  is4DPlaying: false,
  animationTimer: null,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0
};

function initBIMViewer() {
  const canvas = document.getElementById("bim-canvas");
  if (!canvas) return;

  // Mouse drag for 3D rotation
  canvas.onmousedown = (e) => {
    bimState.isDragging = true;
    bimState.lastMouseX = e.clientX;
    bimState.lastMouseY = e.clientY;
    canvas.style.cursor = "grabbing";
  };

  window.onmousemove = (e) => {
    if (!bimState.isDragging) return;
    const dx = e.clientX - bimState.lastMouseX;
    const dy = e.clientY - bimState.lastMouseY;
    bimState.yaw += dx * 0.5;
    bimState.pitch = Math.max(-60, Math.min(80, bimState.pitch + dy * 0.5));
    bimState.lastMouseX = e.clientX;
    bimState.lastMouseY = e.clientY;
    drawBIMScene();
  };

  window.onmouseup = () => {
    if (bimState.isDragging) {
      bimState.isDragging = false;
      const c = document.getElementById("bim-canvas");
      if (c) c.style.cursor = "grab";
    }
  };

  // Click on canvas to select element
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    hitTestBIM(mx, my);
  };

  // Mouse wheel zoom
  canvas.onwheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomBIM(1.1);
    else zoomBIM(0.9);
  };

  drawBIMScene();
  renderBIMTable();
}

function project3D(x, y, z, originX, originY) {
  const radYaw = (bimState.yaw * Math.PI) / 180;
  const radPitch = (bimState.pitch * Math.PI) / 180;

  // Yaw rotation around Z axis
  const x1 = x * Math.cos(radYaw) - y * Math.sin(radYaw);
  const y1 = x * Math.sin(radYaw) + y * Math.cos(radYaw);
  const z1 = z;

  // Pitch rotation around X axis
  const y2 = y1 * Math.cos(radPitch) - z1 * Math.sin(radPitch);
  const z2 = y1 * Math.sin(radPitch) + z1 * Math.cos(radPitch);

  const scale = 2.4 * bimState.zoom;
  const px = originX + bimState.panX + x1 * scale;
  const py = originY + bimState.panY - z2 * scale + y2 * scale * 0.35;
  return { px, py, depth: y2 };
}

function drawBIMScene() {
  const canvas = document.getElementById("bim-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const ox = w / 2;
  const oy = h / 2 + 50;

  // Clear background
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(0, 0, w, h);

  // Draw 3D Grid on ground (Z = 0)
  ctx.strokeStyle = "rgba(51, 65, 85, 0.4)";
  ctx.lineWidth = 1;
  const gridSize = 100;
  const gridStep = 25;
  for (let g = -gridSize; g <= gridSize; g += gridStep) {
    const p1 = project3D(g, -gridSize, 0, ox, oy);
    const p2 = project3D(g, gridSize, 0, ox, oy);
    ctx.beginPath();
    ctx.moveTo(p1.px, p1.py);
    ctx.lineTo(p2.px, p2.py);
    ctx.stroke();

    const p3 = project3D(-gridSize, g, 0, ox, oy);
    const p4 = project3D(gridSize, g, 0, ox, oy);
    ctx.beginPath();
    ctx.moveTo(p3.px, p3.py);
    ctx.lineTo(p4.px, p4.py);
    ctx.stroke();
  }

  const elements = MimarERP.bimElements || [];
  // Sort elements by depth for correct 3D painter's algorithm
  const renderList = elements
    .filter(el => el.phase <= bimState.currentPhase)
    .map(el => {
      const center = project3D(el.x + el.dx / 2, el.y + el.dy / 2, el.z + el.dz / 2, ox, oy);
      return { element: el, depth: center.depth };
    })
    .sort((a, b) => a.depth - b.depth);

  // Draw each 3D Box element
  renderList.forEach(item => {
    const el = item.element;
    const isSelected = el.elm_id === bimState.selectedId;

    // 8 vertices of bounding box
    const x = el.x, y = el.y, z = el.z;
    const dx = el.dx, dy = el.dy, dz = el.dz;
    const v = [
      project3D(x, y, z, ox, oy),
      project3D(x + dx, y, z, ox, oy),
      project3D(x + dx, y + dy, z, ox, oy),
      project3D(x, y + dy, z, ox, oy),
      project3D(x, y, z + dz, ox, oy),
      project3D(x + dx, y, z + dz, ox, oy),
      project3D(x + dx, y + dy, z + dz, ox, oy),
      project3D(x, y + dy, z + dz, ox, oy)
    ];

    // Faces: [indices, color shade]
    const baseColor = isSelected ? "#F59E0B" : el.color;
    ctx.fillStyle = baseColor;
    ctx.strokeStyle = isSelected ? "#FFFFFF" : "rgba(15,23,42,0.8)";
    ctx.lineWidth = isSelected ? 2 : 1;

    const faces = [
      [4, 5, 6, 7], // Top
      [0, 1, 5, 4], // Front
      [1, 2, 6, 5], // Right
      [2, 3, 7, 6], // Back
      [3, 0, 4, 7]  // Left
    ];

    faces.forEach(f => {
      ctx.beginPath();
      ctx.moveTo(v[f[0]].px, v[f[0]].py);
      ctx.lineTo(v[f[1]].px, v[f[1]].py);
      ctx.lineTo(v[f[2]].px, v[f[2]].py);
      ctx.lineTo(v[f[3]].px, v[f[3]].py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // Label on selected element
    if (isSelected) {
      const topCenter = v[7];
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 11px Cairo, sans-serif";
      ctx.fillText(el.family, topCenter.px + 5, topCenter.py - 8);
    }
  });
}

function hitTestBIM(mx, my) {
  const canvas = document.getElementById("bim-canvas");
  if (!canvas) return;
  const ox = canvas.width / 2;
  const oy = canvas.height / 2 + 50;

  const elements = MimarERP.bimElements || [];
  let found = null;

  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (el.phase > bimState.currentPhase) continue;
    const center = project3D(el.x + el.dx / 2, el.y + el.dy / 2, el.z + el.dz / 2, ox, oy);
    const dist = Math.hypot(mx - center.px, my - center.py);
    if (dist < 40) {
      found = el;
      break;
    }
  }

  if (found) {
    selectBIMElement(found.elm_id);
  }
}

function selectBIMElement(elmId) {
  bimState.selectedId = elmId;
  drawBIMScene();

  const el = (MimarERP.bimElements || []).find(e => e.elm_id === elmId);
  const emptyState = document.getElementById("bim-empty-state");
  const panel = document.getElementById("bim-selected-panel");

  if (!el || !panel) return;
  if (emptyState) emptyState.style.display = "none";
  panel.style.display = "block";

  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl("insp-cat", el.category);
  setEl("insp-name", el.family);
  setEl("insp-level", el.level);
  setEl("insp-phase", "المرحلة " + el.phase);
  setEl("insp-vol", el.vol_m3.toFixed(2) + " م³");
  setEl("insp-area", el.area_m2.toFixed(2) + " م²");
  setEl("insp-dim", el.dimensions);
  setEl("insp-boq", el.boq_ref);

  showToast(`تم تحديد العنصر: ${el.family} (${el.category})`);
}

function rotateBIM(deltaYaw, deltaPitch) {
  bimState.yaw += deltaYaw;
  bimState.pitch += deltaPitch;
  drawBIMScene();
}

function zoomBIM(factor) {
  bimState.zoom = Math.max(0.4, Math.min(3.0, bimState.zoom * factor));
  drawBIMScene();
}

function resetBIMCamera() {
  bimState.yaw = 35;
  bimState.pitch = 25;
  bimState.zoom = 1.0;
  bimState.panX = 0;
  bimState.panY = 0;
  drawBIMScene();
  showToast("تمت إعادة ضبط كاميرا العرض ثلاثي الأبعاد.");
}

function setBIMPhase(phase) {
  bimState.currentPhase = parseInt(phase, 10);
  const phaseNames = ["الأساسات والقواعد", "الهيكل الخرساني والأسقف", "المباني والحوائط والعزل", "التشطيبات والتسليم النهائي"];
  const lbl = document.getElementById("lbl-bim-phase");
  if (lbl) lbl.textContent = "المرحلة " + phase + ": " + (phaseNames[bimState.currentPhase - 1] || "");
  drawBIMScene();
}

function toggle4DSimulation() {
  const btn = document.getElementById("btn-bim-4d-play");
  if (bimState.is4DPlaying) {
    clearInterval(bimState.animationTimer);
    bimState.is4DPlaying = false;
    if (btn) btn.innerHTML = '<i class="fas fa-play"></i> محاكاة 4D';
    showToast("تم إيقاف المحاكاة الزمنية 4D.");
  } else {
    bimState.is4DPlaying = true;
    if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> إيقاف مؤقت';
    showToast("بدء المحاكاة الزمنية 4D لمراحل البناء...");
    let p = 1;
    bimState.animationTimer = setInterval(() => {
      setBIMPhase(p);
      const slider = document.getElementById("slider-bim-phase");
      if (slider) slider.value = p;
      p++;
      if (p > 4) p = 1;
    }, 1800);
  }
}

function transferBIMToTakeoff() {
  const el = (MimarERP.bimElements || []).find(e => e.elm_id === bimState.selectedId);
  if (!el) return;
  showToast(`تم بنجاح نقل كمية العنصر (${el.family} - ${el.vol_m3} م³) إلى دفتر الحصر الهندسي QTO.`);
  switchView('takeoff');
}

function highlightLinkedBOQ() {
  const el = (MimarERP.bimElements || []).find(e => e.elm_id === bimState.selectedId);
  if (!el) return;
  switchView('wbs-boq');
  showToast(`تم التوجيه إلى بند جدول الكميات المرتبط: ${el.boq_ref}`);
}

function exportBIMQuantities() {
  exportTableToExcel('tbl-bim-elements', 'BIM-Model-Takeoff-Schedule.csv');
}

function renderBIMTable() {
  const tbody = document.getElementById("tbl-bim-elements-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const elements = MimarERP.bimElements || [];

  elements.forEach(el => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.onclick = () => selectBIMElement(el.elm_id);
    tr.innerHTML = `
      <td><strong style="color:var(--teal)">${el.elm_id}</strong></td>
      <td><span class="badge badge-purple">${el.category}</span></td>
      <td><strong>${el.family}</strong></td>
      <td>${el.level}</td>
      <td class="text-num">${el.dimensions}</td>
      <td class="text-num" style="font-weight:700; color:var(--blue);">${el.vol_m3.toFixed(2)}</td>
      <td class="text-num">${el.area_m2.toFixed(2)}</td>
      <td><span class="badge badge-blue">مرحلة ${el.phase}</span></td>
      <td><span class="badge badge-green">${el.boq_ref}</span></td>
      <td><button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); selectBIMElement('${el.elm_id}')"><i class="fas fa-crosshairs"></i> معاينة 3D</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// =============================================================================
// SITE DAILY DIARY CONTROLLER
// =============================================================================
function renderSiteDiary() {
  const logs = MimarERP.siteDiaryLogs || [];
  if (!logs.length) return;
  const current = logs[0];

  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl("diary-kpi-manpower", current.total_workforce + " فرد");
  setEl("diary-kpi-hours", current.total_hours + " ساعة");
  setEl("diary-kpi-equipment", current.equipment_active.length + " معدات");
  setEl("diary-kpi-hse", current.hse_status);
  setEl("diary-weather-text", current.weather);
  setEl("diary-shift-text", current.shift);
  setEl("diary-progress-summary", current.progress_summary);
  setEl("diary-qa-notes", current.qa_status);

  // Manpower Table
  const tbody = document.getElementById("tbl-diary-manpower-body");
  if (tbody) {
    tbody.innerHTML = "";
    current.trades.forEach(t => {
      const totH = (t.count * t.hours).toFixed(1);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${t.trade}</strong></td>
        <td class="text-center" style="font-weight:800; color:var(--teal);">${t.count}</td>
        <td class="text-center">${t.hours} س</td>
        <td class="text-num" style="font-weight:700;">${totH} س</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Equipment List
  const eqContainer = document.getElementById("diary-equipment-list");
  if (eqContainer) {
    eqContainer.innerHTML = "";
    current.equipment_active.forEach(eq => {
      const div = document.createElement("div");
      div.style.background = "#F8FAFC";
      div.style.border = "1px solid var(--line)";
      div.style.borderRadius = "6px";
      div.style.padding = "8px 12px";
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      div.innerHTML = `
        <div><strong>${eq.name}</strong> <span style="font-size:11px; color:var(--muted); margin-right:8px;">(${eq.status})</span></div>
        <span class="badge badge-amber">${eq.hours} ساعات تشغيل</span>
      `;
      eqContainer.appendChild(div);
    });
  }
}

function onDiaryDateChange(date) {
  showToast("جاري تحميل تقرير وسجل الموقع لتاريخ: " + date);
  renderSiteDiary();
}

function openNewDiaryModal() {
  showToast("تم فتح نموذج تسجيل التقرير اليومي للموقع.");
}

// =============================================================================
// PUNCH LIST & SNAGGING CONTROLLER
// =============================================================================
function renderPunchList(filterStatus = "All") {
  const tbody = document.getElementById("tbl-punch-list-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const snags = MimarERP.punchListItems || [];
  let total = snags.length;
  let critical = 0, inProg = 0, closed = 0;

  snags.forEach(s => {
    if (s.severity.includes("Critical") || s.severity.includes("حرج")) critical++;
    if (s.status.includes("جاري")) inProg++;
    if (s.status.includes("مغلق")) closed++;

    if (filterStatus !== "All" && !s.status.includes(filterStatus)) return;

    const sevBadge = s.severity.includes("حرج") ? "badge-red" : (s.severity.includes("رئيسي") ? "badge-amber" : "badge-blue");
    const statusBadge = s.status.includes("مغلق") ? "badge-green" : (s.status.includes("جاري") ? "badge-amber" : "badge-blue");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:var(--teal)">${s.snag_id}</strong></td>
      <td><strong>${s.location}</strong></td>
      <td>${s.discipline}</td>
      <td>${s.desc}</td>
      <td><span class="badge ${sevBadge}">${s.severity}</span></td>
      <td>${s.contractor}</td>
      <td>${s.date_opened}</td>
      <td class="text-num">${s.due_date}</td>
      <td><span class="badge ${statusBadge}">${s.status}</span></td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="togglePunchStatus('${s.snag_id}')" title="تغيير الحالة">
          <i class="fas fa-check"></i> ${s.status.includes("مغلق") ? "إعادة فتح" : "اعتماد إغلاق"}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl("punch-kpi-total", total);
  setEl("punch-kpi-critical", critical);
  setEl("punch-kpi-progress", inProg);
  setEl("punch-kpi-closed", closed);
  setEl("punch-kpi-badge-pending", (total - closed) + " ملاحظات قيد المتابعة");
}

function filterPunchList(status) {
  renderPunchList(status);
}

function togglePunchStatus(snagId) {
  const snags = MimarERP.punchListItems || [];
  const item = snags.find(s => s.snag_id === snagId);
  if (!item) return;

  if (item.status.includes("مغلق")) {
    item.status = "جاري المعالجة (In Progress)";
    showToast(`تمت إعادة فتح الملاحظة: ${snagId}`);
  } else {
    item.status = "مغلق ومعتمد (Closed)";
    showToast(`تم اعتماد إغلاق الملاحظة الهندسية: ${snagId}`);
  }
  renderPunchList();
}

function openAddPunchModal() {
  showToast("نموذج تسجيل ملاحظة واستلام جديد.");
}

// =============================================================================
// AI COST INTELLIGENCE & MULTI-STANDARD MATCHER
// =============================================================================
let lastAIMatchResult = null;

function openAICostModal() {
  const m = document.getElementById("modal-ai-cost");
  if (m) m.style.display = "flex";
  const inp = document.getElementById("ai-cost-query");
  if (inp) {
    inp.focus();
    inp.value = "";
  }
  const res = document.getElementById("ai-match-result");
  if (res) res.style.display = "none";
}

function closeAICostModal() {
  const m = document.getElementById("modal-ai-cost");
  if (m) m.style.display = "none";
}

function executeAICostMatch() {
  const query = (document.getElementById("ai-cost-query")?.value || "").trim().toLowerCase();
  if (!query) {
    showToast("يرجى كتابة وصف البند أولاً للبحث والمطابقة.");
    return;
  }

  const kb = MimarERP.costIntelligenceKB || [];
  let match = kb.find(k => query.includes(k.keyword) || k.item.toLowerCase().includes(query));

  if (!match) {
    // Default fallback to first matched or general item
    match = kb[0];
  }
  lastAIMatchResult = match;

  const resBox = document.getElementById("ai-match-result");
  if (resBox) resBox.style.display = "block";

  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl("ai-res-item", match.item);
  setEl("ai-res-csi", match.csi);
  setEl("ai-res-din", match.din);
  setEl("ai-res-uni", match.uniclass);
  setEl("ai-res-sbc", match.sbc);
  setEl("ai-res-rate", match.bench_rate.toFixed(2));
  setEl("ai-res-unit", match.unit);
  setEl("ai-res-mat", (match.bench_rate - match.labor - match.eqp).toFixed(2) + " ر.س");
  setEl("ai-res-lab", match.labor.toFixed(2) + " ر.س");
  setEl("ai-res-eqp", match.eqp.toFixed(2) + " ر.س");

  showToast(`تمت المطابقة بنجاح طبقاً لمعايير CSI (${match.csi}) و DIN 276`);
}

function applyAIMatchToBOQ() {
  if (!lastAIMatchResult) return;
  closeAICostModal();
  showToast(`تم بنجاح إدراج البند (${lastAIMatchResult.item}) في جدول الكميات BOQ.`);
  switchView('wbs-boq');
}

function generateRateAnalysisFromAI() {
  if (!lastAIMatchResult) return;
  closeAICostModal();
  showToast(`تم إنشاء وتحديث التحليل السعري للبند: ${lastAIMatchResult.item}`);
  switchView('rate-analysis');
}

// =============================================================================
// SUBMITTALS & SHOP DRAWINGS APPROVALS CONTROLLER (OpenConstructionERP oe_submittals)
// =============================================================================
function renderSubmittals() {
  const tbody = document.getElementById("tbl-submittals-body");
  if (!tbody) return;

  const filterDisc = document.getElementById("filter-sub-discipline")?.value || "All";
  const filterStat = document.getElementById("filter-sub-status")?.value || "All";

  const submittals = MimarERP.submittalsList || [];
  let filtered = submittals;
  if (filterDisc !== "All") filtered = filtered.filter(s => s.discipline.includes(filterDisc));
  if (filterStat !== "All") filtered = filtered.filter(s => s.action_code.includes(filterStat) || s.status.includes(filterStat));

  tbody.innerHTML = filtered.map(s => {
    let codeBadge = `<span class="badge badge-green">${s.action_code} - معتمد</span>`;
    if (s.action_code.includes("B")) codeBadge = `<span class="badge badge-amber">${s.action_code} - معتمد بملاحظات</span>`;
    if (s.action_code.includes("C") || s.action_code.includes("D")) codeBadge = `<span class="badge badge-red">${s.action_code} - مرفوض</span>`;

    return `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td><strong>${s.title}</strong></td>
        <td><span class="badge badge-blue">${s.type}</span></td>
        <td>${s.discipline}</td>
        <td>${s.subcontractor}</td>
        <td><span class="badge badge-purple">${s.revision}</span></td>
        <td>${codeBadge}</td>
        <td>${s.consultant}</td>
        <td style="max-width:260px; font-size:11px; color:#475569;">${s.notes}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="cycleSubmittalCode('${s.id}')" title="تغيير كود الاعتماد"><i class="fas fa-stamp"></i> اعتماد</button>
        </td>
      </tr>
    `;
  }).join("");

  // Update KPIs
  const total = submittals.length;
  const codeA = submittals.filter(s => s.action_code.includes("A")).length;
  const codeB = submittals.filter(s => s.action_code.includes("B")).length;
  const rejected = submittals.filter(s => s.action_code.includes("C") || s.action_code.includes("D")).length;

  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl("sub-kpi-total", total);
  setEl("sub-kpi-code-a", codeA);
  setEl("sub-kpi-code-b", codeB);
  setEl("sub-kpi-rejected", rejected);
}

function filterSubmittals() {
  renderSubmittals();
}

function cycleSubmittalCode(subId) {
  const submittals = MimarERP.submittalsList || [];
  const s = submittals.find(x => x.id === subId);
  if (!s) return;

  if (s.action_code === "Code A") {
    s.action_code = "Code B";
    s.action_label = "معتمد مع ملاحظات (Approved as Noted)";
    s.status = "معتمد بملاحظات";
  } else if (s.action_code === "Code B") {
    s.action_code = "Code C";
    s.action_label = "مرفوض للإعادة (Revise & Resubmit)";
    s.status = "مرفوض للإعادة";
  } else {
    s.action_code = "Code A";
    s.action_label = "معتمد دون ملاحظات (Approved)";
    s.status = "معتمد";
  }
  showToast(`تم تحديث حالة الاعتماد الهندسي لـ ${subId} إلى: ${s.action_code}`);
  renderSubmittals();
}

function openAddSubmittalModal() {
  const m = document.getElementById("modal-add-submittal");
  if (m) m.style.display = "flex";
}

function closeAddSubmittalModal() {
  const m = document.getElementById("modal-add-submittal");
  if (m) m.style.display = "none";
}

function saveNewSubmittal(e) {
  e.preventDefault();
  const title = document.getElementById("new-sub-title")?.value || "";
  const type = document.getElementById("new-sub-type")?.value || "Shop Drawings";
  const disc = document.getElementById("new-sub-disc")?.value || "إنشائي";
  const subcon = document.getElementById("new-sub-subcon")?.value || "";
  const consultant = document.getElementById("new-sub-consultant")?.value || "المكتب الاستشاري";
  const notes = document.getElementById("new-sub-notes")?.value || "قيد التدقيق الفني";

  const submittals = MimarERP.submittalsList || [];
  const newId = `SUB-2026-00${submittals.length + 1}`;
  submittals.unshift({
    id: newId,
    title: title,
    type: type,
    discipline: disc,
    subcontractor: subcon,
    revision: "Rev 0",
    action_code: "Code A",
    action_label: "معتمد دون ملاحظات (Approved)",
    submitted_date: new Date().toISOString().split("T")[0],
    review_date: new Date().toISOString().split("T")[0],
    consultant: consultant,
    status: "معتمد",
    notes: notes
  });

  closeAddSubmittalModal();
  showToast(`تم بنجاح تسجيل وإرسال الاعتماد الهندسي: ${newId}`);
  renderSubmittals();
}

// =============================================================================
// BAR BENDING SCHEDULE (BBS) CONTROLLER (OpenConstructionERP oe_rebar_schedule)
// =============================================================================
function renderRebarBBS() {
  const tbody = document.getElementById("tbl-rebar-bbs-body");
  if (!tbody) return;

  const items = MimarERP.rebarBBSItems || [];
  let totalNetKg = 0;
  let totalScrapKg = 0;
  let totalBarsCount = 0;

  tbody.innerHTML = items.map(b => {
    // Formula check: unit weight = D^2 / 162
    const calcUnitWeight = Number(((b.diameter * b.diameter) / 162).toFixed(3));
    const totalMeters = Number((b.cut_length * b.total_bars).toFixed(2));
    const totalNetWeight = Number((totalMeters * calcUnitWeight).toFixed(2));
    const scrapKg = Number((totalNetWeight * (b.scrap_allowance_pct / 100)).toFixed(2));

    totalNetKg += totalNetWeight;
    totalScrapKg += scrapKg;
    totalBarsCount += b.total_bars;

    return `
      <tr>
        <td><strong>${b.member}</strong></td>
        <td><span class="badge badge-purple">${b.bar_mark}</span></td>
        <td><strong>${b.shape_code}</strong></td>
        <td><span class="badge badge-blue">Ø${b.diameter} مم</span></td>
        <td class="text-num">${b.num_elements}</td>
        <td class="text-num">${b.bars_per_element}</td>
        <td class="text-num"><strong>${b.cut_length.toFixed(2)} م</strong></td>
        <td class="text-num">${totalMeters.toFixed(1)} م</td>
        <td class="text-num" style="color:var(--muted);">${calcUnitWeight.toFixed(3)}</td>
        <td class="text-num" style="font-weight:800; color:var(--green);">${totalNetWeight.toLocaleString('en-US', {minimumFractionDigits:2})} كجم</td>
        <td class="text-num"><span class="badge badge-amber">${b.scrap_allowance_pct.toFixed(1)}%</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="showToast('تم فحص تفصيلة السيخ ${b.bar_mark}')"><i class="fas fa-eye"></i></button>
        </td>
      </tr>
    `;
  }).join("");

  // Update BBS KPIs
  const netTon = (totalNetKg / 1000).toFixed(2);
  const scrapTon = (totalScrapKg / 1000).toFixed(2);
  const grossTon = ((totalNetKg + totalScrapKg) / 1000).toFixed(2);

  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl("bbs-kpi-net-ton", netTon);
  setEl("bbs-kpi-scrap-ton", scrapTon);
  setEl("bbs-kpi-gross-ton", grossTon);
  setEl("bbs-kpi-total-bars", totalBarsCount);

  calculateQuickRebar();
}

function calculateQuickRebar() {
  const dia = parseFloat(document.getElementById("calc-rebar-dia")?.value || 16);
  const len = parseFloat(document.getElementById("calc-rebar-len")?.value || 4.5);
  const count = parseFloat(document.getElementById("calc-rebar-count")?.value || 50);
  const scrap = parseFloat(document.getElementById("calc-rebar-scrap")?.value || 4.0);
  const tonPrice = parseFloat(document.getElementById("calc-rebar-ton-price")?.value || 2850);

  const unitWeight = (dia * dia) / 162;
  const totalLen = len * count;
  const netWeight = totalLen * unitWeight;
  const grossWeight = netWeight * (1 + scrap / 100);
  const cost = (grossWeight / 1000) * tonPrice;

  const resEl = document.getElementById("calc-rebar-result");
  if (resEl) {
    resEl.textContent = `${grossWeight.toFixed(2)} كجم (${(grossWeight/1000).toFixed(3)} طن) · ${cost.toLocaleString('en-US', {maximumFractionDigits:0})} ر.س`;
  }
}

function exportBBSReport() {
  const items = MimarERP.rebarBBSItems || [];
  let csv = "\uFEFFالعنصر الإنشائي,كود السيخ,شكل التفريد,القطر مم,عدد العناصر,الأسياخ لكل عنصر,إجمالي الأسياخ,طول التقطيع م,إجمالي الطول م,وزن المتر كجم,الوزن الإجمالي كجم,نسبة الهالك %\n";
  items.forEach(b => {
    const uw = ((b.diameter * b.diameter) / 162).toFixed(3);
    const totLen = (b.cut_length * b.total_bars).toFixed(2);
    const totKg = (totLen * uw).toFixed(2);
    csv += `"${b.member}","${b.bar_mark}","${b.shape_code}",${b.diameter},${b.num_elements},${b.bars_per_element},${b.total_bars},${b.cut_length},${totLen},${uw},${totKg},${b.scrap_allowance_pct}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Mimar_Rebar_BBS_Schedule_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("تم تصدير جدول تفريد حديد التسليح BBS إلى ملف Excel / CSV بترميز UTF-8 بنجاح.");
}

// =============================================================================
// RFI (REQUEST FOR INFORMATION) CONTROLLER (OpenConstructionERP oe_rfi)
// =============================================================================
function renderRFIList(filterStatus) {
  const tbody = document.getElementById("tbl-rfi-list-body");
  if (!tbody) return;

  const stat = filterStatus || document.getElementById("filter-rfi-status")?.value || "All";
  const rfiList = MimarERP.rfiList || [];

  let filtered = rfiList;
  if (stat !== "All") {
    filtered = filtered.filter(r => r.status.includes(stat));
  }

  tbody.innerHTML = filtered.map(r => {
    let statBadge = `<span class="badge badge-green">${r.status}</span>`;
    if (r.status.includes("مراجعة") || r.status.includes("Review")) statBadge = `<span class="badge badge-amber">${r.status}</span>`;
    if (r.status.includes("مفتوح") || r.status.includes("Open")) statBadge = `<span class="badge badge-purple">${r.status}</span>`;

    let prioBadge = `<span class="badge badge-blue">${r.priority}</span>`;
    if (r.priority.includes("عاجل") || r.priority.includes("Urgent")) prioBadge = `<span class="badge badge-red">${r.priority}</span>`;

    return `
      <tr>
        <td><strong>${r.id}</strong></td>
        <td><strong>${r.subject}</strong></td>
        <td><span class="badge badge-teal">${r.discipline}</span></td>
        <td style="font-size:11px; color:#475569;">${r.drawing_ref}</td>
        <td style="max-width:240px; font-size:11px; line-height:1.4;">${r.question}</td>
        <td style="max-width:240px; font-size:11px; color:#065F46; background:#F0FDF4; padding:6px; border-radius:4px; line-height:1.4;">${r.response}</td>
        <td style="font-weight:700; color:var(--red);">${r.cost_impact}</td>
        <td><span class="badge badge-amber">${r.schedule_impact}</span></td>
        <td>${prioBadge}</td>
        <td>${statBadge}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="answerRFI('${r.id}')" title="تحديث رد الاستشاري"><i class="fas fa-reply"></i> الرد</button>
        </td>
      </tr>
    `;
  }).join("");

  // Update RFI KPIs
  const total = rfiList.length;
  const closed = rfiList.filter(r => r.status.includes("مغلق") || r.status.includes("Closed")).length;
  const pending = rfiList.filter(r => r.status.includes("مراجعة") || r.status.includes("Review")).length;
  const impact = rfiList.filter(r => !r.cost_impact.includes("لا يوجد") || !r.schedule_impact.includes("0")).length;

  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl("rfi-kpi-total", total);
  setEl("rfi-kpi-closed", closed);
  setEl("rfi-kpi-pending", pending);
  setEl("rfi-kpi-impact", impact);
}

function filterRFIList(status) {
  renderRFIList(status);
}

function answerRFI(rfiId) {
  const rfiList = MimarERP.rfiList || [];
  const r = rfiList.find(x => x.id === rfiId);
  if (!r) return;

  const currentAns = r.response || "";
  const newAns = prompt(`إدخال أو تعديل رد الاستشاري المعتمد للاستفسار [${rfiId}]:`, currentAns);
  if (newAns !== null && newAns.trim() !== "") {
    r.response = newAns.trim();
    r.status = "مغلق ومعتمد (Closed)";
    r.answered_date = new Date().toISOString().split("T")[0];
    showToast(`تم اعتماد وتحديث رد الاستشاري لـ ${rfiId} وإغلاق الاستفسار.`);
    renderRFIList();
  }
}

function openAddRFIModal() {
  const m = document.getElementById("modal-add-rfi");
  if (m) m.style.display = "flex";
}

function closeAddRFIModal() {
  const m = document.getElementById("modal-add-rfi");
  if (m) m.style.display = "none";
}

function saveNewRFI(e) {
  e.preventDefault();
  const subject = document.getElementById("new-rfi-subject")?.value || "";
  const disc = document.getElementById("new-rfi-disc")?.value || "إنشائي";
  const prio = document.getElementById("new-rfi-prio")?.value || "متوسط";
  const dwg = document.getElementById("new-rfi-dwg")?.value || "-";
  const spec = document.getElementById("new-rfi-spec")?.value || "-";
  const q = document.getElementById("new-rfi-q")?.value || "";
  const cost = document.getElementById("new-rfi-cost")?.value || "لا يوجد";
  const sched = document.getElementById("new-rfi-sched")?.value || "0 يوم";

  const rfiList = MimarERP.rfiList || [];
  const newId = `RFI-2026-00${rfiList.length + 1}`;
  rfiList.unshift({
    id: newId,
    subject: subject,
    discipline: disc,
    drawing_ref: dwg,
    spec_ref: spec,
    question: q,
    response: "قيد المراجعة والدراسة من قبل مهندس الإشراف والاستشاري.",
    status: "قيد المراجعة (Under Review)",
    priority: prio,
    cost_impact: cost,
    schedule_impact: sched,
    submitted_date: new Date().toISOString().split("T")[0],
    answered_date: "قيد الانتظار",
    assigned_to: "المكتب الاستشاري"
  });

  closeAddRFIModal();
  showToast(`تم تسجيل الاستفسار الهندسي الجديد: ${newId} وإخطار الاستشاري.`);
  renderRFIList();
}

// =============================================================================
// MIDDLE EAST & GCC REGIONAL SETTINGS CONTROLLER (OpenConstructionERP oe_middle_east_pack)
// =============================================================================
function openMEPackModal() {
  const m = document.getElementById("modal-me-pack");
  if (m) m.style.display = "flex";

  const cfg = MimarERP.middleEastRegionalConfig || {};
  const countrySel = document.getElementById("me-select-country");
  if (countrySel && cfg.current_country) countrySel.value = cfg.current_country;

  const ramadanChk = document.getElementById("me-ramadan-toggle");
  if (ramadanChk) {
    ramadanChk.checked = !!cfg.ramadan_mode;
    toggleRamadanHours(cfg.ramadan_mode);
  }
}

function closeMEPackModal() {
  const m = document.getElementById("modal-me-pack");
  if (m) m.style.display = "none";
}

function onRegionalCountryChange(countryCode) {
  const cfg = MimarERP.middleEastRegionalConfig || {};
  const c = (cfg.supported_countries || []).find(x => x.code === countryCode);
  if (!c) return;

  cfg.current_country = c.code;
  cfg.currency = c.currency;
  cfg.vat_rate = c.vat / 100;
  cfg.country_name = c.name;
}

function toggleRamadanHours(enabled) {
  const lbl = document.getElementById("me-ramadan-lbl");
  if (lbl) {
    lbl.textContent = enabled ? "مفعل (6 ساعات يومياً بموجب القانون)" : "معطل (8 ساعات عمل اعتيادية)";
    lbl.style.color = enabled ? "var(--teal)" : "var(--muted)";
  }
  const cfg = MimarERP.middleEastRegionalConfig || {};
  cfg.ramadan_mode = enabled;
}

function saveRegionalSettings() {
  const cfg = MimarERP.middleEastRegionalConfig || {};
  const countryCode = document.getElementById("me-select-country")?.value || "SA";
  onRegionalCountryChange(countryCode);

  const c = (cfg.supported_countries || []).find(x => x.code === countryCode);
  if (c) {
    const topFlag = document.getElementById("topbar-me-flag");
    const topTitle = document.getElementById("topbar-me-title");
    if (topFlag) topFlag.textContent = c.flag;
    if (topTitle) topTitle.textContent = `${c.name.split(" ")[0]} (${c.vat_label})`;
  }

  closeMEPackModal();
  showToast(`تم تفعيل وتطبيق حزمة: ${cfg.country_name} بنظام ضريبة ${cfg.vat_rate * 100}% وساعات العمل المعتمدة بنجاح.`);
}

// Hook into existing switchView for 3D BIM, Site Diary, Punch List, Submittals, BBS, and RFI rendering
const _origSwitchView = window.switchView;
window.switchView = function(viewId) {
  if (typeof _origSwitchView === 'function') _origSwitchView(viewId);
  if (viewId === 'bim-viewer') {
    setTimeout(initBIMViewer, 50);
  } else if (viewId === 'site-diary') {
    renderSiteDiary();
  } else if (viewId === 'punch-list') {
    renderPunchList();
  } else if (viewId === 'submittals') {
    renderSubmittals();
  } else if (viewId === 'rebar') {
    renderRebarBBS();
  } else if (viewId === 'rfi') {
    renderRFIList();
  }
};
