'use strict';

const GITHUB_FILE      = 'ev-vergleich/js/data.js';
const GITHUB_TOKEN_KEY = 'ev-gh-token';
const GITHUB_REPO_KEY  = 'ev-gh-repo';

function getGithubToken() { return localStorage.getItem(GITHUB_TOKEN_KEY) || ''; }
function getGithubRepo()  { return localStorage.getItem(GITHUB_REPO_KEY)  || ''; }

function setGithubToken(token) {
  if (token) localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
  else        localStorage.removeItem(GITHUB_TOKEN_KEY);
}
function setGithubRepo(repo) {
  if (repo) localStorage.setItem(GITHUB_REPO_KEY, repo.trim());
  else      localStorage.removeItem(GITHUB_REPO_KEY);
}

/**
 * Schreibt data.js ins GitHub-Repo.
 * Gibt { ok: true } oder { ok: false, error: '...' } zurück.
 */
async function githubPushDataJs(cars) {
  const token = getGithubToken();
  const repo  = getGithubRepo();
  if (!token || !repo) return { ok: false, error: 'Kein Token oder Repo konfiguriert.' };

  const clean = cars.map(({ id, geladeneEnergie, ladespeed, verbrauch, ...rest }) => rest);
  const fileContent = `// js/data.js – Auto-generiert am ${new Date().toLocaleString('de-DE')}\n// Nicht manuell bearbeiten – wird automatisch vom Admin aktualisiert.\nconst DEFAULT_CARS = ${JSON.stringify(clean, null, 2)};\n`;
  const encoded = btoa(unescape(encodeURIComponent(fileContent)));

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept:        'application/vnd.github+json',
    'Content-Type':'application/json',
  };

  try {
    // 1. Aktuelle Datei-SHA holen
    const getRes = await fetch(
      `https://api.github.com/repos/${repo}/contents/${GITHUB_FILE}`,
      { headers }
    );
    let sha = null;
    if (getRes.ok) {
      sha = (await getRes.json()).sha;
    } else if (getRes.status === 404) {
      // Datei existiert noch nicht – wird neu angelegt, sha bleibt null
    } else if (getRes.status === 401) {
      return { ok: false, error: 'Token ungültig oder abgelaufen (401).' };
    } else if (getRes.status === 403) {
      return { ok: false, error: 'Zugriff verweigert (403) – Token hat keine repo-Rechte?' };
    } else {
      const msg = await getRes.text();
      return { ok: false, error: `GitHub: ${getRes.status} – ${msg.slice(0, 120)}` };
    }

    // 2. Datei pushen
    const body = { message: `data: Update ${new Date().toLocaleString('de-DE')}`, content: encoded };
    if (sha) body.sha = sha;

    const putRes = await fetch(
      `https://api.github.com/repos/${repo}/contents/${GITHUB_FILE}`,
      { method: 'PUT', headers, body: JSON.stringify(body) }
    );

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      return { ok: false, error: err.message || `HTTP ${putRes.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || 'Netzwerkfehler' };
  }
}

// ── Token-Modal ───────────────────────────────────────────────────────────────

function openGithubModal() {
  document.getElementById('githubRepoInput').value  = getGithubRepo();
  document.getElementById('githubTokenInput').value = getGithubToken();
  document.getElementById('githubModalError').classList.add('hidden');
  const modal = document.getElementById('githubModal');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const first = getGithubRepo()
      ? document.getElementById('githubTokenInput')
      : document.getElementById('githubRepoInput');
    first?.focus();
  }, 100);
}

function closeGithubModal() {
  const modal = document.getElementById('githubModal');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

async function saveGithubToken() {
  const repo  = document.getElementById('githubRepoInput').value.trim();
  const token = document.getElementById('githubTokenInput').value.trim();
  const errEl = document.getElementById('githubModalError');
  const btn   = document.getElementById('githubSaveBtn');

  errEl.classList.add('hidden');

  if (!repo || !token) {
    errEl.textContent = 'Bitte Repository und Token ausfüllen.';
    errEl.classList.remove('hidden');
    return;
  }
  if (!/^[^/]+\/[^/]+$/.test(repo)) {
    errEl.textContent = 'Repository im Format "benutzername/reponame" angeben.';
    errEl.classList.remove('hidden');
    return;
  }

  // Speichern
  setGithubRepo(repo);
  setGithubToken(token);

  // Sofort testen
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader-circle" class="w-4 h-4 animate-spin"></i> Teste…';
  lucide.createIcons();

  const result = await githubPushDataJs(state.cars);

  btn.disabled = false;
  btn.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i> Speichern &amp; Testen';
  lucide.createIcons();

  if (result.ok) {
    closeGithubModal();
    toast('GitHub verbunden – Änderungen werden ab jetzt automatisch gepusht', 'success');
  } else {
    errEl.textContent = result.error;
    errEl.classList.remove('hidden');
  }
}
