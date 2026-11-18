(() => {
  const refs = document.querySelectorAll('.fnref');
  if (!refs.length) return;

  const popup = document.createElement('div');
  popup.className = 'footnote-popup';
  popup.id = 'footnote-popup';
  popup.setAttribute('role', 'tooltip');
  popup.hidden = true;
  document.body.append(popup);
  let activeRef = null;
  let closeTimer;

  function hide() {
    clearTimeout(closeTimer);
    if (activeRef) activeRef.removeAttribute('aria-describedby');
    activeRef = null;
    popup.hidden = true;
  }

  function position() {
    if (!activeRef) return;
    const rect = activeRef.getBoundingClientRect();
    const margin = 12;
    const gap = 10;
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    if (rect.bottom < 0 || rect.top > height) {
      hide();
      return;
    }
    const below = height - rect.bottom - gap - margin;
    const above = rect.top - gap - margin;
    const openBelow = below >= Math.min(360, height * .6) || below >= above;
    popup.style.maxHeight = Math.max(0, Math.min(520, openBelow ? below : above)) + 'px';
    const box = popup.getBoundingClientRect();
    popup.style.left = Math.max(margin, Math.min(rect.left - 18, width - box.width - margin)) + 'px';
    popup.style.top = (openBelow ? rect.bottom + gap : rect.top - gap - box.height) + 'px';
  }

  function show(ref) {
    clearTimeout(closeTimer);
    if (activeRef === ref) return;
    const note = document.getElementById(ref.hash.slice(1));
    if (!note) return;
    hide();
    const content = document.createElement('div');
    for (const child of note.childNodes) content.append(child.cloneNode(true));
    content.querySelectorAll('.back').forEach(link => link.remove());
    content.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    const label = document.createElement('span');
    label.className = 'footnote-popup-label';
    label.textContent = 'Примечание ' + ref.textContent.trim();
    popup.replaceChildren(label, content);
    activeRef = ref;
    popup.hidden = false;
    popup.scrollTop = 0;
    position();
    ref.setAttribute('aria-describedby', popup.id);
  }

  function scheduleHide() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (activeRef && (activeRef.matches(':hover') || document.activeElement === activeRef || popup.matches(':hover'))) return;
      hide();
    }, 180);
  }

  refs.forEach(ref => {
    ref.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') show(ref);
    });
    ref.addEventListener('pointerleave', scheduleHide);
    ref.addEventListener('focus', () => show(ref));
    ref.addEventListener('blur', scheduleHide);
    ref.addEventListener('click', hide);
  });
  popup.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  popup.addEventListener('pointerleave', scheduleHide);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') hide();
  });
  document.addEventListener('pointerdown', event => {
    if (activeRef && !activeRef.contains(event.target) && !popup.contains(event.target)) hide();
  });
  window.addEventListener('scroll', position, {passive:true});
  window.addEventListener('resize', position);
})();
