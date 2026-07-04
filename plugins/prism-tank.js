// ==================== 光棱坦克插件 ====================
registerPlugin({
  id: 'prism-tank',
  name: '光棱坦克',
  icon: '🌈',
  badge: '新',
  render(container) {
    container.innerHTML = `
      <h2>🌈 光棱坦克</h2>
      <p style="color:var(--text2);margin-bottom:20px;">
        分离图片的<strong>红、绿、蓝</strong>三通道并偏移，模拟棱镜色散效果。可调方向和偏移量。
      </p>
      <div class="upload-grid" style="display:grid; grid-template-columns: 1fr; gap:16px; margin-bottom:20px;">
        <div class="upload-zone" id="prismUploadZone">
          <span class="placeholder-icon">🖼️</span>
          <span class="label-text">点击上传图片</span>
          <input type="file" accept="image/*" id="prismFileInput" style="display:none;">
          <button class="clear-btn">✕</button>
        </div>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center; align-items:center; margin-bottom:16px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:0.85rem; color:var(--text2);">偏移量</span>
          <input type="range" id="prismOffsetSlider" min="0" max="50" value="10" style="width:120px;">
          <span id="prismOffsetValue" style="font-size:0.85rem; color:var(--accent2); min-width:30px;">10</span>
        </div>
        <div style="display:flex; gap:4px;">
          <button class="btn btn-outline btn-sm active" id="prismDirH" style="padding:6px 16px; font-size:0.8rem;">水平</button>
          <button class="btn btn-outline btn-sm" id="prismDirV" style="padding:6px 16px; font-size:0.8rem;">垂直</button>
        </div>
        <button class="btn btn-primary" id="prismGenerateBtn">🌈 生成光棱</button>
      </div>
      <div class="result-area" id="prismResultArea" style="display:none;">
        <p style="color:var(--accent2); font-weight:bold;">✅ 光棱坦克生成成功！</p>
        <img id="prismResultImg" style="max-width:100%; max-height:60vh; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.4);">
      </div>
      <div class="tip-bar">
        💡 <strong>玩法说明：</strong>红、绿、蓝通道分别向相反方向偏移，偏移量越大色散越明显。切换水平/垂直改变分离方向。
      </div>
    `;

    initPrismEvents(container);
  },
  destroy() {}
});

function initPrismEvents(container) {
  const fileInput = container.querySelector('#prismFileInput');
  const uploadZone = container.querySelector('#prismUploadZone');
  const clearBtn = uploadZone.querySelector('.clear-btn');
  const offsetSlider = container.querySelector('#prismOffsetSlider');
  const offsetValue = container.querySelector('#prismOffsetValue');
  const dirHBtn = container.querySelector('#prismDirH');
  const dirVBtn = container.querySelector('#prismDirV');
  const generateBtn = container.querySelector('#prismGenerateBtn');
  const resultArea = container.querySelector('#prismResultArea');
  const resultImg = container.querySelector('#prismResultImg');

  let originalImage = null;

  // 上传逻辑
  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  uploadZone.addEventListener('click', (e) => {
    if (e.target === clearBtn) return;
    fileInput.click();
  });
  uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.style.borderColor = 'var(--accent)'; });
  uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = ''; });
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      fileInput.files = e.dataTransfer.files;
      fileInput.dispatchEvent(new Event('change'));
    }
  });
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      originalImage = img;
      const oldImg = uploadZone.querySelector('img');
      if (oldImg) oldImg.remove();
      const preview = document.createElement('img');
      preview.src = img.src;
      uploadZone.insertBefore(preview, clearBtn);
      uploadZone.classList.add('has-image');
      uploadZone.querySelector('.placeholder-icon').style.display = 'none';
      uploadZone.querySelector('.label-text').style.display = 'none';
      clearBtn.style.display = 'block';
      showToast('图片已加载');
    } catch (err) {
      showToast('❌ 图片加载失败');
    }
  });
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    originalImage = null;
    fileInput.value = '';
    const imgEl = uploadZone.querySelector('img');
    if (imgEl) imgEl.remove();
    uploadZone.classList.remove('has-image');
    uploadZone.querySelector('.placeholder-icon').style.display = '';
    uploadZone.querySelector('.label-text').style.display = '';
    clearBtn.style.display = 'none';
  });

  // 偏移量显示
  offsetSlider.addEventListener('input', () => {
    offsetValue.textContent = offsetSlider.value;
  });

  // 方向切换
  let direction = 'horizontal';
  dirHBtn.classList.add('active');
  dirHBtn.addEventListener('click', () => {
    direction = 'horizontal';
    dirHBtn.classList.add('active');
    dirVBtn.classList.remove('active');
  });
  dirVBtn.addEventListener('click', () => {
    direction = 'vertical';
    dirVBtn.classList.add('active');
    dirHBtn.classList.remove('active');
  });

  // 生成光棱效果
  generateBtn.addEventListener('click', () => {
    if (!originalImage) {
      showToast('请先上传图片');
      return;
    }
    try {
      const offset = parseInt(offsetSlider.value, 10);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      ctx.drawImage(originalImage, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const srcData = imageData.data;
      const outputData = new ImageData(canvas.width, canvas.height);
      const dstData = outputData.data;

      // 初始化目标为透明
      dstData.fill(0);

      const w = canvas.width;
      const h = canvas.height;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const srcIdx = (y * w + x) * 4;
          const r = srcData[srcIdx];
          const g = srcData[srcIdx + 1];
          const b = srcData[srcIdx + 2];
          const a = srcData[srcIdx + 3];

          // 计算各通道偏移后的坐标
          let rx = x, ry = y;
          let gx = x, gy = y;
          let bx = x, by = y;

          if (direction === 'horizontal') {
            rx = x - offset;
            bx = x + offset;
          } else {
            ry = y - offset;
            by = y + offset;
          }

          // 绘制各通道到目标位置（带透明度混合）
          drawChannel(dstData, w, h, rx, ry, r, 0, 0, a);
          drawChannel(dstData, w, h, gx, gy, 0, g, 0, a);
          drawChannel(dstData, w, h, bx, by, 0, 0, b, a);
        }
      }

      // 辅助函数：将某个通道值绘制到目标像素（累加混合）
      function drawChannel(dst, width, height, px, py, cr, cg, cb, alpha) {
        if (px < 0 || px >= width || py < 0 || py >= height) return;
        const idx = (py * width + px) * 4;
        // 简单叠加（后绘制的通道会覆盖前一个，但这里我们希望混合出白色，所以用加法然后钳位）
        dst[idx] = Math.min(255, dst[idx] + cr);
        dst[idx + 1] = Math.min(255, dst[idx + 1] + cg);
        dst[idx + 2] = Math.min(255, dst[idx + 2] + cb);
        dst[idx + 3] = 255; // 完全不透明
      }

      ctx.putImageData(outputData, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      resultImg.src = dataUrl;
      resultArea.style.display = 'block';
      resultArea.classList.add('show');
      resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('🌈 光棱坦克生成成功！');
    } catch (err) {
      showToast('❌ 生成失败: ' + err.message);
    }
  });
}
