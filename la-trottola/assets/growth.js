(() => {
  const configured = window.LA_TROTTOLA_GROWTH?.newsletterSignupUrl;
  if (!configured) return;
  let url;
  try { url = new URL(configured); } catch { return; }
  if (url.protocol !== 'https:') return;
  document.querySelectorAll('[data-newsletter]').forEach(section => {
    section.querySelector('[data-newsletter-link]').href = url.href;
    section.hidden = false;
  });
})();
