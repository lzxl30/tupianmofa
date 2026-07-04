// ==================== 图片混淆插件 ====================
// 基于空间填充曲线（Gilbert curve）的像素混淆/解混淆

// ---- Gilbert 2D 曲线生成（原始算法） ----
function gilbert2d(width, height) {
  const coordinates = [];
  if (width >= height) {
    generate2d(0, 0, width, 0, 0, height, coordinates);
  } else {
    generate2d(0, 0, 0, height, width, 0, coordinates);
  }
  return coordinates;

  function generate2d(x, y, ax, ay, bx, by, coordinates) {
    const w = Math.abs(ax + ay);
    const h = Math.abs(bx + by);
    const dax = Math.sign(ax), day = Math.sign(ay);
    const dbx = Math.sign(bx), dby = Math.sign(by);

    if (h === 1) {
      for (let i = 0; i < w; i++) {
        coordinates.push([x, y]);
        x += dax; y += day;
      }
      return;
    }
    if (w === 1) {
      for (let i = 0; i < h; i++) {
        coordinates.push([x, y]);
        x += dbx; y += dby;
      }
      return;
    }

    let ax2 = Math.floor(ax / 2), ay2 = Math.floor(ay / 2);
    let bx2 = Math.floor(bx / 2), by2 = Math.floor(by / 2);
    const w2 = Math.abs(ax2 + ay2);
    const h2 = Math.abs(bx2 + by2);

    if (2 * w > 3 * h) {
      if ((w2 % 2) && (w > 2)) {
        ax2 += dax; ay2 += day;
      }
      generate2d(x, y, ax2, ay2, bx, by, coordinates);
      generate2d(x + ax2, y + ay2, ax - ax2, ay - ay2, bx, by, coordinates);
    } else {
      if ((h2 % 2) && (h > 2)) {
        bx2 += dbx; by2 += dby;
      }
      generate2d(x, y, bx2, by2, ax2, ay2, coordinates);
      generate2d(x + bx2, y + by2, ax, ay, bx - bx2, by - by2, coordinates);
      generate2d(
        x + (ax - dax) + (bx2 - dbx),
        y + (ay - day) + (by2 - dby),
        -bx2, -by2,
        -(ax - ax2), -(ay - ay2),
        coordinates
      );
    }
  }
}

// ---- 插件注册 ----
registerPlugin({
  id: 'image-scramble',
  name: '图片混淆',
  icon: '🌀',
  badge: '新',
  render(container) {
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:16px;">
        <h2 style="margin:0;">🌀 图片混淆</h2>
        <p style="color:var(--text2); font-size:0.9rem; max-width:500px; text-align:center; margin:0;">
          基于空间填充曲线（Gilbert curve）的像素重排。混淆图经 JPEG 压缩仍能保留色彩特征。
          仅供技术交流使用。
        </p>

        <div class="btn-row" style="margin:0;">
          <button class="btn btn-primary" id="scrambleSelectBtn">
            📁 选择图片
            <input type="file" accept="image/*" id="scrambleFileInput" style="display:none;">
          </button>
          <button class="btn btn-outline" id="scrambleEncBtn">🔀 混淆</button>
          <button class="btn btn-outline" id="scrambleDecBtn">🔁 解混淆</button>
          <button class="btn btn-outline" id="scrambleRestoreBtn">↩️ 还原</button>
          <button class="btn btn-accent" id="scrambleDownloadBtn">⬇️ 下载</button>
        </div>

        <div style="width:100%; text-align:center;">
          <img id="scramblePreview" style="max-width:100%; max-height:60vh; display:none; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.4); object-fit:contain;">
        </div>

        <div class="tip-bar" style="max-width:500px; width:100%; margin-top:0;">
          💡 <strong>提示：</strong>混淆与解混淆使用黄金比例偏移，可逆。下载为 JPEG (质量1) 格式。
        </div>
      </div>
    `;

    initScrambleEvents(container);
  },
  destroy() {}
});

// ---- 事件与逻辑 ----
function initScrambleEvents(container) {
  const fileInput = container.querySelector('#scrambleFileInput');
  const selectBtn = container.querySelector('#scrambleSelectBtn');
  const previewImg = container.querySelector('#scramblePreview');
  const encBtn = container.querySelector('#scrambleEncBtn');
  const decBtn = container.querySelector('#scrambleDecBtn');
  const restoreBtn = container.querySelector('#scrambleRestoreBtn');
  const downloadBtn = container.querySelector('#scrambleDownloadBtn');

  let originalFile = null;
  let currentImageUrl = null;

  // 点击选择按钮触发文件选择
  selectBtn.addEventListener('click', () => fileInput.click());

  // 文件选择
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      originalFile = fileInput.files[0];
      const url = URL.createObjectURL(originalFile);
      setPreview(url);
      showToast('图片已加载');
    }
  });

  // 设置预览
  function setPreview(url) {
    if (currentImageUrl && currentImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentImageUrl);
    }
    currentImageUrl = url;
    previewImg.src = url;
    previewImg.style.display = 'block';
  }

  // 从当前预览图片获取 Image 对象
  function getCurrentImage() {
    return new Promise((resolve, reject) => {
      if (!previewImg.src || previewImg.style.display === 'none') {
        return reject(new Error('没有可处理的图片'));
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = previewImg.src;
    });
  }

  // 核心处理函数（加密/解密）
  async function processImage(mode) {
    try {
      const img = await getCurrentImage();
      // 隐藏预览，避免闪烁
      previewImg.style.display = 'none';
      // 使用 requestAnimationFrame 确保界面更新
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const canvas = document.createElement('canvas');
      const width = canvas.width = img.width;
      const height = canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, width, height);
      const outputData = new ImageData(width, height);

      const curve = gilbert2d(width, height);
      const offset = Math.round((Math.sqrt(5) - 1) / 2 * width * height);

      for (let i = 0; i < width * height; i++) {
        const oldPos = curve[i];
        const newPos = curve[(i + offset) % (width * height)];
        const oldP = 4 * (oldPos[0] + oldPos[1] * width);
        const newP = 4 * (newPos[0] + newPos[1] * width);

        if (mode === 'encrypt') {
          // 混淆：将 oldPos 处的像素移动到 newPos
          outputData.data.set(imageData.data.slice(oldP, oldP + 4), newP);
        } else {
          // 解混淆：反过来
          outputData.data.set(imageData.data.slice(newP, newP + 4), oldP);
        }
      }

      ctx.putImageData(outputData, 0, 0);

      // 输出为 JPEG 质量 1（与原算法一致）
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 1));
      const url = URL.createObjectURL(blob);
      setPreview(url);
      showToast(mode === 'encrypt' ? '混淆完成' : '解混淆完成');
    } catch (err) {
      previewImg.style.display = 'block';
      showToast('❌ 处理失败：' + err.message);
    }
  }

  // 还原：重新显示原始文件
  restoreBtn.addEventListener('click', () => {
    if (originalFile) {
      setPreview(URL.createObjectURL(originalFile));
      showToast('已还原为原始图片');
    } else {
      showToast('没有原始图片可还原');
    }
  });

  // 混淆按钮
  encBtn.addEventListener('click', () => processImage('encrypt'));

  // 解混淆按钮
  decBtn.addEventListener('click', () => processImage('decrypt'));

  // 下载按钮
  downloadBtn.addEventListener('click', () => {
    if (!previewImg.src || previewImg.style.display === 'none') {
      showToast('没有图片可下载');
      return;
    }
    const a = document.createElement('a');
    a.href = previewImg.src;
    a.download = 'processed_image.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
}
