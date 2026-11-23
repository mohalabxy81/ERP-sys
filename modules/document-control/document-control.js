function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}
// Tab Switching Logic
    function switchDocTab(tabId, btn) {
      document.querySelectorAll('.tab-section-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.module-tab-btn').forEach(el => el.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      btn.classList.add('active');
    }

    // Modal Controls with Focus Trap
    function openUploadModal() {
      const modal = document.getElementById('uploadDocModal');
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
      const firstInput = document.getElementById('newDocNo');
      if (firstInput) firstInput.focus();
    }

    function closeUploadModal() {
      const modal = document.getElementById('uploadDocModal');
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }

    // Keyboard ESC Listener
    window.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeUploadModal();
      }
    });

    // File selection simulation
    function handleFileSelected(event) {
      const file = event.target.files[0];
      if (file) {
        document.getElementById('dropzoneText').innerHTML = `
          <span style="color:#059669;"><i class="fas fa-file-circle-check"></i> تم اختيار: ${escapeHtml(file.name)} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
        `;
      }
    }

    // Handle Upload Document Form Submission
    function handleDocUpload(event) {
      event.preventDefault();
      const docNo = document.getElementById('newDocNo').value;
      const title = document.getElementById('newDocTitle').value;
      const disc = document.getElementById('newDocDiscipline').value;
      const rev = document.getElementById('newDocRev').value;
      const transmittal = document.getElementById('newDocTransmittal').value || 'TR-OUT-2026-099';
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');

      let discClass = 'disc-arch';
      if (disc === 'إنشائي') discClass = 'disc-str';
      else if (disc === 'كهروميكانيك') discClass = 'disc-mep';
      else if (disc === 'سلامة') discClass = 'disc-hse';
      else if (disc === 'جودة') discClass = 'disc-qa';

      const table = document.getElementById('documentRegisterTable').getElementsByTagName('tbody')[0];
      const newRow = table.insertRow(0);

      newRow.innerHTML = `
        <td class="text-num" style="font-weight:800; color:var(--navy);">${escapeHtml(docNo)}</td>
        <td>${escapeHtml(title)}</td>
        <td><span class="disc-badge ${discClass}">${disc}</span></td>
        <td class="text-num" style="font-weight:700;">${rev}</td>
        <td><span class="badge status-review"><i class="fas fa-clock"></i> قيد المراجعة</span></td>
        <td class="text-num">${escapeHtml(transmittal)}</td>
        <td>${dateStr}</td>
        <td style="text-align:center;">
          <button class="btn btn-outline btn-sm" onclick="previewDoc('${docNo}')" title="معاينة"><i class="fas fa-eye"></i></button>
          <button class="btn btn-outline btn-sm" onclick="downloadDoc('${docNo}')" title="تنزيل"><i class="fas fa-download"></i></button>
        </td>
      `;

      closeUploadModal();
      document.getElementById('uploadDocForm').reset();
      document.getElementById('dropzoneText').textContent = 'اسحب وأفلت ملفات DWG, PDF, RVT, أو IFC هنا';

      // Update total counter
      const totalEl = document.getElementById('countTotal');
      if (totalEl) {
        totalEl.textContent = parseInt(totalEl.textContent, 10) + 1;
      }

      showToast(`تم تسجيل الوثيقة ${docNo} بنجاح في السجل الرئيسي.`);
    }

    // Sort Table columns
    let sortDirection = {};
    function sortTable(columnIndex) {
      const table = document.getElementById("documentRegisterTable");
      let switching = true;
      let shouldSwitch;
      let dir = sortDirection[columnIndex] === "asc" ? "desc" : "asc";
      sortDirection[columnIndex] = dir;

      while (switching) {
        switching = false;
        const rows = table.rows;
        for (let i = 1; i < (rows.length - 1); i++) {
          shouldSwitch = false;
          const x = rows[i].getElementsByTagName("TD")[columnIndex];
          const y = rows[i + 1].getElementsByTagName("TD")[columnIndex];

          const xVal = x.textContent.trim().toLowerCase();
          const yVal = y.textContent.trim().toLowerCase();

          if (dir === "asc") {
            if (xVal > yVal) {
              shouldSwitch = true;
              break;
            }
          } else if (dir === "desc") {
            if (xVal < yVal) {
              shouldSwitch = true;
              break;
            }
          }
        }
        if (shouldSwitch) {
          rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
          switching = true;
        }
      }
      showToast(`تم فرز الجدول حسب العمود (${dir === 'asc' ? 'تصاعدي' : 'تنازلي'})`);
    }

    // Search & Filter Document Register
    function filterDocRegister() {
      const searchVal = document.getElementById('docSearchInput').value.toLowerCase();
      const discVal = document.getElementById('docDisciplineFilter').value;
      const statusVal = document.getElementById('docStatusFilter').value;
      const badge = document.getElementById('docFilteredCount');
      const countVal = document.getElementById('docCountVal');

      const rows = document.getElementById('documentRegisterTable').querySelectorAll('tbody tr');
      let visibleCount = 0;

      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const matchesSearch = !searchVal || text.includes(searchVal);
        const matchesDisc = !discVal || text.includes(discVal);
        const matchesStatus = !statusVal || text.includes(statusVal);

        if (matchesSearch && matchesDisc && matchesStatus) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });

      if (searchVal || discVal || statusVal) {
        badge.style.display = 'inline-flex';
        countVal.textContent = visibleCount;
      } else {
        badge.style.display = 'none';
      }
    }

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

    // Actions & Handlers
    function previewDoc(id) {
      showToast(`جاري فتح عارض المخططات ثلاثي الأبعاد للملف: ${id}`);
    }

    function downloadDoc(id) {
      showToast(`جاري تنزيل أحدث إصدار معتمد للملف: ${id}`);
    }

    function viewRFIDetail(rfiNo) {
      showToast(`فتح بطاقة الاستفسار الفني: ${rfiNo}`);
    }

    function viewTransmittalDetail(trNo) {
      showToast(`فتح نموذج خطاب الإرسال الرسمي: ${trNo}`);
    }

    function openNewRFI() {
      showToast('فتح نافذة تقديم استفسار فني جديد (New RFI Request)...');
    }

    function openNewTransmittal() {
      showToast('فتح نموذج صياغة خطاب إرسال رسمي (New Transmittal)...');
    }

    function exportRegisterExcel() {
      showToast('جاري تصدير السجل العام للمخططات والوثائق بصيغة Excel...');
    }

    function onDocProjectChange() {
      const proj = document.getElementById('docProjectSelector').value;
      showToast(`تم تبديل سياق الوثائق إلى: ${proj}`);
    }
