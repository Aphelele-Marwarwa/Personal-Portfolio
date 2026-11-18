'use strict';

/* Shared helpers */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function safeStorage(action, key, value) {
  try {
    if (action === 'get') return localStorage.getItem(key);
    localStorage.setItem(key, value);
    return true;
  } catch {
    return null;
  }
}

function toast(message, duration = 3000) {
  const region = $('#toastRegion');
  if (!region) return;
  const item = document.createElement('div');
  item.className = 'toast';
  item.setAttribute('role', 'status');
  item.textContent = message;
  region.appendChild(item);
  window.setTimeout(() => item.remove(), duration);
}

const root = document.documentElement;

/* Page loader */
window.addEventListener('load', () => {
  const loader = $('#pageLoader');
  if (loader) window.setTimeout(() => loader.classList.add('done'), 300);
});

/* Theme */
const themeBtn = $('#themeToggle');
const savedTheme = safeStorage('get', 'theme');
const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;

function applyTheme(theme) {
  const safeTheme = theme === 'light' ? 'light' : 'dark';
  root.dataset.theme = safeTheme;
  if (themeBtn) themeBtn.setAttribute('aria-pressed', String(safeTheme === 'light'));
  const themeColor = $('meta[name="theme-color"]');
  if (themeColor) themeColor.content = safeTheme === 'light' ? '#ededed' : '#161616';
}

applyTheme(savedTheme || (systemLight ? 'light' : 'dark'));

themeBtn?.addEventListener('click', () => {
  const nextTheme = root.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(nextTheme);
  safeStorage('set', 'theme', nextTheme);
});

/* Sidebar */
const sidebar = $('[data-sidebar]');
const sidebarBtn = $('[data-sidebar-btn]');

function closeSidebar() {
  if (!sidebar || !sidebarBtn) return;
  sidebar.classList.remove('active');
  sidebarBtn.setAttribute('aria-expanded', 'false');
}

sidebarBtn?.addEventListener('click', () => {
  if (!sidebar) return;
  const isOpen = sidebar.classList.toggle('active');
  sidebarBtn.setAttribute('aria-expanded', String(isOpen));
});

/* Tab navigation */
const navLinks = $$('[data-nav-link]');
const pages = $$('[data-page]');

function showPage(name, { updateHash = true, scroll = true } = {}) {
  const requestedPage = String(name || '').toLowerCase();
  const pageExists = pages.some(page => page.dataset.page === requestedPage);
  const activeName = pageExists ? requestedPage : 'about';

  pages.forEach(page => {
    const active = page.dataset.page === activeName;
    page.classList.toggle('active', active);
    page.setAttribute('aria-hidden', String(!active));
  });

  navLinks.forEach(link => {
    const active = link.dataset.navLink === activeName;
    link.classList.toggle('active', active);
    link.setAttribute('aria-selected', String(active));
    link.tabIndex = active ? 0 : -1;
  });

  if (updateHash) {
    const hash = activeName.replace(/\s+/g, '-');
    if (window.location.hash !== `#${hash}`) history.replaceState(null, '', `#${hash}`);
  }

  closeSidebar();
  if (scroll) window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });

  animateSkills();
  runCounters();
  observeReveals();
}

navLinks.forEach(link => {
  link.addEventListener('click', () => showPage(link.dataset.navLink));
});

/* Arrow-key support for tab-style navigation */
const tabList = $('.navbar-list[role="tablist"]');
tabList?.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const tabs = navLinks;
  const currentIndex = tabs.indexOf(document.activeElement);
  if (currentIndex < 0 || tabs.length === 0) return;
  event.preventDefault();

  let nextIndex = currentIndex;
  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
  if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  if (event.key === 'Home') nextIndex = 0;
  if (event.key === 'End') nextIndex = tabs.length - 1;

  tabs[nextIndex].focus();
  showPage(tabs[nextIndex].dataset.navLink);
});

/* Links that navigate to another page and then scroll to a section */
$$('[data-goto]').forEach(link => {
  link.addEventListener('click', event => {
    const destination = link.dataset.goto;
    if (!destination) return;
    event.preventDefault();
    showPage(destination);

    const href = link.getAttribute('href');
    if (href && href.startsWith('#') && href.length > 1) {
      const target = $(href);
      if (target && !target.matches('[data-page]')) {
        window.setTimeout(() => target.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start'
        }), 100);
      }
    }
  });
});

/* Keep intentional placeholder links from jumping to the top. */
$$('a[href="#"]').forEach(link => {
  link.addEventListener('click', event => event.preventDefault());
});

function pageFromHash() {
  let hash = '';
  try {
    hash = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    hash = window.location.hash.slice(1);
  }
  const pageName = hash.replace(/-/g, ' ').toLowerCase();
  return pages.some(page => page.dataset.page === pageName) ? pageName : 'about';
}

window.addEventListener('hashchange', () => {
  showPage(pageFromHash(), { updateHash: false });
});

/* Typed tagline */
const typedEl = $('#typedText');
if (typedEl && !reduceMotion) {
  let phrases = [];
  try {
    phrases = JSON.parse(typedEl.dataset.typed || '[]');
  } catch {
    phrases = [];
  }

  if (Array.isArray(phrases) && phrases.length) {
    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;

    const typeNext = () => {
      const phrase = String(phrases[phraseIndex]);
      typedEl.textContent = phrase.slice(0, characterIndex);

      if (!deleting && characterIndex < phrase.length) {
        characterIndex++;
        window.setTimeout(typeNext, 70);
      } else if (!deleting) {
        deleting = true;
        window.setTimeout(typeNext, 1600);
      } else if (characterIndex > 0) {
        characterIndex--;
        window.setTimeout(typeNext, 35);
      } else {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        window.setTimeout(typeNext, 300);
      }
    };
    typeNext();
  }
}

/* Skill bars */
function animateSkills() {
  $$('.skill-progress-fill').forEach(bar => {
    if (!bar.dataset.width) bar.dataset.width = bar.style.width;
    if (!bar.closest('article.active')) return;

    if (reduceMotion) {
      bar.style.width = bar.dataset.width;
      return;
    }

    bar.style.width = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bar.style.width = bar.dataset.width;
    }));
  });
}

/* About-page counters */
function runCounters() {
  $$('[data-count-to]').forEach(element => {
    if (!element.closest('article.active')) return;
    const target = Number(element.dataset.countTo);
    if (!Number.isFinite(target)) return;

    if (reduceMotion) {
      element.textContent = String(target);
      return;
    }

    const duration = 1100;
    const startTime = performance.now();
    const update = now => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(update);
    };
    element.textContent = '0';
    requestAnimationFrame(update);
  });
}

/* Reveal-on-scroll */
let revealObserver = null;
function observeReveals() {
  const revealTargets = $$('article.active .info-card, article.active .service-item, article.active .timeline-item, article.active .reference-item, article.active .stat-item');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(element => element.classList.add('in-view'));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
  }

  revealTargets.forEach(element => {
    if (element.classList.contains('in-view')) return;
    element.classList.add('reveal');
    revealObserver.observe(element);
  });
}

/* Portfolio filters and search */
const filterItems = $$('[data-filter-item]');
const filterBtns = $$('[data-filter-btn]');
const filterSelect = $('[data-select]');
const selectItems = $$('[data-select-item]');
const selectValue = $('[data-select-value]');
const searchInput = $('[data-project-search]');
const noResults = $('[data-no-results]');
let currentCategory = 'all';

function applyFilters() {
  const query = (searchInput?.value || '').trim().toLowerCase();
  let visibleCount = 0;

  filterItems.forEach(item => {
    const category = (item.dataset.category || '').toLowerCase();
    const matchesCategory = currentCategory === 'all' || category === currentCategory;
    const searchableText = `${item.textContent} ${item.dataset.tags || ''}`.toLowerCase();
    const matchesSearch = !query || searchableText.includes(query);
    const visible = matchesCategory && matchesSearch;
    item.classList.toggle('active', visible);
    item.setAttribute('aria-hidden', String(!visible));
    if (visible) visibleCount++;
  });

  if (noResults) noResults.hidden = visibleCount !== 0;
}

function closeFilterSelect() {
  if (!filterSelect) return;
  filterSelect.classList.remove('active');
  filterSelect.setAttribute('aria-expanded', 'false');
}

function setCategory(label) {
  currentCategory = String(label || 'all').trim().toLowerCase();
  if (selectValue) selectValue.textContent = label.trim();

  filterBtns.forEach(button => {
    const active = button.textContent.trim().toLowerCase() === currentCategory;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  selectItems.forEach(item => item.classList.toggle('active', item.textContent.trim().toLowerCase() === currentCategory));
  applyFilters();
}

filterBtns.forEach(button => {
  button.addEventListener('click', () => setCategory(button.textContent));
});

filterSelect?.addEventListener('click', () => {
  const open = filterSelect.classList.toggle('active');
  filterSelect.setAttribute('aria-expanded', String(open));
});

selectItems.forEach(item => {
  item.addEventListener('click', () => {
    setCategory(item.textContent);
    closeFilterSelect();
  });
});

searchInput?.addEventListener('input', applyFilters);

document.addEventListener('click', event => {
  if (filterSelect && !event.target.closest('.filter-select-box')) closeFilterSelect();
});

/* Image lightbox with keyboard focus management */
const modal = $('#myModal');
const modalImg = $('#img01');
const captionText = $('#caption');
const closeBtn = modal ? $('.close', modal) : null;
const navbar = $('.navbar');
let lastFocusedElement = null;

function openModal(source, altText = '') {
  if (!modal || !modalImg || !captionText || !source) return;

  lastFocusedElement = document.activeElement;
  modalImg.src = source;
  modalImg.alt = altText;
  captionText.textContent = altText;
  modal.hidden = false;
  modal.classList.add('open');
  modal.setAttribute('aria-label', altText ? `Image preview: ${altText}` : 'Image preview');
  if (navbar) navbar.classList.add('hidden');
  document.body.style.overflow = 'hidden';
  closeBtn?.focus();
}

function closeModal() {
  if (!modal || modal.hidden) return;
  modal.classList.remove('open');
  modal.hidden = true;
  modalImg?.removeAttribute('src');
  if (navbar) navbar.classList.remove('hidden');
  document.body.style.overflow = '';
  lastFocusedElement?.focus?.();
}

function trapModalFocus(event) {
  if (!modal || modal.hidden || event.key !== 'Tab') return;
  const focusable = $$('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', modal)
    .filter(element => element.getClientRects().length > 0);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

$$('.hobbies-banner-box img, img.zoomable').forEach(image => {
  image.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openModal(image.currentSrc || image.src, image.alt);
  });
  image.setAttribute('tabindex', '0');
  image.setAttribute('role', 'button');
  image.setAttribute('aria-label', image.alt ? `Enlarge image: ${image.alt}` : 'Enlarge image');
  image.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openModal(image.currentSrc || image.src, image.alt);
  });
});

closeBtn?.addEventListener('click', closeModal);
modal?.addEventListener('click', event => {
  if (event.target === modal) closeModal();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeModal();
    closeFilterSelect();
  }
  trapModalFocus(event);
});

/* Contact form */
const form = $('#contactForm');
if (form) {
  const inputs = $$('[data-form-input]', form);
  const submitBtn = $('[data-form-btn]', form);
  const formMessage = $('#formMessage');
  const messageField = $('#message', form);
  const charCount = $('#charCount');
  const honeypot = $('#website', form);

  const setStatus = (message, type = '') => {
    if (!formMessage) return;
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`.trim();
  };

  const isValid = () => inputs.length > 0 && inputs.every(input =>
    input.checkValidity() && (input.tagName === 'SELECT' || input.value.trim() !== '')
  );

  const updateFormState = () => {
    if (submitBtn) submitBtn.disabled = !isValid();
    if (messageField && charCount) charCount.textContent = String(messageField.value.length);
  };

  inputs.forEach(input => {
    input.addEventListener('input', updateFormState);
    input.addEventListener('change', updateFormState);
    input.addEventListener('blur', () => input.classList.add('touched'));
  });

  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      inputs.forEach(input => input.classList.remove('touched'));
      updateFormState();
    }, 0);
  });

  updateFormState();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (honeypot?.value) return;

    if (!isValid()) {
      inputs.forEach(input => input.classList.add('touched'));
      setStatus('Please complete the required fields correctly.', 'error');
      updateFormState();
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    setStatus('Sending message…', 'info');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        let detail = `Request failed (${response.status}). Please try again.`;
        try {
          const data = await response.json();
          if (data?.errors?.length) detail = data.errors.map(error => error.message).join(', ');
          else if (data?.error) detail = data.error;
        } catch {
          // Keep the useful HTTP status message when the response is not JSON.
        }
        throw new Error(detail);
      }

      setStatus('Thank you! Your message has been sent.', 'success');
      toast('Message sent. I will get back to you soon.');
      form.reset();
      if (charCount) charCount.textContent = '0';
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setStatus(error.message || 'There was a problem sending your message. Please try again or email me directly.', 'error');
      updateFormState();
    }
  });
}

/* Scroll progress and back-to-top */
const progress = $('#scrollProgress');
const toTop = $('#backToTop');

function onScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percentage = scrollableHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollableHeight) * 100)) : 0;

  if (progress) {
    progress.style.width = `${percentage}%`;
    progress.setAttribute('aria-valuenow', String(percentage));
  }
  if (toTop) toTop.hidden = scrollTop < 400;
}

window.addEventListener('scroll', onScroll, { passive: true });
toTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
});

/* Initialize after the document has been parsed. */
function initializePortfolio() {
  showPage(pageFromHash(), { updateHash: false, scroll: false });
  onScroll();
  applyFilters();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePortfolio, { once: true });
} else {
  initializePortfolio();
}
