/**
 * PWA Install Prompt, Network Connectivity Monitor & Service Worker Update Lifecycle
 * Displays native app installation banner, offline/online network status indicators,
 * and seamless background update prompts.
 */

let deferredPrompt = null;

export function initPwaAndNetworkMonitor() {
  if (typeof window === "undefined") return;

  // 1. PWA Install Prompt Listener
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    renderInstallBanner();
  });

  // 2. Offline / Online Connectivity Listeners
  window.addEventListener("offline", () => {
    showNetworkBanner(false);
  });

  window.addEventListener("online", () => {
    showNetworkBanner(true);
  });

  // Check initial network state
  if (!navigator.onLine) {
    showNetworkBanner(false);
  }

  // 3. Service Worker Update Notification
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            renderUpdateBanner(registration);
          }
        });
      });
    });

    // Reload page when the new service worker takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
}

function showNetworkBanner(isOnline) {
  let banner = document.getElementById("network-status-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "network-status-banner";
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      padding: 8px 16px;
      text-align: center;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    `;
    document.body.prepend(banner);
  }

  if (!isOnline) {
    banner.style.background = "#ba1a1a";
    banner.style.color = "#ffffff";
    banner.innerHTML = `
      <span class="material-symbols-outlined" style="font-size:18px;">wifi_off</span>
      <span>Mode Offline: Anda tidak terhubung ke internet. Fitur lokal tetap dapat digunakan.</span>
      <a href="${window.location.pathname.includes('/pages/') ? 'offline.html' : 'pages/offline.html'}" style="color:#ffdad6; text-decoration:underline; margin-left:8px;">Pelajari</a>
    `;
  } else {
    banner.style.background = "#006a6a";
    banner.style.color = "#ffffff";
    banner.innerHTML = `
      <span class="material-symbols-outlined" style="font-size:18px;">wifi</span>
      <span>Koneksi online pulih. Data lowongan siap disinkronkan.</span>
    `;
    setTimeout(() => {
      if (banner && banner.parentNode) banner.remove();
    }, 3500);
  }
}

function renderUpdateBanner(registration) {
  if (document.getElementById("pwa-update-pill")) return;

  const pill = document.createElement("div");
  pill.id = "pwa-update-pill";
  pill.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 9999;
    background: #006a6a;
    color: #ffffff;
    padding: 10px 18px;
    border-radius: 28px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    animation: fadeInDown 0.3s ease;
  `;

  pill.innerHTML = `
    <span class="material-symbols-outlined" style="font-size:20px;">autorenew</span>
    <span>Versi baru tersedia!</span>
    <span style="background:rgba(255,255,255,0.25); padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700;">Perbarui</span>
  `;

  pill.addEventListener("click", () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    pill.remove();
  });

  document.body.appendChild(pill);
}

function renderInstallBanner() {
  if (document.getElementById("pwa-install-pill") || !deferredPrompt) return;

  const pill = document.createElement("div");
  pill.id = "pwa-install-pill";
  pill.style.cssText = `
    position: fixed;
    bottom: 90px;
    left: 20px;
    z-index: 999;
    background: var(--md-sys-color-primary, #006a6a);
    color: var(--md-sys-color-on-primary, #ffffff);
    padding: 8px 16px;
    border-radius: 24px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
  `;

  pill.innerHTML = `
    <span class="material-symbols-outlined" style="font-size:18px;">install_mobile</span>
    <span>Install Aplikasi</span>
  `;

  pill.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    pill.remove();
  });

  document.body.appendChild(pill);
}

// Auto-run when DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPwaAndNetworkMonitor);
  } else {
    initPwaAndNetworkMonitor();
  }
}
