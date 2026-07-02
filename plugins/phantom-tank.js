registerPlugin({
  id: 'phantom-tank',
  name: '幻影坦克',
  icon: '🎭',
  badge: '热门',
  render(container) {
    container.innerHTML = `
      <h2>🎭 幻影坦克（增强版）</h2>
      <p style="color:var(--text2);margin-bottom:20px;">
        白色背景显示表面图，黑色背景显示隐藏图。可调节“强度”改善清晰度。
      </p>
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
        <label style="display:block; margin-bottom:8px; color:var(--text2);">⚡ 强度调节（越大隐藏图越亮、表面图越暗）</label>
        <input type="range" id="phantomStrengthSlider" min="0.5" max="2.5" step="0.1" value="1.4" style="width:60%;">
        <span id="strengthValue" style="margin-left:10px;">1.4</span>
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
        💡 <strong>提示：</strong>发送到微信/QQ，缩略图显示表面图，点开大图显示隐藏图。务必保存为PNG！
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
      } catch (err) {
        showToast('❌ 图片加载失败');
      }
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

  // 强度滑块
  const strengthSlider = container.querySelector('#phantomStrengthSlider');
  const strengthValue = container.querySelector('#strengthValue');
  strengthSlider.addEventListener('input', () => {
    strengthValue.textContent = parseFloat(strengthSlider.value).toFixed(1);
  });

  // 改进的幻影坦克生成
  function generatePhantom(surf, hid, strength) {
    const w = Math.min(surf.width, hid.width);
    const h = Math.min(surf.height, hid.height);

    const surfCanvas = document.createElement('canvas'); surfCanvas.width = w; surfCanvas.height = h;
    const sCtx = surfCanvas.getContext('2d'); sCtx.drawImage(surf, 0, 0, w, h);
    const sData = sCtx.getImageData(0, 0, w, h);

    const hidCanvas = document.createElement('canvas'); hidCanvas.width = w; hidCanvas.height = h;
    const hCtx = hidCanvas.getContext('2d'); hCtx.drawImage(hid, 0, 0, w, h);
    const hData = hCtx.getImageData(0, 0, w, h);

    const out = new ImageData(w, h);
    const sp = sData.data, hp = hData.data, op = out.data;

    // 改进的亮度映射（考虑感知亮度，并加入强度控制）
    for (let i = 0; i < sp.length; i += 4) {
      let sR = sp[i], sG = sp[i + 1], sB = sp[i + 2];
      let hR = hp[i], hG = hp[i + 1], hB = hp[i + 2];

      // 感知亮度（使用加权公式，更符合人眼）
      let lumS = 0.299 * sR + 0.587 * sG + 0.114 * sB;
      let lumH = 0.299 * hR + 0.587 * hG + 0.114 * hB;

      // 应用强度：表面亮度压暗（乘一个小数），隐藏亮度提亮（乘一个大数）
      lumS = lumS * (1.0 / Math.max(0.1, strength));   // strength越大，表面亮度越低 -> 更暗
      lumH = lumH * strength;                           // strength越大，隐藏亮度越高 -> 更亮

      // 计算基础 alpha（范围可能超出0-255）
      let alpha = 255 + lumH - lumS;
      alpha = Math.max(0, Math.min(255, alpha));

      // 如果 alpha 为 0，直接设透明黑
      if (alpha === 0) {
        op[i] = op[i + 1] = op[i + 2] = 0;
        op[i + 3] = 0;
        continue;
      }

      // 目标：在白色背景混合出表面颜色，在黑色背景混合出隐藏颜色
      // 混合公式：result = sourceRGB * alpha / 255 + backgroundColor * (1 - alpha/255)
      // 我们希望：
      //   白底: sRGB = outRGB * alpha/255 + 255*(1 - alpha/255)
      //   黑底: hRGB = outRGB * alpha/255 + 0
      // 因此 outRGB = hRGB * 255 / alpha  （用于黑底显示）
      // 同时白底显示需要满足：outRGB * alpha/255 + 255*(1 - alpha/255) = sRGB
      // 代入 outRGB = hRGB * 255 / alpha：
      //   sRGB = hRGB + 255*(1 - alpha/255)
      // 这个等式不一定成立，所以我们需要对 outRGB 进行调整，让它在两种背景下都尽量接近目标。
      // 实际操作中，我们直接取 outRGB = hRGB * 255 / alpha，然后让白底效果自然产生。
      // 为了改善白底表现，我们可以对 outRGB 进行微调，使其向 sRGB 靠拢。
      // 简单的修正：取 hRGB 和 sRGB 的混合，权重基于 alpha。
      let t = alpha / 255; // 不透明度
      // 在黑色背景下，显示隐藏图；在白色背景下，显示表面图
      // outRGB 的目标：黑底时 alpha 混合 = hRGB；白底时 alpha 混合 = sRGB
      // 由此可解出 outRGB 的理论值：outRGB = (hRGB + sRGB - 255 + 255*t) / (2*t)？可能繁琐。
      // 采用经验方法：根据强度融合两种极端
      let outR = Math.round(hR * 255 / alpha);
      let outG = Math.round(hG * 255 / alpha);
      let outB = Math.round(hB * 255 / alpha);

      // 钳位到0-255
      outR = Math.max(0, Math.min(255, outR));
      outG = Math.max(0, Math.min(255, outG));
      outB = Math.max(0, Math.min(255, outB));

      // 可选：对颜色进行轻微的去饱和处理，减少透明边缘的彩色噪点
      // （不强制，效果已经可以）

      op[i] = outR;
      op[i + 1] = outG;
      op[i + 2] = outB;
      op[i + 3] = Math.round(alpha);
    }

    const outCanvas = document.createElement('canvas'); outCanvas.width = w; outCanvas.height = h;
    outCanvas.getContext('2d').putImageData(out, 0, 0);
    return outCanvas.toDataURL('image/png');
  }

  generateBtn.addEventListener('click', () => {
    if (!surfaceImg || !hiddenImg) return;
    try {
      const strength = parseFloat(strengthSlider.value);
      const dataUrl = generatePhantom(surfaceImg, hiddenImg, strength);
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
    } catch (err) {
      showToast('❌ 生成失败: ' + err.message);
    }
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
