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
  closeAddCatalogModal();
  showToast(`تم إضافة الخامة (${itemCode} - ${desc}) بنجاح إلى كتالوج ${partner.partner_name}`);
}

function renderProjectsTable() {
  const tbody = document.querySelector("#tbl-projects-list tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  MimarERP.projects.forEach(p => {
    const comp = MimarERP.companies.find(c => c.company_id === p.company_id);
    const client = MimarERP.partners.find(bp => bp.partner_id === p.client_id);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${p.project_code}</strong></td>
      <td><strong>${p.project_name_ar}</strong></td>
      <td>${comp ? comp.company_name_ar : '-'}</td>
      <td>${client ? client.partner_name : '-'}</td>
      <td class="text-num">${p.contract_value.toLocaleString()}</td>
      <td class="text-num">${p.direct_cost_budget.toLocaleString()}</td>
      <td class="text-center">${p.contract_duration_days} يوم</td>
      <td class="text-center"><strong style="color:var(--green)">${p.physical_progress_pct}%</strong></td>
      <td><span class="badge badge-green">${p.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
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
  const container = document.getElementById("rate-analysis-container");
  if (!container) return;
  container.innerHTML = "";
  MimarERP.rateAnalysis.forEach(ra => {
    const totalComp = ra.components.reduce((acc, c) => acc + (c.cost || 0), 0);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header" style="background:#0F2B46; color:white; cursor:pointer;" onclick="this.nextElementSibling.classList.toggle('active')">
        <h3 style="color:white;"><i class="fas fa-layer-group"></i> ${ra.boq_id} - ${ra.item_name}</h3>
        <span style="font-size:14px; font-weight:800;">${totalComp.toFixed(2)} ر.س / ${ra.unit}</span>
      </div>
      <div class="card-body" style="padding:0; display:block;">
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>نوع المورد</th><th>اسم المورد والمواصفة</th><th>معدل الاستهلاك للوحدة</th>
              <th>الوحدة</th><th>سعر الأساس</th><th>الهالك %</th><th>تكلفة المكون للوحدة (ر.س)</th>
            </tr></thead>
            <tbody>
              ${ra.components.map(c => `
                <tr>
                  <td><span class="badge ${c.type==='Material'?'badge-blue':(c.type==='Labor'?'badge-green':'badge-amber')}">${c.type}</span></td>
                  <td><strong>${c.name}</strong></td>
                  <td class="text-num">${c.qty_per_unit}</td>
                  <td class="text-center">${c.unit}</td>
                  <td class="text-num">${c.rate.toFixed(2)}</td>
                  <td class="text-num">${c.waste_pct}%</td>
                  <td class="text-num" style="font-weight:700;">${c.cost.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
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
  tbody.innerHTML = `
    <tr>
      <td class="text-num">INV-TX-101</td><td><span class="badge badge-green">استلام (GRN)</span></td>
      <td>مستودع المشروع الميداني</td><td>أسمنت بورتلاندي عادي 50 كجم</td>
      <td class="text-num">B-2026-03</td><td class="text-num">1,000</td><td class="text-num">-</td>
      <td class="text-num">16.50</td><td>WBS-09.1 اللياسة</td><td class="text-num">2026-03-05</td>
    </tr>
    <tr>
      <td class="text-num">INV-TX-102</td><td><span class="badge badge-amber">صرف تشغيل (Issue)</span></td>
      <td>مستودع المشروع الميداني</td><td>أسمنت بورتلاندي عادي 50 كجم</td>
      <td class="text-num">B-2026-03</td><td class="text-num">-</td><td class="text-num">450</td>
      <td class="text-num">16.50</td><td>WBS-09.1.1 لياسة الحوائط</td><td class="text-num">2026-03-12</td>
    </tr>
  `;
}

function renderSubcontractsTable() {
  const tbody = document.querySelector("#tbl-subcontracts tbody");
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td class="text-num"><strong>SUB-2026-01</strong></td>
      <td>شركة رواد العزل المتطورة (Waterseal)</td>
      <td>عزل الأسطح بولي يوريثان والحمامات</td>
      <td class="text-num">7,890.00</td><td class="text-num">0.00</td><td class="text-num">7,890.00</td>
      <td class="text-num">7,890.00</td><td class="text-num">789.00</td><td class="text-num">7,101.00</td>
      <td><span class="badge badge-green">منجز 100%</span></td>
    </tr>
    <tr>
      <td class="text-num"><strong>SUB-2026-02</strong></td>
      <td>مصنع البراك للألمنيوم والواجهات</td>
      <td>أبواب ونوافذ ألمنيوم معزول وزجاج مزدوج</td>
      <td class="text-num">11,568.00</td><td class="text-num">0.00</td><td class="text-num">9,250.00</td>
      <td class="text-num">9,250.00</td><td class="text-num">925.00</td><td class="text-num">8,325.00</td>
      <td><span class="badge badge-blue">جاري التنفيذ 80%</span></td>
    </tr>
  `;
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
  if (repType === "rep-cvr") {
    container.innerHTML = `
      <div class="card-header"><h3>تقرير التكلفة والقيمة والمصالحة الشهرية (Monthly Cost Value Reconciliation - CVR)</h3></div>
      <div class="card-body">
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>حزمة الأعمال</th><th>قيمة العقد المعتمد</th><th>التكلفة المباشرة المقدرة</th>
              <th>القيمة المعتمدة بالمستخلصات</th><th>التكلفة الفعلية المحققة (AC)</th>
              <th>الربح المحقق دفترياً</th><th>هامش الربحية %</th>
            </tr></thead>
            <tbody>
              <tr>
                <td>WBS-09 التشطيبات المعمارية</td><td class="text-num">125,850.00</td><td class="text-num">84,320.00</td>
                <td class="text-num">78,400.00</td><td class="text-num">51,200.00</td>
                <td class="text-num" style="color:var(--green)">+27,200.00</td><td class="text-center">34.7%</td>
              </tr>
              <tr>
                <td>WBS-07 العوازل المائية والحرارية</td><td class="text-num">29,750.00</td><td class="text-num">19,930.00</td>
                <td class="text-num">29,750.00</td><td class="text-num">19,930.00</td>
                <td class="text-num" style="color:var(--green)">+9,820.00</td><td class="text-center">33.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `<div class="card-body"><p style="color:var(--muted)">جاري إعداد محرك التقرير المحدد وحساب المعادلات التحليلية...</p></div>`;
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
