import { adminMode, setAdminMode } from './state.js';
import { ADMIN_PASSWORD } from './config.js';
import { toast } from './toast.js';
import { renderDuplicatePanel } from './duplicates.js';
import { refresh } from './ui.js';

/** Synchronisiert alle Admin-UI-Elemente mit dem aktuellen adminMode. */
export function updateAdminUI() {
  const adminBar = document.getElementById('adminBar');
  if (adminBar) {
    if (adminMode) {
      adminBar.classList.remove('hidden');
      document.body.style.paddingTop = '100px'; // 56px Header + 44px Admin-Bar
    } else {
      adminBar.classList.add('hidden');
      document.body.style.paddingTop = '56px';
    }
  }

  document.querySelectorAll('[data-admin-only], .admin-element').forEach(el => {
    if (el.id === 'adminBar') return;
    el.classList.toggle('hidden', !adminMode);
  });

  const btn = document.getElementById('adminBtn');
  if (!btn) return;
  if (adminMode) {
    btn.innerHTML = `<i data-lucide="lock-open" class="w-4 h-4"></i><span class="hidden sm:inline">Admin</span>`;
    btn.className = 'h-8 px-3 flex items-center gap-1.5 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-300 rounded-lg hover:bg-violet-100 transition-colors';
    btn.title = 'Admin-Modus aktiv – klicken zum Abmelden';
  } else {
    btn.innerHTML = `<i data-lucide="lock" class="w-4 h-4"></i><span class="hidden sm:inline">Admin</span>`;
    btn.className = 'h-8 px-3 flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:text-gray-900 hover:border-gray-300 transition-colors';
    btn.title = 'Als Admin anmelden';
  }
  lucide.createIcons();
  renderDuplicatePanel();
}

export function openAdminLogin() {
  const modal = document.getElementById('adminLoginModal');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('adminPasswordInput')?.focus(), 100);
}

export function closeAdminLogin() {
  const modal = document.getElementById('adminLoginModal');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.getElementById('adminPasswordInput').value = '';
  document.getElementById('adminLoginError').classList.add('hidden');
}

export function submitAdminLogin() {
  const pw = document.getElementById('adminPasswordInput').value;
  if (pw === ADMIN_PASSWORD) {
    setAdminMode(true);
    sessionStorage.setItem('ev-admin', '1');
    closeAdminLogin();
    updateAdminUI();
    refresh();
    toast('Admin-Modus aktiviert', 'success');
  } else {
    document.getElementById('adminLoginError').classList.remove('hidden');
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('adminPasswordInput').focus();
  }
}

export function logoutAdmin() {
  setAdminMode(false);
  sessionStorage.removeItem('ev-admin');
  updateAdminUI();
  refresh();
  toast('Admin-Modus beendet');
}
