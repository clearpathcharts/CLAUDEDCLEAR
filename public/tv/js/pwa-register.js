(function registerCPMSServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  // Do not register a service worker. /tv/sw.js is a kill-switch for the
  // old cache-first worker. Keep the install-prompt listeners below.

  let deferredPrompt;
  const installBtn = document.getElementById('pwa-install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) {
      installBtn.style.display = 'flex';
      
      installBtn.addEventListener('click', (event) => {
        event.preventDefault();
        installBtn.style.display = 'none';
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choice) => {
          if (choice.outcome === 'accepted') {
            console.log('User confirmed CPMS deployment to screen.');
          }
          deferredPrompt = null;
        });
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.style.display = 'none';
    deferredPrompt = null;
    console.log('CPMS App Installed Successfully.');
  });
})();
