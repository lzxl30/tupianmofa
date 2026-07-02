// ==================== 核心框架：插件加载 & 标星置顶 ====================
const STORAGE_KEY = 'toolbox_starred_plugins';

// 获取收藏的插件ID列表
function getStarredPlugins() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 保存收藏列表
function saveStarredPlugins(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// 切换收藏状态，返回新的收藏列表
function toggleStar(pluginId) {
  const starred = getStarredPlugins();
  const index = starred.indexOf(pluginId);
  if (index === -1) {
    starred.push(pluginId);
  } else {
    starred.splice(index, 1);
  }
  saveStarredPlugins(starred);
  return starred;
}

// 全局注册表
const pluginRegistry = [];
let currentPlugin = null;

// 插件注册函数（由各插件JS调用）
function registerPlugin(plugin) {
  pluginRegistry.push(plugin);
}

// Toast 提示
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

// 按收藏排序：收藏的在前，未收藏的在后
function sortPluginsByStar(plugins) {
  const starred = getStarredPlugins();
  const starredPlugins = [];
  const normalPlugins = [];
  plugins.forEach(p => {
    if (starred.includes(p.id)) {
      starredPlugins.push(p);
    } else {
      normalPlugins.push(p);
    }
  });
  // 收藏的内部保持原顺序（或按收藏时间排序，这里简单保持插入顺序）
  return [...starredPlugins, ...normalPlugins];
}

// 构建导航标签和面板容器
function buildUI() {
  const navContainer = document.getElementById('navTabs');
  const panelsContainer = document.getElementById('panelsContainer');
  navContainer.innerHTML = '';
  panelsContainer.innerHTML = '';

  const sortedPlugins = sortPluginsByStar(pluginRegistry);
  const starred = getStarredPlugins();

  sortedPlugins.forEach((plugin) => {
    const isStarred = starred.includes(plugin.id);

    // 导航按钮
    const btn = document.createElement('button');
    btn.className = 'nav-tab' + (isStarred ? ' starred' : '');
    btn.dataset.pluginId = plugin.id;
    btn.innerHTML = `
      <span class="star-btn" data-star="${plugin.id}">${isStarred ? '⭐' : '☆'}</span>
      ${plugin.icon} ${plugin.name}
      ${plugin.badge ? `<span class="badge">${plugin.badge}</span>` : ''}
    `;

    // 点击导航切换插件（排除星标按钮）
    btn.addEventListener('click', (e) => {
      if (e.target.classList.contains('star-btn') || e.target.closest('.star-btn')) {
        return;
      }
      switchToPlugin(plugin.id);
    });

    // 星标按钮事件
    const starBtn = btn.querySelector('.star-btn');
    starBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStar(plugin.id);
      // 重新构建UI以更新排序和图标
      buildUI();
      // 如果当前插件是被操作的插件，保持其激活状态
      if (currentPlugin && currentPlugin.id === plugin.id) {
        switchToPlugin(plugin.id);
      }
      showToast(getStarredPlugins().includes(plugin.id) ? '⭐ 已置顶' : '已取消置顶');
    });

    navContainer.appendChild(btn);

    // 面板容器
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.id = `panel-${plugin.id}`;
    panelsContainer.appendChild(panel);
  });

  // 默认激活第一个
  if (sortedPlugins.length > 0) {
    switchToPlugin(sortedPlugins[0].id);
  }
}

// 切换插件
function switchToPlugin(pluginId) {
  // 销毁旧插件
  if (currentPlugin && currentPlugin.destroy) {
    currentPlugin.destroy();
  }

  // 更新UI状态
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const plugin = pluginRegistry.find(p => p.id === pluginId);
  if (!plugin) return;

  const panel = document.getElementById(`panel-${pluginId}`);
  panel.classList.add('active');
  const tabBtn = document.querySelector(`.nav-tab[data-plugin-id="${pluginId}"]`);
  if (tabBtn) tabBtn.classList.add('active');

  // 渲染插件内容（每次切换重新渲染，插件内部自行管理状态）
  panel.innerHTML = '';
  plugin.render(panel);
  currentPlugin = plugin;
}

// 加载所有插件脚本
function loadPlugins() {
  const loadPromises = PLUGIN_LIST.map(item => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = item.script;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`加载失败: ${item.script}`));
      document.head.appendChild(script);
    });
  });

  Promise.all(loadPromises)
    .then(() => {
      // 所有插件注册完毕，构建界面
      buildUI();
    })
    .catch(err => {
      console.error(err);
      showToast('⚠️ 部分插件加载失败，请检查文件路径');
      buildUI(); // 仍然尝试构建已加载的插件
    });
}

// 页面启动
window.addEventListener('DOMContentLoaded', loadPlugins);
