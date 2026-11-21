// Live Clock Management
    function updateLiveClock() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const timeStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      const elem = document.getElementById('liveTimestamp');
      if (elem) {
        elem.innerText = timeStr;
      }
    }
    setInterval(updateLiveClock, 1000);
    updateLiveClock();

    // Modal Control
    function openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }

    // Close modal on ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
          modal.classList.remove('active');
        });
        document.body.style.overflow = '';
      }
    });

    // Close on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', function(e) {
        if (e.target === this) {
          this.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });

    // Handlers
    function handleIpcSubmit(e) {
      e.preventDefault();
      alert('تم اعتماد المستخلص المالي رقم IPC-2026-0089 بنجاح وتوجيهه إلى إدارة الحسابات للصرف.');
      closeModal('ipcModal');
    }

    function handleNcrSubmit(e) {
      e.preventDefault();
      alert('تم توثيق قرار الإدارة التنفيذية بشأن تقرير عدم المطابقة وإرسال إشعار فوري لمدير المشروع والاستشاري.');
      closeModal('ncrModal');
    }

    function handleRfiSubmit(e) {
      e.preventDefault();
      alert('تم تصعيد الاستفسار الهندسي العاجل وتخصيص تذكرة متابعة برقم RFI-EXEC-992.');
      closeModal('rfiModal');
    }

    function exportExecutiveSummary() {
      alert('جاري إعداد وتحميل موجز الأداء التنفيذي لمجلس الإدارة بصيغة PDF عالية الدقة...');
    }

    function refreshExecutiveData() {
      const btn = event.currentTarget;
      const icon = btn.querySelector('i');
      if (icon) icon.classList.add('fa-spin');
      setTimeout(() => {
        if (icon) icon.classList.remove('fa-spin');
        alert('تم تحديث كافة المؤشرات وبيانات المحفظة وربطها بقاعدة بيانات ERP اللحظية.');
      }, 700);
    }

    // Portfolio Table Search & Filter
    function filterProjectTable() {
      const input = document.getElementById('projectSearchInput').value.toLowerCase();
      const ragFilter = document.getElementById('projectRagFilter').value;
      const rows = document.querySelectorAll('#portfolioTable tbody tr');

      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const rowRag = row.getAttribute('data-rag');
        
        const matchesText = text.includes(input);
        const matchesRag = (ragFilter === 'ALL' || rowRag === ragFilter);

        if (matchesText && matchesRag) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }
