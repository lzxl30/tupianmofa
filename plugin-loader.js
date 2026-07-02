// ==================== 核心框架：插件加载 & 标星置顶 & 统一描述下载 ====================
const STORAGE_KEY = 'toolbox_starred_plugins';

// 收藏管理
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

// 按收藏排序
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

// 构建导航和面板
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
      toggleStar(plugin.id);
      buildUI();
      if (currentPlugin && currentPlugin.id === plugin.id) switchToPlugin(plugin.id);
      showToast(getStarredPlugins().includes(plugin.id) ? '⭐ 已置顶' : '已取消置顶');
    });
    navContainer.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.id = `panel-${plugin.id}`;
    panelsContainer.appendChild(panel);
  });

  if (sortedPlugins.length > 0) switchToPlugin(sortedPlugins[0].id);
}

// 切换插件
function switchToPlugin(pluginId) {
  if (currentPlugin && currentPlugin.destroy) currentPlugin.destroy();
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

// 加载所有插件脚本
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
    .catch(err => { console.error(err); showToast('⚠️ 部分插件加载失败'); buildUI(); });
}

window.addEventListener('DOMContentLoaded', loadPlugins);

// ==================== 统一描述下载功能 ====================

// Canvas roundRect 兼容
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
    this.beginPath();
    this.moveTo(x + r.tl, y);
    this.lineTo(x + w - r.tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    this.lineTo(x + w, y + h - r.br);
    this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    this.lineTo(x + r.bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    this.lineTo(x, y + r.tl);
    this.quadraticCurveTo(x, y, x + r.tl, y);
    this.closePath();
  };
}

/**
 * 将描述文字合成到图片左下角，返回新的 DataURL
 */
function addDescriptionToImage(imageDataUrl, description) {
  return new Promise((resolve, reject) => {
    if (!description || description.trim() === '') {
      resolve(imageDataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(14, Math.floor(img.width / 30));
      ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      const text = description.trim();
      const textWidth = ctx.measureText(text).width;
      const paddingX = fontSize * 0.6;
      const paddingY = fontSize * 0.4;
      const bgX = paddingX;
      const bgY = canvas.height - fontSize - paddingY * 2;
      const bgWidth = textWidth + paddingX * 2;
      const bgHeight = fontSize + paddingY * 2;

      // 半透明圆角背景
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.beginPath();
      ctx.roundRect(bgX, bgY, bgWidth, bgHeight, fontSize * 0.3);
      ctx.fill();

      // 白色文字
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'left';
      ctx.fillText(text, bgX + paddingX, canvas.height - paddingY);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

/**
 * 在父容器中创建统一的描述+下载UI
 * @param {HTMLElement} parentElement - 要插入的容器
 * @param {string|function} imageUrlOrGetter - 图片DataURL，或返回DataURL的函数
 * @param {string} downloadFileName - 下载文件名
 * @returns {{ descriptionInput, downloadButton }}
 */
function createDownloadUI(parentElement, imageUrlOrGetter, downloadFileName = 'image.png') {
  const descInput = document.createElement('input');
  descInput.type = 'text';
  descInput.placeholder = '添加描述（显示在图片左下角）';
  descInput.style.cssText = 'width:100%; max-width:320px; padding:8px 12px; border-radius:20px; border:1px solid var(--border); background:var(--surface2); color:var(--text); font-size:0.85rem; outline:none; margin-top:10px;';

  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'btn btn-accent';
  downloadBtn.textContent = '⬇️ 下载PNG（含描述）';
  downloadBtn.style.marginTop = '8px';

  downloadBtn.addEventListener('click', async () => {
    let imageUrl;
    if (typeof imageUrlOrGetter === 'function') {
      imageUrl = imageUrlOrGetter();
    } else {
      imageUrl = imageUrlOrGetter;
    }
    if (!imageUrl) {
      showToast('暂无图片可下载');
      return;
    }
    const desc = descInput.value;
    const finalUrl = await addDescriptionToImage(imageUrl, desc);
    const a = document.createElement('a');
    a.href = finalUrl;
    a.download = downloadFileName;
    a.click();
  });

  parentElement.appendChild(descInput);
  parentElement.appendChild(downloadBtn);

  return { descriptionInput: descInput, downloadButton: downloadBtn };
}
