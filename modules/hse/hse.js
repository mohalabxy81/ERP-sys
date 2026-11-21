// Set current datetime default for modal
    document.addEventListener('DOMContentLoaded', function() {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      const dateInput = document.getElementById('obsDateTime');
      if (dateInput) {
        dateInput.value = now.toISOString().slice(0, 16);
      }
    });

    // Chart Tooltip handling
    function showTooltip(evt, month, inc, near, hours) {
      const tooltip = document.getElementById('chartTooltip');
      const box = document.getElementById('chartBox').getBoundingClientRect();
      tooltip.style.display = 'block';
      tooltip.innerHTML = `
        <div style="font-weight:800; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:3px; margin-bottom:3px;">
          شهر ${month}
        </div>
        <div>حوادث إصابة: <strong>${inc}</strong></div>
        <div>شبه حوادث: <strong>${near}</strong></div>
        <div style="color:#7dd3fc;">ساعات آمنة: <strong>${hours}</strong></div>
      `;
      const x = evt.clientX - box.left + 10;
      const y = evt.clientY - box.top - 50;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    }

    function hideTooltip() {
      const tooltip = document.getElementById('chartTooltip');
      if (tooltip) tooltip.style.display = 'none';
    }

    // Modal Control: Observations
    function openObservationModal() {
      const modal = document.getElementById('observationModal');
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
      // Focus trap setup
      const firstInput = document.getElementById('obsType');
      if (firstInput) firstInput.focus();
    }

    function closeObservationModal() {
      const modal = document.getElementById('observationModal');
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }

    // Form Submission
    function handleObservationSubmit(event) {
      event.preventDefault();
      const type = document.getElementById('obsType').value;
      const sev = document.getElementById('obsSeverity').value;
      const loc = document.getElementById('obsLocation').value;
      const desc = document.getElementById('obsDescription').value;
      const owner = document.getElementById('obsOwner').value || 'م. فهد العتيبي';

      // Generate random incident id
      const newId = 'INC-2026-0' + Math.floor(Math.random() * 89 + 10);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');

      // Append row to Incidents table
      const table = document.getElementById('incidentsTable').getElementsByTagName('tbody')[0];
      const newRow = table.insertRow(0);

      let sevBadge = '<span class="badge badge-amber">متوسط</span>';
      if (sev === 'حرج') sevBadge = '<span class="badge badge-red"><i class="fas fa-radiation"></i> حرج</span>';
      else if (sev === 'مرتفع') sevBadge = '<span class="badge badge-red" style="background:#ffedd5; color:#c2410c;">مرتفع</span>';
      else if (sev === 'منخفض') sevBadge = '<span class="badge badge-green">منخفض</span>';

      newRow.innerHTML = `
        <td class="text-num" style="font-weight:800; color:var(--navy);">${newId}</td>
        <td>${dateStr} حديث</td>
        <td>${loc}</td>
        <td><i class="fas fa-triangle-exclamation"></i> ${type}</td>
        <td>${desc}</td>
        <td>${sevBadge}</td>
        <td><span class="badge badge-blue">قيد المراجعة</span></td>
        <td>${owner}</td>
        <td><button class="btn btn-outline btn-sm" onclick="viewIncidentDetail('${newId}')">عرض</button></td>
      `;

      closeObservationModal();
      document.getElementById('obsForm').reset();
      showToast(`تم تسجيل البلاغ ${newId} بنجاح وإرسال إشعار للمشرف`);
    }

    // Keyboard ESC listener
    window.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeObservationModal();
        closeRiskModal();
      }
    });

    // Toast Notification helper
    function showToast(message) {
      const toast = document.getElementById('toastNotification');
      const toastMsg = document.getElementById('toastMessage');
      toastMsg.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 4000);
    }

    // Filter Incidents Table
    function filterIncidentsTable() {
      const searchVal = document.getElementById('incidentSearchInput').value.toLowerCase();
      const sevVal = document.getElementById('severitySelect').value;
      const statusVal = document.getElementById('statusSelect').value;
      const filterBadge = document.getElementById('filterCountBadge');

      const rows = document.getElementById('incidentsTable').querySelectorAll('tbody tr');
      let visibleCount = 0;

      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const matchesSearch = !searchVal || text.includes(searchVal);
        const matchesSev = !sevVal || text.includes(sevVal);
        const matchesStatus = !statusVal || text.includes(statusVal);

        if (matchesSearch && matchesSev && matchesStatus) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });

      if (searchVal || sevVal || statusVal) {
        filterBadge.style.display = 'inline-flex';
        filterBadge.querySelector('span').textContent = `النتائج: ${visibleCount}`;
      } else {
        filterBadge.style.display = 'none';
      }
    }

    function resetIncidentsFilters() {
      document.getElementById('incidentSearchInput').value = '';
      document.getElementById('severitySelect').value = '';
      document.getElementById('statusSelect').value = '';
      filterIncidentsTable();
    }

    // Risk Matrix Cell Interaction
    function filterRiskLevel(lvlCode, lVal, cVal, count) {
      const modal = document.getElementById('riskDetailModal');
      const body = document.getElementById('riskModalBody');
      const title = document.getElementById('riskModalTitle');

      const lvlNames = {
        'L': 'مخاطر منخفضة (Low Risk)',
        'M': 'مخاطر متوسطة (Medium Risk)',
        'H': 'مخاطر مرتفعة (High Risk)',
        'C': 'مخاطر حرجة (Critical / Extreme)'
      };

      title.innerHTML = `<i class="fas fa-layer-group"></i> مستوى الخطر: ${lvlNames[lvlCode]} (${lVal * cVal})`;

      if (count === 0) {
        body.innerHTML = `
          <div style="text-align:center; padding:20px; color:var(--muted);">
            <i class="fas fa-clipboard-check" style="font-size:32px; color:var(--color-success); margin-bottom:10px;"></i>
            <p>لا توجد مخاطر نشطة مسجلة في هذه الخلية المحددة (احتمالية: ${lVal} × شدة: ${cVal})</p>
          </div>
        `;
      } else {
        body.innerHTML = `
          <div style="margin-bottom:12px; font-size:13px;">
            تم العثور على <strong>${count} مخاطر</strong> في تقييم (احتمالية ${lVal} × شدة ${cVal}):
          </div>
          <ul style="padding-right:20px; font-size:13px; line-height:1.8;">
            <li><strong>خطر السقوط من حواف غير محمية:</strong> مطلوب حواجز درابزين مزدوجة مع لوح قدم (Toe Board).</li>
            <li><strong>خطر تماس لوحات الكهرباء بالمياه:</strong> رفع الكابلات على حوامل وتأمين قواطع ELCB 30mA.</li>
            <li><strong>إجهاد حراري في فترات الظهيرة:</strong> توفير نقاط ترطيب واستراحات مظللة وفق تعليمات وزارة الموارد البشرية.</li>
          </ul>
        `;
      }

      modal.classList.add('show');
    }

    function closeRiskModal() {
      document.getElementById('riskDetailModal').classList.remove('show');
    }

    function resetMatrixFilter() {
      showToast('عرض جميع تصنيفات مصفوفة المخاطر');
    }

    // Incident Details action
    function viewIncidentDetail(id) {
      showToast(`جاري فتح ملف البلاغ ${id} وسجل التحقيق الميداني...`);
    }

    // PTW Actions
    function auditPTW(code) {
      showToast(`بدء التدقيق الموقعي لتصريح العمل ${code}`);
    }

    function openNewPTWModal() {
      showToast('فتح نموذج إصدار تصريح عمل جديد (PTW Issue Workflow)...');
    }

    function openEmergencyPlan() {
      showToast('فتح خريطة مسارات الإخلاء ونقاط التجمع والمستشفيات القريبة');
    }

    function exportHSEReport() {
      showToast('جاري تصدير التقرير الشهري المعتمد للسلامة بصيغة PDF...');
    }

    function exportIncidentsCSV() {
      showToast('تم تصدير سجل الحوادث والملاحظات إلى ملف Excel (CSV)');
    }

    function onProjectChange() {
      const proj = document.getElementById('projectSelector').value;
      showToast(`تم تبديل سياق العمليات إلى: ${proj}`);
    }
