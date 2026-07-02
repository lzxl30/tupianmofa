// 幻影坦克插件 - 实时预览增强版
registerPlugin({
  id: 'phantom-tank',
  name: '幻影坦克',
  icon: '🎭',
  badge: '热门',
  render(container) {
    container.innerHTML = `
      <h2>🎭 幻影坦克</h2>
      <p style="color:var(--text2);margin-bottom:16px;">
        白色背景下显示表面图，黑色背景下显示隐藏图。<br>
        <strong>上传两张图后，拖动下方滑块即可实时调节效果。</strong>
      </p>

      <!-- 图片上传区 -->
      <div class="upload-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
        <div class="upload-zone" id="phantomSurfaceZone">
          <span class="placeholder-icon">🏞️</span>
          <span class="label-text">上传<strong>表面图</strong>（白色背景显示）</span>
          <input type="file" accept="image/*" id="phantomSurfaceInput" style="display:none;">
          <button class="clear-btn">✕</button>
        </div>
        <div class="upload-zone" id="phantomHiddenZone">
          <span class="placeholder-icon">👻</span>
          <span class="label-text">上传<strong>隐藏图</strong>（黑色背景显示）</span>
          <input type="file" accept="image/*" id="phantomHiddenInput" style="display:none;">
          <button class="clear-btn">✕</button>
        </div>
      </div>

      <!-- 参数调节面板 (初始隐藏，上传两张图后显示) -->
      <div id="phantomParamPanel" style="display:none; background:var(--surface2); border-radius:14px; padding:20px 22px; margin-bottom:16px; border:1px solid var(--border);">
        <h3 style="margin-bottom:14px; font-size:1rem;">🎛️ 实时调节参数</h3>

        <!-- 分离强度 -->
        <div style="margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <label style="font-weight:600; font-size:0.9rem;">🔲 分离强度</label>
            <span id="phantomValIntensity" style="color:var(--accent2); font-weight:600;">1.2</span>
          </div>
          <input type="range" id="phantomIntensity" min="0.3" max="2.5" step="0.05" value="1.2" style="width:100%;">
          <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text2);">
            <span>柔和融合</span><span>彻底分离</span>
          </div>
        </div>

        <!-- 色彩强度 -->
        <div style="margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <label style="font-weight:600; font-size:0.9rem;">🎨 色彩强度</label>
            <span id="phantomValColor" style="color:var(--accent2); font-weight:600;">1.0</span>
          </div>
          <input type="range" id="phantomColorStrength" min="0" max="2.5" step="0.05" value="1.0" style="width:100%;">
          <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text2);">
            <span>灰度</span><span>原色</span><span>增强</span>
          </div>
        </div>

        <!-- 亮度混合 -->
        <div style="margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <label style="font-weight:600; font-size:0.9rem;">☀️ 亮度偏向</label>
            <span id="phantomValLumBias" style="color:var(--accent2); font-weight:600;">0</span>
          </div>
          <input type="range" id="phantomLumBias" min="-80" max="80" step="1" value="0" style="width:100%;">
          <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text2);">
            <span>偏向表面图</span><span>平衡</span><span>偏向隐藏图</span>
          </div>
        </div>

        <!-- 亮度权重预设 -->
        <div style="margin-bottom:8px;">
          <label style="font-weight:600; font-size:0.9rem; display:block; margin-bottom:6px;">⚖️ 亮度计算方式</label>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-sm lum-preset active" data-preset="standard" style="padding:6px 14px; font-size:0.8rem; background:var(--accent); color:#fff; border:none; border-radius:20px; cursor:pointer;">标准 (0.30R+0.59G+0.11B)</button>
            <button class="btn btn-sm lum-preset" data-preset="uniform" style="padding:6px 14px; font-size:0.8rem; background:var(--surface); color:var(--text); border:1px solid var(--border); border-radius:20px; cursor:pointer;">均匀 (1:1:1)</button>
            <button class="btn btn-sm lum-preset" data-preset="red" style="padding:6px 14px; font-size:0.8rem; background:var(--surface); color:var(--text); border:1px solid var(--border); border-radius:20px; cursor:pointer;">仅红色</button>
            <button class="btn btn-sm lum-preset" data-preset="green" style="padding:6px 14px; font-size:0.8rem; background:var(--surface); color:var(--text); border:1px solid var(--border); border-radius:20px; cursor:pointer;">仅绿色</button>
            <button class="btn btn-sm lum-preset" data-preset="blue" style="padding:6px 14px; font-size:0.8rem; background:var(--surface); color:var(--text); border:1px solid var(--border); border-radius:20px; cursor:pointer;">仅蓝色</button>
          </div>
        </div>

        <!-- 自定义RGB权重 (仅在需要时显示) -->
        <div id="phantomCustomWeights" style="display:none; margin-top:10px; padding:10px; background:rgba(0,0,0,0.2); border-radius:8px;">
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <div style="flex:1; min-width:80px;">
              <label style="font-size:0.8rem;">R权重</label>
              <input type="range" id="phantomWeightR" min="0" max="100" value="30" style="width:100%;">
              <span id="phantomValR" style="font-size:0.75rem; color:var(--text2);">0.30</span>
            </div>
            <div style="flex:1; min-width:80px;">
              <label style="font-size:0.8rem;">G权重</label>
              <input type="range" id="phantomWeightG" min="0" max="100" value="59" style="width:100%;">
              <span id="phantomValG" style="font-size:0.75rem; color:var(--text2);">0.59</span>
            </div>
            <div style="flex:1; min-width:80px;">
              <label style="font-size:0.8rem;">B权重</label>
              <input type="range" id="phantomWeightB" min="0" max="100" value="11" style="width:100%;">
              <span id="phantomValB" style="font-size:0.75rem; color:var(--text2);">0.11</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 生成按钮 (仅在上传后可用，参数面板显示后隐藏) -->
      <div style="text-align:center;margin:16px 0;" id="phantomBtnRow">
        <button class="btn btn-primary" id="phantomGenerateBtn" disabled>🎭 生成幻影坦克</button>
      </div>

      <!-- 结果展示区 -->
      <div class="result-area" id="phantomResultArea" style="display:none;">
        <p style="color:var(--accent2); margin-bottom:12px;">✅ 实时预览中…</p>
        <div class="phantom-previews" style="display:flex; gap:16px; justify-content:center; margin:12px 0; flex-wrap:wrap;">
          <div style="background:#fff; padding:12px; border-radius:8px; max-width:220px; flex:1; min-width:150px;">
            <img id="phantomPreviewLight" style="max-width:100%; border-radius:4px;">
            <p style="color:#333; font-size:0.8rem; margin-top:6px;">⬜ 白色背景</p>
          </div>
          <div style="background:#111; padding:12px; border-radius:8px; max-width:220px; flex:1; min-width:150px;">
            <img id="phantomPreviewDark" style="max-width:100%; border-radius:4px;">
            <p style="color:#ddd; font-size:0.8rem; margin-top:6px;">⬛ 黑色背景</p>
          </div>
          <div style="background:#888; padding:12px; border-radius:8px; max-width:220px; flex:1; min-width:150px;">
            <img id="phantomPreviewGray" style="max-width:100%; border-radius:4px;">
            <p style="color:#fff; font-size:0.8rem; margin-top:6px;">🔲 灰色背景</p>
          </div>
        </div>
        <!-- 渐变滑块预览 -->
        <div style="margin-top:12px;">
          <label style="font-size:0.85rem;">🎚️ 拖动改变背景色：</label>
          <input type="range" id="phantomBgSlider" min="0" max="100" value="50" style="width:100%; max-width:400px;">
          <div id="phantomSliderPreview" style="display:inline-block; padding:8px; margin-top:8px; border:2px solid var(--border); border-radius:8px; transition: background-color 0.15s;">
            <img id="phantomPreviewSlider" style="max-width:220px; display:block;">
          </div>
        </div>
        <div style="margin-top:16px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
          <a class="btn btn-accent" id="phantomDownloadBtn" download="phantom_tank.png">⬇️ 下载PNG</a>
          <button class="btn btn-outline" id="phantomResetBtn">🔄 重置参数</button>
        </div>
      </div>

      <div class="tip-bar">
        💡 <strong>技巧：</strong>表面图偏暗就降低分离强度；隐藏图不够鲜艳就提高色彩强度；亮度偏向可微调平衡。所有调节<strong>实时生效</strong>！
      </div>
    `;

    initPhantomEvents(container);
  },
  destroy() {}
});

function initPhantomEvents(container) {
  // ============ 工具函数 ============
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

  // ============ 上传区域 ============
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
    return {
      getImage: () => currentImg,
      setImage: (img) => { currentImg = img; }
    };
  }

  // ============ 状态管理 ============
  let surfaceImg = null;
  let hiddenImg = null;
  let currentDataUrl = null;
  let isGenerated = false;

  // 当前参数
  let params = {
    intensity: 1.2,       // 分离强度
    colorStrength: 1.0,   // 色彩强度
    lumBias: 0,           // 亮度偏向
    lumWeights: { r: 0.299, g: 0.587, b: 0.114 } // 亮度权重
  };

  // ============ DOM元素引用 ============
  const surfaceUpload = setupUpload('phantomSurfaceZone', 'phantomSurfaceInput', '.clear-btn', (img) => {
    surfaceImg = img;
    checkReady();
  });
  const hiddenUpload = setupUpload('phantomHiddenZone', 'phantomHiddenInput', '.clear-btn', (img) => {
    hiddenImg = img;
    checkReady();
  });

  const generateBtn = container.querySelector('#phantomGenerateBtn');
  const btnRow = container.querySelector('#phantomBtnRow');
  const paramPanel = container.querySelector('#phantomParamPanel');
  const resultArea = container.querySelector('#phantomResultArea');

  // 参数控件
  const intensitySlider = container.querySelector('#phantomIntensity');
  const intensityLabel = container.querySelector('#phantomValIntensity');
  const colorSlider = container.querySelector('#phantomColorStrength');
  const colorLabel = container.querySelector('#phantomValColor');
  const lumBiasSlider = container.querySelector('#phantomLumBias');
  const lumBiasLabel = container.querySelector('#phantomValLumBias');
  const weightRSlider = container.querySelector('#phantomWeightR');
  const weightGSlider = container.querySelector('#phantomWeightG');
  const weightBSlider = container.querySelector('#phantomWeightB');
  const weightRLabel = container.querySelector('#phantomValR');
  const weightGLabel = container.querySelector('#phantomValG');
  const weightBLabel = container.querySelector('#phantomValB');
  const customWeightsDiv = container.querySelector('#phantomCustomWeights');

  // 预览元素
  const previewLight = container.querySelector('#phantomPreviewLight');
  const previewDark = container.querySelector('#phantomPreviewDark');
  const previewGray = container.querySelector('#phantomPreviewGray');
  const previewSlider = container.querySelector('#phantomPreviewSlider');
  const bgSlider = container.querySelector('#phantomBgSlider');
  const sliderPreview = container.querySelector('#phantomSliderPreview');
  const downloadBtn = container.querySelector('#phantomDownloadBtn');

  // ============ 亮度预设按钮 ============
  const presetButtons = container.querySelectorAll('.lum-preset');
  const presets = {
    standard: { r: 0.299, g: 0.587, b: 0.114 },
    uniform:  { r: 0.333, g: 0.333, b: 0.334 },
    red:      { r: 1.0,   g: 0.0,   b: 0.0 },
    green:    { r: 0.0,   g: 1.0,   b: 0.0 },
    blue:     { r: 0.0,   g: 0.0,   b: 1.0 }
  };

  function setPreset(presetName) {
    const w = presets[presetName];
    if (!w) return;
    params.lumWeights = { ...w };
    // 更新自定义滑块
    weightRSlider.value = Math.round(w.r * 100);
    weightGSlider.value = Math.round(w.g * 100);
    weightBSlider.value = Math.round(w.b * 100);
    weightRLabel.textContent = w.r.toFixed(2);
    weightGLabel.textContent = w.g.toFixed(2);
    weightBLabel.textContent = w.b.toFixed(2);
    // 更新按钮样式
    presetButtons.forEach(b => {
      if (b.dataset.preset === presetName) {
        b.style.background = 'var(--accent)';
        b.style.color = '#fff';
        b.style.border = 'none';
      } else {
        b.style.background = 'var(--surface)';
        b.style.color = 'var(--text)';
        b.style.border = '1px solid var(--border)';
      }
    });
    // 如果是自定义权重（不在预设中），显示自定义面板
    const isPreset = Object.keys(presets).some(k => {
      const p = presets[k];
      return Math.abs(p.r - w.r) < 0.005 && Math.abs(p.g - w.g) < 0.005 && Math.abs(p.b - w.b) < 0.005;
    });
    customWeightsDiv.style.display = isPreset ? 'none' : 'block';
    if (!isPreset) {
      presetButtons.forEach(b => {
        b.style.background = 'var(--surface)';
        b.style.color = 'var(--text)';
        b.style.border = '1px solid var(--border)';
      });
    }
    debouncedRegenerate();
  }

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setPreset(btn.dataset.preset);
    });
  });

  // 自定义权重滑块
  function updateCustomWeights() {
    const r = parseInt(weightRSlider.value) / 100;
    const g = parseInt(weightGSlider.value) / 100;
    const b = parseInt(weightBSlider.value) / 100;
    const sum = r + g + b;
    if (sum === 0) return;
    params.lumWeights = { r: r / sum, g: g / sum, b: b / sum };
    weightRLabel.textContent = params.lumWeights.r.toFixed(2);
    weightGLabel.textContent = params.lumWeights.g.toFixed(2);
    weightBLabel.textContent = params.lumWeights.b.toFixed(2);
    customWeightsDiv.style.display = 'block';
    presetButtons.forEach(b => {
      b.style.background = 'var(--surface)';
      b.style.color = 'var(--text)';
      b.style.border = '1px solid var(--border)';
    });
    debouncedRegenerate();
  }

  weightRSlider.addEventListener('input', updateCustomWeights);
  weightGSlider.addEventListener('input', updateCustomWeights);
  weightBSlider.addEventListener('input', updateCustomWeights);

  // ============ 核心生成算法 ============
  function generatePhantom(surf, hid, p) {
    const w = Math.min(surf.width, hid.width);
    const h = Math.min(surf.height, hid.height);

    const surfCanvas = document.createElement('canvas');
    surfCanvas.width = w;
    surfCanvas.height = h;
    const sCtx = surfCanvas.getContext('2d');
    sCtx.drawImage(surf, 0, 0, w, h);
    const sData = sCtx.getImageData(0, 0, w, h);

    const hidCanvas = document.createElement('canvas');
    hidCanvas.width = w;
    hidCanvas.height = h;
    const hCtx = hidCanvas.getContext('2d');
    hCtx.drawImage(hid, 0, 0, w, h);
    const hData = hCtx.getImageData(0, 0, w, h);

    const outData = new ImageData(w, h);
    const sp = sData.data;
    const hp = hData.data;
    const op = outData.data;
    const lw = p.lumWeights;

    for (let i = 0; i < sp.length; i += 4) {
      const sR = sp[i], sG = sp[i + 1], sB = sp[i + 2];
      const hR = hp[i], hG = hp[i + 1], hB = hp[i + 2];

      // 使用自定义权重计算亮度
      const lumS = lw.r * sR + lw.g * sG + lw.b * sB;
      const lumH = lw.r * hR + lw.g * hG + lw.b * hB;

      // 分离强度 + 亮度偏向
      let alpha = 255 + (lumH - lumS + p.lumBias) * p.intensity;
      alpha = Math.round(alpha);
      alpha = Math.max(1, Math.min(255, alpha));

      // 色彩强度：在隐藏图颜色和灰度之间插值
      const grayH = lumH; // 隐藏图的灰度值
      let outR = hR * p.colorStrength + grayH * (1 - p.colorStrength);
      let outG = hG * p.colorStrength + grayH * (1 - p.colorStrength);
      let outB = hB * p.colorStrength + grayH * (1 - p.colorStrength);

      // 反推 RGB
      outR = Math.min(255, Math.max(0, Math.round((outR * 255) / alpha)));
      outG = Math.min(255, Math.max(0, Math.round((outG * 255) / alpha)));
      outB = Math.min(255, Math.max(0, Math.round((outB * 255) / alpha)));

      op[i] = outR;
      op[i + 1] = outG;
      op[i + 2] = outB;
      op[i + 3] = alpha;
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    outCanvas.getContext('2d').putImageData(outData, 0, 0);
    return outCanvas.toDataURL('image/png');
  }

  // ============ 更新预览 ============
  function updateAllPreviews(dataUrl) {
    previewLight.src = dataUrl;
    previewDark.src = dataUrl;
    previewGray.src = dataUrl;
    previewSlider.src = dataUrl;
    downloadBtn.href = dataUrl;
    currentDataUrl = dataUrl;
  }

  function doRegenerate() {
    if (!surfaceImg || !hiddenImg) return;
    try {
      const dataUrl = generatePhantom(surfaceImg, hiddenImg, params);
      updateAllPreviews(dataUrl);
      // 同时更新渐变背景
      updateSliderBg(parseInt(bgSlider.value));
    } catch (err) {
      console.error('生成失败:', err);
    }
  }

  // 防抖
  let debounceTimer = null;
  function debouncedRegenerate() {
    if (!isGenerated) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(doRegenerate, 60);
  }

  // ============ 参数滑块事件 ============
  intensitySlider.addEventListener('input', () => {
    params.intensity = parseFloat(intensitySlider.value);
    intensityLabel.textContent = params.intensity.toFixed(2);
    debouncedRegenerate();
  });

  colorSlider.addEventListener('input', () => {
    params.colorStrength = parseFloat(colorSlider.value);
    colorLabel.textContent = params.colorStrength.toFixed(2);
    debouncedRegenerate();
  });

  lumBiasSlider.addEventListener('input', () => {
    params.lumBias = parseInt(lumBiasSlider.value);
    lumBiasLabel.textContent = params.lumBias;
    debouncedRegenerate();
  });

  // ============ 背景渐变滑块 ============
  function updateSliderBg(val) {
    const gray = 255 - Math.round((val / 100) * 255);
    sliderPreview.style.backgroundColor = `rgb(${gray},${gray},${gray})`;
  }
  bgSlider.addEventListener('input', () => updateSliderBg(parseInt(bgSlider.value)));

  // ============ 重置参数 ============
  container.querySelector('#phantomResetBtn').addEventListener('click', () => {
    params.intensity = 1.2;
    params.colorStrength = 1.0;
    params.lumBias = 0;
    params.lumWeights = { r: 0.299, g: 0.587, b: 0.114 };

    intensitySlider.value = 1.2;
    intensityLabel.textContent = '1.20';
    colorSlider.value = 1.0;
    colorLabel.textContent = '1.00';
    lumBiasSlider.value = 0;
    lumBiasLabel.textContent = '0';
    weightRSlider.value = 30;
    weightGSlider.value = 59;
    weightBSlider.value = 11;
    weightRLabel.textContent = '0.30';
    weightGLabel.textContent = '0.59';
    weightBLabel.textContent = '0.11';
    customWeightsDiv.style.display = 'none';
    setPreset('standard');

    if (isGenerated) doRegenerate();
    showToast('🔄 参数已重置');
  });

  // ============ 准备就绪检查 ============
  function checkReady() {
    if (surfaceImg && hiddenImg) {
      generateBtn.disabled = false;
      // 自动显示参数面板并生成
      if (!isGenerated) {
        paramPanel.style.display = 'block';
        resultArea.style.display = 'block';
        btnRow.style.display = 'none';
        doRegenerate();
        isGenerated = true;
        showToast('✅ 已自动生成，拖动滑块实时调节');
      }
    } else {
      generateBtn.disabled = true;
      if (!surfaceImg && !hiddenImg && isGenerated) {
        // 两张图都被清除了
        paramPanel.style.display = 'none';
        resultArea.style.display = 'none';
        btnRow.style.display = 'block';
        isGenerated = false;
        currentDataUrl = null;
      }
    }
  }

  // ============ 生成按钮 (首次) ============
  generateBtn.addEventListener('click', () => {
    if (!surfaceImg || !hiddenImg) return;
    paramPanel.style.display = 'block';
    resultArea.style.display = 'block';
    btnRow.style.display = 'none';
    doRegenerate();
    isGenerated = true;
    showToast('🎭 幻影坦克已生成，可拖动滑块实时调节');
  });

  // ============ 初始化背景滑块 ============
  updateSliderBg(50);
}
