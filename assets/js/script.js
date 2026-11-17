'use strict';

/* Small helpers */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function safeStorage(action, key, value) {
  try {
    if (action === 'get') return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch (e) { return null; }
}

function toast(message, ms = 3000) {
  const region = $('#toastRegion');
  if (!region) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  region.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/* Page loader */
window.addEventListener('load', () => {
  const loader = $('#pageLoader');
  if (loader) setTimeout(() => loader.classList.add('done'), 300);
});

/* Theme toggle (remembers the choice, otherwise follows the system) */
const root = document.documentElement;
const themeBtn = $('#themeToggle');
const savedTheme = safeStorage('get', 'theme');
const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;

function applyTheme(theme) {
  root.dataset.theme = theme;
  if (themeBtn) themeBtn.setAttribute('aria-pressed', String(theme === 'light'));
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'light' ? '#ededed' : '#161616';
}

applyTheme(savedTheme || (systemLight ? 'light' : 'dark'));

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    safeStorage('set', 'theme', next);
  });
}

/* Sidebar (mobile) */
const sidebar = $('[data-sidebar]');
const sidebarBtn = $('[data-sidebar-btn]');

if (sidebarBtn && sidebar) {
  sidebarBtn.addEventListener('click', () => {
    const open = sidebar.classList.toggle('active');
    sidebarBtn.setAttribute('aria-expanded', String(open));
  });
}

/* Page navigation */
const navLinks = $$('[data-nav-link]');
const pages = $$('[data-page]');

function showPage(name, { updateHash = true, scroll = true } = {}) {
  const exists = pages.some(p => p.dataset.page === name);
  if (!exists) name = 'about';

  pages.forEach(p => p.classList.toggle('active', p.dataset.page === name));
  navLinks.forEach(l => {
    const active = l.dataset.navLink === name;
    l.classList.toggle('active', active);
    l.setAttribute('aria-selected', String(active));
  });

  if (updateHash) history.replaceState(null, '', '#' + name.replace(/\s+/g, '-'));
  if (scroll) window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });

  animateSkills();
  runCounters();
  observeReveals();
}

navLinks.forEach(link => link.addEventListener('click', () => showPage(link.dataset.navLink)));

/* Links that jump to another tab (e.g. project cards) */
$$('[data-goto]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    showPage(a.dataset.goto);
    const target = $(a.getAttribute('href'));
    if (target && target.id && !target.matches('[data-page]')) {
      setTimeout(() => target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }), 80);
    }
  });
});

/* Keep placeholder "#" links from jumping to the top */
$$('a[href="#"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));

function pageFromHash() {
  const hash = decodeURIComponent(location.hash.replace('#', '')).replace(/-/g, ' ').toLowerCase();
  return pages.some(p => p.dataset.page === hash) ? hash : 'about';
}

window.addEventListener('hashchange', () => showPage(pageFromHash(), { updateHash: false }));

/* Typed tagline */
const typedEl = $('#typedText');
if (typedEl && !reduceMotion) {
  let phrases = [];
  try { phrases = JSON.parse(typedEl.dataset.typed || '[]'); } catch (e) { phrases = []; }
  const decode = s => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; };
  phrases = phrases.map(decode);

  if (phrases.length) {
    let p = 0, c = 0, deleting = false;
    const tick = () => {
      const word = phrases[p];
      typedEl.textContent = word.slice(0, c);
      if (!deleting && c < word.length) { c++; setTimeout(tick, 70); }
      else if (!deleting) { deleting = true; setTimeout(tick, 1600); }
      else if (c > 0) { c--; setTimeout(tick, 35); }
      else { deleting = false; p = (p + 1) % phrases.length; setTimeout(tick, 300); }
    };
    tick();
  }
}

/* Skill bars animate when the CV page opens */
function animateSkills() {
  $$('.skill-progress-fill').forEach(bar => {
    if (!bar.dataset.width) bar.dataset.width = bar.style.width;
    if (bar.closest('article.active')) {
      bar.style.width = '0';
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = bar.dataset.width; }));
    }
  });
}

/* Count-up stats on the About page */
function runCounters() {
  $$('[data-count-to]').forEach(el => {
    if (!el.closest('article.active')) return;
    const target = Number(el.dataset.countTo);
    if (reduceMotion) { el.textContent = target; return; }
    const duration = 1100;
    const start = performance.now();
    const step = now => {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  });
}

/* Reveal on scroll */
let revealObserver = null;
function observeReveals() {
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
  }
  $$('article.active .info-card, article.active .service-item, article.active .timeline-item, article.active .reference-item, article.active .stat-item')
    .forEach(el => {
      if (!el.classList.contains('in-view')) {
        el.classList.add('reveal');
        revealObserver.observe(el);
      }
    });
}

/* Portfolio filter + search */
const filterItems = $$('[data-filter-item]');
const filterBtns = $$('[data-filter-btn]');
const select = $('[data-select]');
const selectItems = $$('[data-select-item]');
const selectValue = $('[data-select-value]');
const searchInput = $('[data-project-search]');
const noResults = $('[data-no-results]');

let currentCategory = 'all';

function applyFilters() {
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
  let visible = 0;

  filterItems.forEach(item => {
    const matchesCategory = currentCategory === 'all' || item.dataset.category === currentCategory;
    const haystack = (item.textContent + ' ' + (item.dataset.tags || '')).toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    const show = matchesCategory && matchesSearch;
    item.classList.toggle('active', show);
    if (show) visible++;
  });

  if (noResults) noResults.hidden = visible > 0;
}

function setCategory(label) {
  currentCategory = label.trim().toLowerCase();
  if (selectValue) selectValue.textContent = label.trim();

  filterBtns.forEach(b => b.classList.toggle('active', b.textContent.trim().toLowerCase() === currentCategory));
  selectItems.forEach(i => i.classList.toggle('active', i.textContent.trim().toLowerCase() === currentCategory));
  applyFilters();
}

filterBtns.forEach(btn => btn.addEventListener('click', () => setCategory(btn.textContent)));

if (select) {
  select.addEventListener('click', () => {
    const open = select.classList.toggle('active');
    select.setAttribute('aria-expanded', String(open));
  });
}

selectItems.forEach(item => item.addEventListener('click', () => {
  setCategory(item.textContent);
  if (select) { select.classList.remove('active'); select.setAttribute('aria-expanded', 'false'); }
}));

if (searchInput) searchInput.addEventListener('input', applyFilters);

/* Image lightbox */
const modal = $('#myModal');
const modalImg = $('#img01');
const captionText = $('#caption');
const closeBtn = modal ? $('.close', modal) : null;
const navbar = $('.navbar');
let lastFocus = null;

function openModal(src, alt) {
  if (!modal) return;
  lastFocus = document.activeElement;
  modalImg.src = src;
  modalImg.alt = alt || '';
  captionText.textContent = alt || '';
  modal.hidden = false;
  modal.classList.add('open');
  if (navbar) navbar.classList.add('hidden');
  document.body.style.overflow = 'hidden';
  if (closeBtn) closeBtn.focus();
}

function closeModal() {
  if (!modal || modal.hidden) return;
  modal.classList.remove('open');
  modal.hidden = true;
  if (navbar) navbar.classList.remove('hidden');
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}

$$('.hobbies-banner-box img, img.zoomable').forEach(img => {
  img.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    openModal(img.currentSrc || img.src, img.alt);
  });
});

if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    if (select) { select.classList.remove('active'); select.setAttribute('aria-expanded', 'false'); }
  }
});

/* Contact form */
const form = $('#contactForm');

if (form) {
  const inputs = $$('[data-form-input]', form);
  const submitBtn = $('[data-form-btn]', form);
  const formMessage = $('#formMessage');
  const messageField = $('#message');
  const charCount = $('#charCount');

  const setStatus = (text, type) => {
    formMessage.textContent = text;
    formMessage.className = 'form-message ' + (type || '');
  };

  const isValid = () => inputs.every(i => i.checkValidity() && i.value.trim() !== '');

  inputs.forEach(input => {
    input.addEventListener('input', () => {
      submitBtn.disabled = !isValid();
      if (input === messageField && charCount) charCount.textContent = input.value.length;
    });
    input.addEventListener('blur', () => input.classList.add('touched'));
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    // Honeypot: real people never fill this in
    const trap = $('#website', form);
    if (trap && trap.value) return;

    if (!isValid()) {
      inputs.forEach(i => i.classList.add('touched'));
      setStatus('Please fill in all fields correctly.', 'error');
      return;
    }

    submitBtn.disabled = true;
    setStatus('Sending message...', 'info');

    try {
      // No Content-Type header: the browser sets the correct multipart boundary for FormData.
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        setStatus('Thank you! Your message has been sent.', 'success');
        toast('Message sent. I will get back to you soon.');
        form.reset();
        inputs.forEach(i => i.classList.remove('touched'));
        if (charCount) charCount.textContent = '0';
      } else {
        let detail = 'Unknown error';
        try {
          const data = await response.json();
          detail = (data.errors && data.errors.map(e => e.message).join(', ')) || data.error || detail;
        } catch (e) { /* ignore */ }
        setStatus('Oops! ' + detail, 'error');
        submitBtn.disabled = false;
      }
    } catch (error) {
      console.error('Submission error:', error);
      setStatus('There was a problem sending your message. Please try again or email me directly.', 'error');
      submitBtn.disabled = false;
    }
  });
}

/* Scroll progress + back to top */
const progress = $('#scrollProgress');
const toTop = $('#backToTop');

function onScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  const pct = height > 0 ? Math.min(100, Math.round((scrollTop / height) * 100)) : 0;
  if (progress) {
    progress.style.width = pct + '%';
    progress.setAttribute('aria-valuenow', String(pct));
  }
  if (toTop) toTop.hidden = scrollTop < 400;
}

window.addEventListener('scroll', onScroll, { passive: true });
if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

/* Start */
document.addEventListener('DOMContentLoaded', () => {
  showPage(pageFromHash(), { updateHash: false, scroll: false });
  onScroll();
});