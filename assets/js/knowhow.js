// ── PROGRESS BAR ──
window.addEventListener('scroll', () => {
  const docH   = document.documentElement.scrollHeight - window.innerHeight;
  const pct    = docH > 0 ? (window.scrollY / docH) * 100 : 0;
  document.getElementById('progressBar').style.width = pct + '%';
});

// ── ACTIVE TOC HIGHLIGHTING ──
const tocLinks = document.querySelectorAll('.toc-item');
const sections = document.querySelectorAll('.section, .hero');
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      tocLinks.forEach(l => l.classList.remove('active'));
      const link = document.querySelector('.toc-item[href="#' + e.target.id + '"]');
      if (link) link.classList.add('active');
    }
  });
}, { rootMargin: '-20% 0px -70% 0px' });
sections.forEach(s => obs.observe(s));

// ── SEARCH ──
function searchGuide(query) {
  if (!query || query.trim().length < 2) {
    clearHighlights();
    return;
  }
  clearHighlights();
  const q = query.trim();
  const re = new RegExp('(' + escapeRegex(q) + ')', 'gi');
  const main = document.getElementById('mainContent');
  highlightText(main, re);

  // scroll to first match
  const first = document.querySelector('mark');
  if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(node, re) {
  if (node.nodeType === 3) {
    const m = node.nodeValue.match(re);
    if (m) {
      const frag = document.createDocumentFragment();
      let last = 0, match;
      re.lastIndex = 0;
      const text = node.nodeValue;
      while ((match = re.exec(text)) !== null) {
        frag.appendChild(document.createTextNode(text.slice(last, match.index)));
        const mark = document.createElement('mark');
        mark.textContent = match[0];
        frag.appendChild(mark);
        last = re.lastIndex;
      }
      frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    }
  } else if (
    node.nodeType === 1 &&
    node.nodeName !== 'SCRIPT' &&
    node.nodeName !== 'STYLE' &&
    node.nodeName !== 'INPUT'
  ) {
    for (let child of Array.from(node.childNodes)) {
      highlightText(child, re);
    }
  }
}

function clearHighlights() {
  document.querySelectorAll('mark').forEach(m => {
    m.replaceWith(m.textContent);
  });
}
