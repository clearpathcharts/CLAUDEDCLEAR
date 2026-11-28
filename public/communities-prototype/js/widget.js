/*
 * WHATEVER GROUP THERE IN - draggable widget behavior (vanilla JS, pointer events).
 * Concept derived from "Facebook Share (Messenger draggable)" by zagzter
 * (https://codepen.io/zagzter/pen/ggWmBE), MIT. See licenses/.
 * The original used jQuery UI; this version needs no libraries.
 */
(function () {
    const root = document.querySelector('[data-wgti]');
    const closer = document.querySelector('.wgti-closer');
    if (!root || !closer) return;

    const pill = root.querySelector('.wgti-pill');
    const cta = root.querySelector('[data-wgti-open-chat]');
    const MARGIN = 20;
    const DRAG_THRESHOLD = 6;

    let side = null;
    let top = 0;
    let drag = null;

    const isMobile = () => window.innerWidth < 768;
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

    function place(animate) {
        const w = root.offsetWidth;
        const h = root.offsetHeight;
        if (!animate) root.style.transition = 'none';
        top = clamp(top, MARGIN, window.innerHeight - h - MARGIN);
        const left = side === 'left' ? MARGIN : window.innerWidth - w - MARGIN;
        root.style.left = left + 'px';
        root.style.top = top + 'px';
        root.classList.toggle('side-left', side === 'left');
        root.classList.toggle('side-right', side === 'right');
        root.classList.toggle('panel-below', top + h / 2 < window.innerHeight / 2);
        if (!animate) {
            void root.offsetWidth;
            root.style.transition = '';
        }
    }

    function initialPosition() {
        const h = root.offsetHeight;
        if (isMobile()) {
            side = 'left';
            top = window.innerHeight - h - 100;
        } else {
            side = 'right';
            top = Math.round(window.innerHeight * 0.58);
        }
        place(false);
    }

    function setOpen(open) {
        root.classList.toggle('is-open', open);
        pill.setAttribute('aria-expanded', String(open));
    }

    function overlaps(a, b) {
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }

    pill.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        const rect = root.getBoundingClientRect();
        drag = { id: e.pointerId, startX: e.clientX, startY: e.clientY, offX: e.clientX - rect.left, offY: e.clientY - rect.top, moved: false };
        pill.setPointerCapture(e.pointerId);
    });

    pill.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.moved) {
            if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < DRAG_THRESHOLD) return;
            drag.moved = true;
            root.classList.add('is-dragging');
            closer.classList.add('is-visible');
            setOpen(false);
        }
        const w = root.offsetWidth;
        const h = root.offsetHeight;
        root.style.left = clamp(e.clientX - drag.offX, 4, window.innerWidth - w - 4) + 'px';
        root.style.top = clamp(e.clientY - drag.offY, 4, window.innerHeight - h - 4) + 'px';
        closer.classList.toggle('is-hover', overlaps(root.getBoundingClientRect(), closer.getBoundingClientRect()));
    });

    function endDrag(e) {
        if (!drag || e.pointerId !== drag.id) return;
        const { moved } = drag;
        drag = null;
        if (pill.hasPointerCapture(e.pointerId)) pill.releasePointerCapture(e.pointerId);
        if (!moved) {
            setOpen(!root.classList.contains('is-open'));
            return;
        }
        const rect = root.getBoundingClientRect();
        const hide = overlaps(rect, closer.getBoundingClientRect());
        root.classList.remove('is-dragging');
        closer.classList.remove('is-visible', 'is-hover');
        if (hide) {
            root.classList.add('removed');
            return;
        }
        side = rect.left + rect.width / 2 < window.innerWidth / 2 ? 'left' : 'right';
        top = rect.top;
        place(true);
    }
    pill.addEventListener('pointerup', endDrag);
    pill.addEventListener('pointercancel', endDrag);

    pill.addEventListener('click', (e) => {
        if (e.detail === 0) setOpen(!root.classList.contains('is-open'));
    });

    closer.addEventListener('click', () => root.classList.add('removed'));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setOpen(false);
    });

    document.addEventListener('pointerdown', (e) => {
        if (root.classList.contains('is-open') && !root.contains(e.target)) setOpen(false);
    });

    if (cta) {
        cta.addEventListener('click', () => {
            const href = root.dataset.chatHref;
            if (href) {
                window.location.href = href;
                return;
            }
            setOpen(false);
            window.dispatchEvent(new CustomEvent('clearpath:open-chat', { detail: { id: 'wgti' } }));
        });
    }

    function show() {
        root.classList.remove('removed');
        initialPosition();
    }
    window.WGTI = { show, hide: () => root.classList.add('removed') };

    const showLink = document.getElementById('show-widget-link');
    if (showLink) {
        showLink.addEventListener('click', (e) => {
            e.preventDefault();
            show();
        });
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => place(false), 80);
    });

    initialPosition();
})();
