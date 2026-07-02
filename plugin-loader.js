// 核心框架：负责加载插件、管理收藏、构建界面

const STORAGE_KEY = 'toolbox_starred_plugins';

function getStarredPlugins() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveStarredPlugins(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function toggleStar(pluginId) {
  const starred = getStarredPlugins();
  const index = starred.indexOf(pluginId);
  if (index === -1) starred.push(pluginId);
  else starred.splice(index, 1);
  saveStarredPlugins(starred);
  return starred;
}

const pluginRegistry = [];
let currentPlugin = null;

function registerPlugin(plugin) {
  pluginRegistry.push(plugin);
}

function showToast(msg, duration = 2500) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, duration + 400);
}

function sortPluginsByStar(plugins) {
  const starred = getStarredPlugins();
  const starredPlugins = [];
  const normalPlugins = [];
  plugins.forEach(p => {
    if (starred.includes(p.id)) starredPlugins.push(p);
    else normalPlugins.push(p);
  });
  return [...starredPlugins, ...normalPlugins];
}

function buildUI() {
  const navContainer = document.getElementById('navTabs');
  const panelsContainer = document.getElementById('panelsContainer');
  navContainer.innerHTML = '';
  panelsContainer.innerHTML = '';

  const sortedPlugins = sortPluginsByStar(pluginRegistry);
  const starred = getStarredPlugins();

  sortedPlugins.forEach((plugin) => {
    const isStarred = starred.includes(plugin.id);

    const btn = document.createElement('button');
    btn.className = 'nav-tab' + (isStarred ? ' starred' : '');
    btn.dataset.pluginId = plugin.id;
    btn.innerHTML = `
      <span class="star-btn" data-star="${plugin.id}">${isStarred ? '⭐' : '☆'}</span>
      ${plugin.icon} ${plugin.name}
      ${plugin.badge ? `<span class="badge">${plugin.badge}</span>` : ''}
    `;

    btn.addEventListener('click', (e) => {
      if (e.target.classList.contains('star-btn') || e.target.closest('.star-btn')) return;
      switchToPlugin(plugin.id);
    });

    const starBtn = btn.querySelector('.star-btn');
    starBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newStarred = toggleStar(plugin.id);
      buildUI();
      if (currentPlugin && currentPlugin.id === plugin.id) {
        switchToPlugin(plugin.id);
      }
      showToast(newStarred.includes(plugin.id) ? '⭐ 已置顶' : '已取消置顶');
    });

    navContainer.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.id = `panel-${plugin.id}`;
    panelsContainer.appendChild(panel);
  });

  if (sortedPlugins.length > 0) {
    switchToPlugin(sortedPlugins[0].id);
  }
}

function switchToPlugin(pluginId) {
  if (currentPlugin && currentPlugin.destroy) {
    currentPlugin.destroy();
  }

  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const plugin = pluginRegistry.find(p => p.id === pluginId);
  if (!plugin) return;

  const panel = document.getElementById(`panel-${pluginId}`);
  panel.classList.add('active');
  const tabBtn = document.querySelector(`.nav-tab[data-plugin-id="${pluginId}"]`);
  if (tabBtn) tabBtn.classList.add('active');

  panel.innerHTML = '';
  plugin.render(panel);
  currentPlugin = plugin;
}

function loadPlugins() {
  const loadPromises = PLUGIN_LIST.map(item => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = item.script;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`加载失败: ${item.script}`));
      document.head.appendChild(script);
    });
  });

  Promise.all(loadPromises)
    .then(() => buildUI())
    .catch(err => {
      showToast('⚠️ 部分插件加载失败');
      buildUI();
    });
}

window.addEventListener('DOMContentLoaded', loadPlugins);
