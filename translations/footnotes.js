(() => {
  const refs = document.querySelectorAll('.fnref');
  if (!refs.length) return;

  const popup = document.createElement('div');
  popup.className = 'footnote-popup';
  popup.id = 'footnote-popup';
  popup.setAttribute('role', 'tooltip');
  popup.hidden = true;
  document.body.append(popup);
  const compact = window.matchMedia('(max-width: 600px), (hover: none) and (pointer: coarse)');
  let activeRef = null;
  let closeTimer;
  let pinned = false;
  let restoringFocus = false;

  function hide(restoreFocus = false) {
    clearTimeout(closeTimer);
    const ref = activeRef;
    if (ref) {
      ref.removeAttribute('aria-describedby');
      ref.setAttribute('aria-expanded', 'false');
    }
    activeRef = null;
    pinned = false;
    popup.hidden = true;
    if (restoreFocus && ref) {
      restoringFocus = true;
      ref.focus({preventScroll: true});
      restoringFocus = false;
    }
  }

  function position() {
    if (!activeRef) return;
    const rect = activeRef.getBoundingClientRect();
    const margin = 12;
    const gap = 10;
    const viewport = window.visualViewport;
    const width = viewport ? viewport.width : document.documentElement.clientWidth;
    const height = viewport ? viewport.height : window.innerHeight;
    const left = viewport ? viewport.offsetLeft : 0;
    const top = viewport ? viewport.offsetTop : 0;
    popup.classList.toggle('footnote-popup-sheet', compact.matches);
    popup.style.bottom = '';
    popup.style.width = '';
    if (compact.matches) {
      popup.style.width = width + 'px';
      popup.style.maxHeight = Math.floor(height * 2 / 3) + 'px';
      popup.style.left = left + 'px';
      popup.style.top = '';
      popup.style.bottom = Math.max(0, window.innerHeight - top - height) + 'px';
      return;
    }
    if (rect.bottom < top || rect.top > top + height) {
      hide();
      return;
    }
    const below = top + height - rect.bottom - gap - margin;
    const above = rect.top - top - gap - margin;
    const openBelow = below >= Math.min(360, height * .6) || below >= above;
    popup.style.maxHeight = Math.max(0, Math.min(520, openBelow ? below : above)) + 'px';
    const box = popup.getBoundingClientRect();
    popup.style.left = Math.max(left + margin, Math.min(rect.left - 18, left + width - box.width - margin)) + 'px';
    popup.style.top = (openBelow ? rect.bottom + gap : rect.top - gap - box.height) + 'px';
  }

  function show(ref, pin = false) {
    clearTimeout(closeTimer);
    const note = document.getElementById(ref.hash.slice(1));
    if (!note) return false;
    if (activeRef === ref) {
      if (pin) {
        pinned = true;
        popup.setAttribute('role', 'dialog');
        popup.querySelector('.footnote-popup-close').hidden = false;
      }
      position();
      return true;
    }
    hide();
    const content = document.createElement('div');
    content.className = 'footnote-popup-content';
    for (const child of note.childNodes) content.append(child.cloneNode(true));
    content.querySelectorAll('.back').forEach(link => link.remove());
    content.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    const label = document.createElement('span');
    label.className = 'footnote-popup-label';
    label.id = 'footnote-popup-label';
    label.textContent = 'Примечание ' + ref.textContent.trim();
    const close = document.createElement('button');
    close.className = 'footnote-popup-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Закрыть примечание');
    close.textContent = '×';
    close.hidden = !pin;
    close.addEventListener('click', () => hide(true));
    const heading = document.createElement('div');
    heading.className = 'footnote-popup-heading';
    heading.append(label, close);
    popup.replaceChildren(heading, content);
    popup.setAttribute('role', pin ? 'dialog' : 'tooltip');
    popup.setAttribute('aria-labelledby', label.id);
    activeRef = ref;
    pinned = pin;
    popup.hidden = false;
    popup.scrollTop = 0;
    position();
    ref.setAttribute('aria-describedby', popup.id);
    ref.setAttribute('aria-expanded', 'true');
    return true;
  }

  function scheduleHide() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (pinned || (activeRef && (activeRef.matches(':hover') || document.activeElement === activeRef || popup.matches(':hover') || popup.contains(document.activeElement)))) return;
      hide();
    }, 180);
  }

  refs.forEach(ref => {
    ref.setAttribute('aria-controls', popup.id);
    ref.setAttribute('aria-expanded', 'false');
    ref.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch' && !compact.matches && !pinned) show(ref);
    });
    ref.addEventListener('pointerleave', scheduleHide);
    ref.addEventListener('focus', () => {
      if (!restoringFocus && !compact.matches && !pinned) show(ref);
    });
    ref.addEventListener('blur', scheduleHide);
    ref.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (show(ref, true)) {
        event.preventDefault();
        popup.querySelector('.footnote-popup-close').focus({preventScroll: true});
      }
    });
  });
  popup.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  popup.addEventListener('pointerleave', scheduleHide);
  popup.addEventListener('focusout', scheduleHide);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && activeRef) {
      event.preventDefault();
      hide(true);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (activeRef && !activeRef.contains(event.target) && !popup.contains(event.target)) hide();
  });
  window.addEventListener('scroll', position, {passive:true});
  window.addEventListener('resize', position);
  compact.addEventListener('change', position);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', position);
    window.visualViewport.addEventListener('scroll', position);
  }
})();
