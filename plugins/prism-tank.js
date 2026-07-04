// ==================== 光棱坦克（亮度隐藏）插件 ====================
registerPlugin({
  id: 'prism-tank',
  name: '光棱坦克',
  icon: '🌈',
  badge: '新',
  render(container) {
    container.innerHTML = `
      <h2>🌈 光棱坦克</h2>
      <p style="color:var(--text2);margin-bottom:20px;">
        将<strong>隐藏图</strong>编码到<strong>表面图</strong>的亮度中。正常看是表面图，调整亮度后隐藏图浮现。
      </p>
      <div class="upload-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-bottom:20px;">
        <div class="upload-zone" id="prismSurfaceZone">
          <span class="placeholder-icon">🏞️</span>
          <span class="label-text">点击上传<strong>表面图</strong></span>
          <input type="file" accept="image/*" id="prismSurfaceInput" style="display:none;">
          <button class="clear-btn">✕</button>
        </div>
        <div class="upload-zone" id="prismHiddenZone">
          <span class="placeholder-icon">👁️</span>
          <span class="label-text">点击上传<strong>隐藏图</strong></span>
          <input type="file" accept="image/*" id="prismHiddenInput" style="display:none;">
          <button class="clear-btn">✕</button>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" id="prismGenerateBtn" disabled>🌈 生成光棱坦克</button>
      </div>
      <div class="result-area" id="prismResultArea" style="display:none;">
        <p style="color:var(--accent2); font-weight:bold;">✅ 光棱坦克生成成功！</p>
        <div style="margin:12px 0;">
          <img id="prismResultImg" style="max-width:100%; max-height:50vh; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.4);">
        </div>
        <div style="margin:12px 0; display:flex; align-items:center; gap:10px; justify-content:center; flex-wrap:wrap;">
          <span style="font-size:0.85rem; color:var(--text2);">🔅 模拟亮度调节：</span>
          <input type="range" id="prismBrightnessSlider" min="-100" max="100" value="0" style="width:200px;">
          <span id="prismBrightnessLabel" style="font-size:0.85rem; color:var(--accent2); min-width:45px;">0%</span>
        </div>
        <p style="font-size:0.75rem; color:var(--text2);">拖动滑块预览隐藏效果。下载的是原始图片，可用其他工具调整亮度查看。</p>
      </div>
      <div class="tip-bar">
        💡 <strong>玩法说明：</strong>下载图片后，使用手机相册编辑功能或修图软件调整<strong>亮度/对比度</strong>，即可看到隐藏图浮现。也可左右拖动上方滑块预览效果。
      </div>
    `;

    initPrismTankEvents(container);
  },
  destroy() {}
});

function initPrismTankEvents(container) {
  // 辅助：加载图片
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

  // 上传区域通用逻辑
  function setupUpload(zoneId, inputId, onChange) {
    const zone = container.querySelector(`#${zoneId}`);
    const input = container.querySelector(`#${inputId}`);
    const clearBtn = zone.querySelector('.clear-btn');
    let currentImg = null;

    zone.addEventListener('click', (e) => { if (e.target === clearBtn) return; input.click(); });
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
      }
    });
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const img = await loadImageFromFile(file);
        currentImg = img;
        const oldImg = zone.querySelector('img');
        if (oldImg) oldImg.remove();
        const preview = document.createElement('img');
        preview.src = img.src;
        zone.insertBefore(preview, clearBtn);
        zone.classList.add('has-image');
        zone.querySelector('.placeholder-icon').style.display = 'none';
        zone.querySelector('.label-text').style.display = 'none';
        clearBtn.style.display = 'block';
        if (onChange) onChange(img);
      } catch (err) { showToast('❌ 图片加载失败'); }
    });
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentImg = null;
      input.value = '';
      const imgEl = zone.querySelector('img');
      if (imgEl) imgEl.remove();
      zone.classList.remove('has-image');
      zone.querySelector('.placeholder-icon').style.display = '';
      zone.querySelector('.label-text').style.display = '';
      clearBtn.style.display = 'none';
      if (onChange) onChange(null);
    });
    return { getImage: () => currentImg };
  }

  let surfaceImg = null, hiddenImg = null;
  setupUpload('prismSurfaceZone', 'prismSurfaceInput', (img) => { surfaceImg = img; updateBtn(); });
  setupUpload('prismHiddenZone', 'prismHiddenInput', (img) => { hiddenImg = img; updateBtn(); });

  const generateBtn = container.querySelector('#prismGenerateBtn');
  function updateBtn() { generateBtn.disabled = !(surfaceImg && hiddenImg); }

  // RGB 转 HSL（h:0-360, s:0-1, l:0-1）
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [h * 360, s, l];
  }

  // HSL 转 RGB
  function hslToRgb(h, s, l) {
    h /= 360;
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  // 生成光棱坦克合成图
  function generatePrismTank(surface, hidden, strength = 0.08) {
    const w = surface.width;
    const h = surface.height;

    // 将两张图绘制到相同尺寸
    const surfCanvas = document.createElement('canvas');
    surfCanvas.width = w; surfCanvas.height = h;
    const sCtx = surfCanvas.getContext('2d');
    sCtx.drawImage(surface, 0, 0, w, h);
    const surfData = sCtx.getImageData(0, 0, w, h);

    const hidCanvas = document.createElement('canvas');
    hidCanvas.width = w; hidCanvas.height = h;
    const hCtx = hidCanvas.getContext('2d');
    hCtx.drawImage(hidden, 0, 0, w, h);
    const hidData = hCtx.getImageData(0, 0, w, h);

    const outData = new ImageData(w, h);
    const sPix = surfData.data;
    const hPix = hidData.data;
    const oPix = outData.data;

    for (let i = 0; i < sPix.length; i += 4) {
      // 表面图像素的 HSL
      const [hSl, sSl, lSl] = rgbToHsl(sPix[i], sPix[i+1], sPix[i+2]);

      // 隐藏图像素灰度
      const gray = 0.299 * hPix[i] + 0.587 * hPix[i+1] + 0.114 * hPix[i+2];
      // 将灰度映射到 -0.5 到 0.5 的调整量
      const adjust = (gray / 255 - 0.5) * strength * 2; // strength 控制强度
      // 修改亮度，限制在 0-1 之间
      let newL = lSl + adjust;
      newL = Math.max(0, Math.min(1, newL));

      // 转回 RGB
      const [r, g, b] = hslToRgb(hSl, sSl, newL);
      oPix[i] = r;
      oPix[i+1] = g;
      oPix[i+2] = b;
      oPix[i+3] = 255;
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = w; outCanvas.height = h;
    outCanvas.getContext('2d').putImageData(outData, 0, 0);
    return outCanvas.toDataURL('image/png');
  }

  // 存储生成结果
  let generatedDataUrl = null;
  // 存储表面图亮度调整用的原始像素数据（用于快速滑块渲染）
  let originalPixels = null;
  let imageWidth = 0, imageHeight = 0;

  generateBtn.addEventListener('click', () => {
    if (!surfaceImg || !hiddenImg) return;
    try {
      generatedDataUrl = generatePrismTank(surfaceImg, hiddenImg, 0.1);
      const resultArea = container.querySelector('#prismResultArea');
      const resultImg = container.querySelector('#prismResultImg');
      resultImg.src = generatedDataUrl;
      resultArea.style.display = 'block';
      resultArea.classList.add('show');

      // 为了快速调整亮度预览，保存图像数据
      const tmpCanvas = document.createElement('canvas');
      const tmpCtx = tmpCanvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        tmpCanvas.width = img.width;
        tmpCanvas.height = img.height;
        tmpCtx.drawImage(img, 0, 0);
        imageWidth = img.width;
        imageHeight = img.height;
        originalPixels = tmpCtx.getImageData(0, 0, imageWidth, imageHeight);
        // 触发一次滑块初始渲染
        updateBrightnessPreview(0);
      };
      img.src = generatedDataUrl;

      resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('🌈 光棱坦克生成成功！');
    } catch (err) {
      showToast('❌ 生成失败: ' + err.message);
    }
  });

  // 亮度滑块逻辑
  const brightnessSlider = container.querySelector('#prismBrightnessSlider');
  const brightnessLabel = container.querySelector('#prismBrightnessLabel');
  const previewImg = container.querySelector('#prismResultImg');

  function updateBrightnessPreview(value) {
    if (!originalPixels) return;
    const canvas = document.createElement('canvas');
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    const ctx = canvas.getContext('2d');
    const outData = new ImageData(imageWidth, imageHeight);
    const srcData = originalPixels.data;
    const dstData = outData.data;
    const adjust = value / 100; // -1 到 1

    for (let i = 0; i < srcData.length; i += 4) {
      if (adjust >= 0) {
        // 提高亮度：线性插值到255
        dstData[i] = Math.min(255, Math.round(srcData[i] + (255 - srcData[i]) * adjust));
        dstData[i+1] = Math.min(255, Math.round(srcData[i+1] + (255 - srcData[i+1]) * adjust));
        dstData[i+2] = Math.min(255, Math.round(srcData[i+2] + (255 - srcData[i+2]) * adjust));
      } else {
        // 降低亮度：线性插值到0
        const factor = 1 + adjust; // 0 到 1
        dstData[i] = Math.max(0, Math.round(srcData[i] * factor));
        dstData[i+1] = Math.max(0, Math.round(srcData[i+1] * factor));
        dstData[i+2] = Math.max(0, Math.round(srcData[i+2] * factor));
      }
      dstData[i+3] = 255;
    }
    ctx.putImageData(outData, 0, 0);
    previewImg.src = canvas.toDataURL();
  }

  brightnessSlider.addEventListener('input', () => {
    const val = parseInt(brightnessSlider.value, 10);
    brightnessLabel.textContent = val + '%';
    updateBrightnessPreview(val);
  });
}
