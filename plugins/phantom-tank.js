// 优化版幻影坦克插件 (带强度调节)
registerPlugin({
  id: 'phantom-tank',
  name: '幻影坦克',
  icon: '🎭',
  badge: '热门',
  render(container) {
    container.innerHTML = `
      <h2>🎭 幻影坦克</h2>
      <p style="color:var(--text2);margin-bottom:20px;">
        白色背景下显示表面图，黑色背景下显示隐藏图。<br>
        <strong>强度越高，分离越彻底；强度越低，两张图融合越柔和。</strong>
      </p>

      <!-- 强度滑块 -->
      <div style="background:var(--surface2); border-radius:12px; padding:16px 20px; margin-bottom:20px; display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
        <span style="font-weight:600;">🎛️ 分离强度：</span>
        <input type="range" id="phantomIntensity" min="0.5" max="2.0" step="0.1" value="1.2" style="flex:1; min-width:160px;">
        <span id="phantomIntensityLabel" style="min-width:40px; text-align:center;">1.2</span>
      </div>

      <div class="upload-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
        <div class="upload-zone" id="phantomSurfaceZone">
          <span class="placeholder-icon">🏞️</span>
          <span class="label-text">上传表面图（白色背景显示）</span>
          <input type="file" accept="image/*" id="phantomSurfaceInput" style="display:none;">
          <button class="clear-btn">✕</button>
        </div>
        <div class="upload-zone" id="phantomHiddenZone">
          <span class="placeholder-icon">👻</span>
          <span class="label-text">上传隐藏图（黑色背景显示）</span>
          <input type="file" accept="image/*" id="phantomHiddenInput" style="display:none;">
          <button class="clear-btn">✕</button>
        </div>
      </div>

      <div style="text-align:center;margin:20px 0;">
        <button class="btn btn-primary" id="phantomGenerateBtn" disabled>🎭 生成幻影坦克</button>
      </div>

      <div class="result-area" id="phantomResultArea" style="display:none;">
        <p style="color:var(--accent2);">✅ 幻影坦克生成成功！</p>
        <div class="phantom-previews" style="display:flex; gap:16px; justify-content:center; margin:16px 0;">
          <div style="background:#fff; padding:12px; border-radius:8px; max-width:200px;">
            <img id="phantomPreviewLight" style="max-width:100%;">
            <p style="color:#333; font-size:0.8rem;">⬜ 白色背景</p>
          </div>
          <div style="background:#111; padding:12px; border-radius:8px; max-width:200px;">
            <img id="phantomPreviewDark" style="max-width:100%;">
            <p style="color:#ddd; font-size:0.8rem;">⬛ 黑色背景</p>
          </div>
        </div>
        <div>
          <label>🎚️ 拖动改变背景色：</label>
          <input type="range" id="phantomBgSlider" min="0" max="100" value="50" style="width:100%; max-width:400px;">
          <div id="phantomSliderPreview" style="display:inline-block; padding:8px; margin-top:8px; border:2px solid var(--border);">
            <img id="phantomPreviewSlider" style="max-width:200px;">
          </div>
        </div>
        <div style="margin-top:15px;">
          <a class="btn btn-accent" id="phantomDownloadBtn" download="phantom_tank.png">⬇️ 下载PNG</a>
          <button class="btn btn-outline" id="phantomRetryBtn">🔄 重新生成</button>
        </div>
      </div>
      <div class="tip-bar">
        💡 <strong>技巧：</strong>如果表面图在白色背景下偏暗，可降低强度；<br>
        如果隐藏图在黑色背景下偏白，可提高强度。调节后重新生成即可。
      </div>
    `;
    initPhantomEvents(container);
  },
  destroy() {}
});

function initPhantomEvents(container) {
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

  function setupUpload(zoneId, inputId, clearBtnSelector, onChange) {
    const zone = container.querySelector(`#${zoneId}`);
    const input = container.querySelector(`#${inputId}`);
    const clearBtn = zone.querySelector(clearBtnSelector);
    let currentImg = null;

    zone.addEventListener('click', (e) => { if (e.target === clearBtn) return; input.click(); });
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = 'var(--border)'; });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.style.borderColor = 'var(--border)';
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
        const existingImg = zone.querySelector('img');
        if (existingImg) existingImg.remove();
        const preview = document.createElement('img');
        preview.src = img.src;
        preview.style.maxWidth = '100%';
        preview.style.maxHeight = '200px';
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
  setupUpload('phantomSurfaceZone', 'phantomSurfaceInput', '.clear-btn', (img) => { surfaceImg = img; updateBtn(); });
  setupUpload('phantomHiddenZone', 'phantomHiddenInput', '.clear-btn', (img) => { hiddenImg = img; updateBtn(); });

  const generateBtn = container.querySelector('#phantomGenerateBtn');
  function updateBtn() { generateBtn.disabled = !(surfaceImg && hiddenImg); }

  // 强度滑块显示
  const intensitySlider = container.querySelector('#phantomIntensity');
  const intensityLabel = container.querySelector('#phantomIntensityLabel');
  intensitySlider.addEventListener('input', () => {
    intensityLabel.textContent = parseFloat(intensitySlider.value).toFixed(1);
  });

  // ---------- 核心优化算法 ----------
  function generatePhantomOptimized(surf, hid, intensity = 1.2) {
    const w = Math.min(surf.width, hid.width);
    const h = Math.min(surf.height, hid.height);

    const surfCanvas = document.createElement('canvas'); surfCanvas.width = w; surfCanvas.height = h;
    const sCtx = surfCanvas.getContext('2d'); sCtx.drawImage(surf, 0, 0, w, h);
    const sData = sCtx.getImageData(0, 0, w, h);

    const hidCanvas = document.createElement('canvas'); hidCanvas.width = w; hidCanvas.height = h;
    const hCtx = hidCanvas.getContext('2d'); hCtx.drawImage(hid, 0, 0, w, h);
    const hData = hCtx.getImageData(0, 0, w, h);

    const outData = new ImageData(w, h);
    const sp = sData.data, hp = hData.data, op = outData.data;

    for (let i = 0; i < sp.length; i += 4) {
      const sR = sp[i], sG = sp[i + 1], sB = sp[i + 2];
      const hR = hp[i], hG = hp[i + 1], hB = hp[i + 2];

      // 感知亮度（加权）
      const lumS = 0.299 * sR + 0.587 * sG + 0.114 * sB;
      const lumH = 0.299 * hR + 0.587 * hG + 0.114 * hB;

      // 强度调节后的 alpha
      let alpha = 255 + (lumH - lumS) * intensity;
      alpha = Math.round(alpha);
      alpha = Math.max(1, Math.min(255, alpha)); // 最小设为1，避免除以零

      // 隐藏图颜色除以 alpha（反推 RGB），并防止溢出
      const oR = Math.min(255, Math.max(0, Math.round((hR * 255) / alpha)));
      const oG = Math.min(255, Math.max(0, Math.round((hG * 255) / alpha)));
      const oB = Math.min(255, Math.max(0, Math.round((hB * 255) / alpha)));

      op[i]     = oR;
      op[i + 1] = oG;
      op[i + 2] = oB;
      op[i + 3] = alpha;
    }

    const outCanvas = document.createElement('canvas'); outCanvas.width = w; outCanvas.height = h;
    outCanvas.getContext('2d').putImageData(outData, 0, 0);
    return outCanvas.toDataURL('image/png');
  }

  generateBtn.addEventListener('click', () => {
    if (!surfaceImg || !hiddenImg) return;
    try {
      const intensity = parseFloat(intensitySlider.value);
      const dataUrl = generatePhantomOptimized(surfaceImg, hiddenImg, intensity);
      const resultArea = container.querySelector('#phantomResultArea');
      resultArea.style.display = 'block';
      container.querySelector('#phantomPreviewLight').src = dataUrl;
      container.querySelector('#phantomPreviewDark').src = dataUrl;
      container.querySelector('#phantomPreviewSlider').src = dataUrl;
      container.querySelector('#phantomDownloadBtn').href = dataUrl;
      container.querySelector('#phantomBgSlider').value = 50;
      updateSliderBg(50);
      resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('🎭 幻影坦克生成成功！');
    } catch (err) { showToast('❌ 生成失败: ' + err.message); }
  });

  const slider = container.querySelector('#phantomBgSlider');
  const sliderPreview = container.querySelector('#phantomSliderPreview');
  function updateSliderBg(val) {
    const gray = 255 - Math.round((val / 100) * 255);
    sliderPreview.style.backgroundColor = `rgb(${gray},${gray},${gray})`;
  }
  slider.addEventListener('input', () => updateSliderBg(parseInt(slider.value)));

  container.querySelector('#phantomRetryBtn').addEventListener('click', () => {
    container.querySelector('#phantomResultArea').style.display = 'none';
  });
}
