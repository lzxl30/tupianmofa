const STORAGE_KEY = 'toolbox_starred_plugins';

function getStarred() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveStarred(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
function toggleStar(pluginId) {
  const starred = getStarred();
  const idx = starred.indexOf(pluginId);
  if (idx === -1) starred.push(pluginId);
  else starred.splice(idx, 1);
  saveStarred(starred);
  return starred;
}

const pluginRegistry = [];
let currentPlugin = null;

function registerPlugin(plugin) { pluginRegistry.push(plugin); }

function showToast(msg, duration = 2500) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration + 400);
}

function sortPluginsByStar(plugins) {
  const starred = getStarred();
  const a = [], b = [];
  plugins.forEach(p => (starred.includes(p.id) ? a : b).push(p));
  return [...a, ...b];
}

function buildUI() {
  const navContainer = document.getElementById('navTabs');
  const panelsContainer = document.getElementById('panelsContainer');
  navContainer.innerHTML = '';
  panelsContainer.innerHTML = '';

  const sorted = sortPluginsByStar(pluginRegistry);
  const starred = getStarred();

  sorted.forEach(plugin => {
    const isStarred = starred.includes(plugin.id);

    const btn = document.createElement('button');
    btn.className = 'nav-tab' + (isStarred ? ' starred' : '');
    btn.dataset.pluginId = plugin.id;
    btn.innerHTML = `
      <span class="star-btn">${isStarred ? '⭐' : '☆'}</span>
      ${plugin.icon} ${plugin.name}
      ${plugin.badge ? `<span class="badge">${plugin.badge}</span>` : ''}
    `;

    btn.addEventListener('click', (e) => {
      if (e.target.classList.contains('star-btn')) return;
      switchToPlugin(plugin.id);
    });

    btn.querySelector('.star-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const newStarred = toggleStar(plugin.id);
      buildUI();
      if (currentPlugin && currentPlugin.id === plugin.id) switchToPlugin(plugin.id);
      showToast(newStarred.includes(plugin.id) ? '⭐ 已置顶' : '已取消置顶');
    });

    navContainer.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.id = `panel-${plugin.id}`;
    panelsContainer.appendChild(panel);
  });

  if (sorted.length > 0) switchToPlugin(sorted[0].id);
}

function switchToPlugin(pluginId) {
  if (currentPlugin && currentPlugin.destroy) currentPlugin.destroy();

  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const plugin = pluginRegistry.find(p => p.id === pluginId);
  if (!plugin) return;

  const panel = document.getElementById(`panel-${pluginId}`);
  panel.classList.add('active');
  const tab = document.querySelector(`.nav-tab[data-plugin-id="${pluginId}"]`);
  if (tab) tab.classList.add('active');

  panel.innerHTML = '';
  plugin.render(panel);
  currentPlugin = plugin;
}

function loadPlugins() {
  const promises = PLUGIN_LIST.map(item => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = item.script;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`加载失败: ${item.script}`));
    document.head.appendChild(script);
  }));

  Promise.all(promises)
    .then(() => buildUI())
    .catch(err => { showToast('⚠️ 部分插件加载失败'); buildUI(); });
}

window.addEventListener('DOMContentLoaded', loadPlugins);
