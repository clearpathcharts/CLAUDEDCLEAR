/**
 * Injects links from CPMS TV static pages back into the ClearPath Capacitor / web shell.
 * Works in the APK WebView (https://localhost/) and in the browser.
 */
(function () {
  const LINKS = {
    terminal: '/?tab=Discovery#Discovery',
    library: '/?tab=CpmsApk#CpmsApk',
    tvHome: './index.html',
  };

  const BTN_CLASS =
    'px-3 py-1.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider transition-all border';

  function makeLink(href, label, accent) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    a.className = `${BTN_CLASS} ${accent}`;
    return a;
  }

  function inject() {
    const slot = document.getElementById('cpms-terminal-nav');
    if (!slot) return;

    const wrap = document.createElement('div');
    wrap.className = 'flex flex-wrap items-center gap-2';

    wrap.appendChild(
      makeLink(
        LINKS.terminal,
        '← CLEARPATH TERMINAL',
        'bg-[#4D00FF]/10 hover:bg-[#4D00FF]/25 text-[#00D9FF] border-[#00D9FF]/35'
      )
    );
    wrap.appendChild(
      makeLink(
        LINKS.library,
        'CPMS LIBRARY',
        'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/35'
      )
    );

    slot.appendChild(wrap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
