/** Zeigt eine kurze Benachrichtigung unten rechts. type: 'info' | 'success' | 'error' */
export function toast(msg, type = 'info') {
  const border = type === 'success' ? 'border-teal-200' : type === 'error' ? 'border-red-200' : 'border-gray-200';
  const dot    = type === 'success' ? 'bg-teal-500'     : type === 'error' ? 'bg-red-500'     : 'bg-gray-400';
  const safe   = String(msg ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const el = document.createElement('div');
  el.className = `toast-anim pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-white border ${border} rounded-xl text-sm text-gray-800 shadow-lg`;
  el.innerHTML = `<span class="w-2 h-2 rounded-full flex-shrink-0 ${dot}"></span>${safe}`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
