// ==================== 光棱坦克（亮度双图隐藏）插件 ====================
registerPlugin({
  id: 'prism-tank',
  name: '光棱坦克',
  icon: '🌈',
  badge: '新',
  render(container) {
    container.innerHTML = `
      <h2>🌈 光棱坦克</h2>
      <p style="color:var(--text2);margin-bottom:20px;">
        将<strong>隐藏图</strong>编码到<strong>表面图</strong>中。<br>
        正常亮度看是表面图；<strong>把亮度调到最低或最高</strong>，表面图隐去，隐藏图浮现。
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
        <p style="color:var(--accent2); font-weight:bold;">✅ 生成成功！</p>
        <img id="prismResultImg" style="max-width:100%; max-height:50vh; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.4);">
        <div style="margin:12px 0;">
          <span style="font-size:0.85rem; color:var(--text2);">🔅 模拟亮度调节</span><br>
          <input type="range" id="prismBrightnessSlider" min="-100" max="100" value="0" style="width:90%; max-width:300px;">
          <div id="prismBrightnessLabel" style="font-size:0.9rem; color:var(--accent2);">0</div>
        </div>
        <p style="font-size:0.8rem; color:var(--text2);">
          👈 左拉（变暗）或 右拉（变亮）到尽头，隐藏图就会出来。
        </p>
      </div>
      <div class="tip-bar">
        💡 <strong>手机查看：</strong>下载图片后，用相册编辑把<strong>亮度</strong>拉到底，或<strong>对比度</strong>拉满，隐藏图就出现了。保持 PNG 画质。
      </div>
    `;

    initPrismTankEvents(container);
  },
  destroy() {}
});

function initPrismTankEvents(container) {
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

  // RGB 转 HSL
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

  // 生成光棱坦克图片（嵌入强度默认0.25）
  function generatePrismTank(surface, hidden, strength = 0.25) {
    const w = surface.width;
    const h = surface.height;

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
      // 表面图像素 HSL
      const [hSl, sSl, lSl] = rgbToHsl(sPix[i], sPix[i+1], sPix[i+2]);

      // 隐藏图灰度
      const gray = 0.299 * hPix[i] + 0.587 * hPix[i+1] + 0.114 * hPix[i+2];
      // 映射为 -1 到 1 的调整量（灰度越深越负，越浅越正）
      const adjust = (gray / 255 - 0.5) * strength * 2.5;
      let newL = lSl + adjust;
      newL = Math.max(0, Math.min(1, newL));

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

  let generatedDataUrl = null;
  let originalPixels = null, imageWidth = 0, imageHeight = 0;

  generateBtn.addEventListener('click', () => {
    if (!surfaceImg || !hiddenImg) return;
    try {
      generatedDataUrl = generatePrismTank(surfaceImg, hiddenImg, 0.25);
      const resultArea = container.querySelector('#prismResultArea');
      const resultImg = container.querySelector('#prismResultImg');
      resultImg.src = generatedDataUrl;
      resultArea.style.display = 'block';
      resultArea.classList.add('show');

      // 缓存原始数据用于快速滑块预览
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
        updateBrightnessPreview(0);
      };
      img.src = generatedDataUrl;

      resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('🌈 光棱坦克生成成功！');
    } catch (err) {
      showToast('❌ 生成失败: ' + err.message);
    }
  });

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
    const src = originalPixels.data;
    const dst = outData.data;

    // 将滑块值映射为极端非线性变换
    const t = value / 100; // -1 到 1
    const absT = Math.abs(t);
    // 强度因子：超过60%开始急剧变化，模拟“切换”效果
    const factor = absT < 0.6 ? absT * 1.5 : 1.0 + (absT - 0.6) * 5; // 最大约3倍

    for (let i = 0; i < src.length; i += 4) {
      let r = src[i], g = src[i+1], b = src[i+2];
      if (t < 0) {
        // 降低亮度：大幅压暗，并增强对比度，让表面图变黑，暗部细节（隐藏图）弹出
        const darken = 1 - factor * 0.9;
        r = Math.max(0, Math.round(r * darken));
        g = Math.max(0, Math.round(g * darken));
        b = Math.max(0, Math.round(b * darken));
        // 再增强剩余对比度
        const avg = (r + g + b) / 3;
        r = Math.min(255, Math.max(0, avg + (r - avg) * 2.5));
        g = Math.min(255, Math.max(0, avg + (g - avg) * 2.5));
        b = Math.min(255, Math.max(0, avg + (b - avg) * 2.5));
      } else {
        // 提高亮度：大幅提亮，过曝表面图，暗部细节消失，隐藏图的亮部浮现
        const lighten = 1 + factor * 1.2;
        r = Math.min(255, Math.round(r * lighten));
        g = Math.min(255, Math.round(g * lighten));
        b = Math.min(255, Math.round(b * lighten));
        // 增强对比度，让隐藏图亮部更突出
        const avg = (r + g + b) / 3;
        r = Math.min(255, Math.max(0, avg + (r - avg) * 2.5));
        g = Math.min(255, Math.max(0, avg + (g - avg) * 2.5));
        b = Math.min(255, Math.max(0, avg + (b - avg) * 2.5));
      }
      dst[i] = r;
      dst[i+1] = g;
      dst[i+2] = b;
      dst[i+3] = 255;
    }
    ctx.putImageData(outData, 0, 0);
    previewImg.src = canvas.toDataURL();
  }

  brightnessSlider.addEventListener('input', () => {
    const val = parseInt(brightnessSlider.value, 10);
    brightnessLabel.textContent = (val > 0 ? '+' : '') + val + '%';
    updateBrightnessPreview(val);
  });
}
