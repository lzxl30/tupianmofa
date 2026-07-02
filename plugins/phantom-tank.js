// plugins/phantom-tank.js
registerPlugin({
  id: 'phantom-tank',
  name: '幻影坦克',
  icon: '🎭',
  badge: '热门',
  render(container) {
    container.innerHTML = `
      <h2>🎭 幻影坦克</h2>
      <p style="color:var(--text2);margin-bottom:8px;">
        生成神奇的PNG图片：<strong>白色背景</strong>下显示表面图，<strong>黑色背景</strong>下显示隐藏图。
      </p>

      <div style="margin-bottom:16px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <label for="phantomAlgoSelect" style="font-weight:600;">🧪 生成算法：</label>
        <select id="phantomAlgoSelect" style="padding:8px 14px; border-radius:8px; border:1px solid var(--border); background:var(--surface2); color:var(--text); font-size:0.9rem;">
          <option value="advanced">✨ 通道独立法（推荐，重影更少）</option>
          <option value="classic">🔹 经典亮度法（简单快速）</option>
        </select>
        <span style="font-size:0.8rem; color:var(--text2);">遇到残影时可切换算法或更换图片</span>
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

      <div class="tip-bar" id="phantomTip">
        💡 <strong>提示：</strong>选择<strong>亮度相近、色调接近</strong>的两张图效果最佳。发送到微信/QQ时务必以<strong>PNG原图</strong>发送。
      </div>
    `;
    initPhantomEvents(container);
  },
  destroy() {}
});

// ============ 幻影坦克事件与算法 ============
function initPhantomEvents(container) {
  // 通用图片加载
  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  // 上传区域初始化
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

  // ==================== 经典亮度法（原版） ====================
  function generatePhantomClassic(surf, hid) {
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
    for (let i = 0; i < sp.length; i += 4) {
      const sR = sp[i], sG = sp[i + 1], sB = sp[i + 2];
      const hR = hp[i], hG = hp[i + 1], hB = hp[i + 2];
      const lumS = 0.299 * sR + 0.587 * sG + 0.114 * sB;
      const lumH = 0.299 * hR + 0.587 * hG + 0.114 * hB;
      let alpha = Math.round(255 + lumH - lumS);
      alpha = Math.max(1, Math.min(255, alpha));
      if (alpha > 0) {
        op[i] = Math.min(255, Math.round((hR * 255) / alpha));
        op[i + 1] = Math.min(255, Math.round((hG * 255) / alpha));
        op[i + 2] = Math.min(255, Math.round((hB * 255) / alpha));
      } else {
        op[i] = op[i + 1] = op[i + 2] = 0;
      }
      op[i + 3] = alpha;
    }
    const outCanvas = document.createElement('canvas'); outCanvas.width = w; outCanvas.height = h;
    outCanvas.getContext('2d').putImageData(out, 0, 0);
    return outCanvas.toDataURL('image/png');
  }

  // ==================== 通道独立 Alpha 法（升级版） ====================
  function generatePhantomAdvanced(surf, hid) {
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

    for (let i = 0; i < sp.length; i += 4) {
      const Rs = sp[i], Gs = sp[i + 1], Bs = sp[i + 2];
      const Rh = hp[i], Gh = hp[i + 1], Bh = hp[i + 2];

      // 对每个通道计算最优 Alpha（白底准确公式推导）
      // 黑底： (R * A)/255 = Rh  =>  R = Rh * 255 / A
      // 白底： (R * A)/255 + 255 - A = Rs  =>  代入R得 Rh + 255 - A = Rs  =>  A = Rh - Rs + 255
      const calcAlpha = (rh, rs) => {
        let a = rh - rs + 255;
        return Math.max(1, Math.min(255, Math.round(a)));
      };
      const Ar = calcAlpha(Rh, Rs);
      const Ag = calcAlpha(Gh, Gs);
      const Ab = calcAlpha(Bh, Bs);

      // 取三个 Alpha 的中位数，以获得最稳定的视觉效果
      const alphas = [Ar, Ag, Ab].sort((a, b) => a - b);
      const A = alphas[1]; // 中位数

      // 以黑底正确为目标，用统一 Alpha 计算 RGB
      const calcRGB = (rh) => Math.max(0, Math.min(255, Math.round((rh * 255) / A)));
      const R = calcRGB(Rh);
      const G = calcRGB(Gh);
      const B = calcRGB(Bh);

      op[i] = R;
      op[i + 1] = G;
      op[i + 2] = B;
      op[i + 3] = A;
    }

    const outCanvas = document.createElement('canvas'); outCanvas.width = w; outCanvas.height = h;
    outCanvas.getContext('2d').putImageData(out, 0, 0);
    return outCanvas.toDataURL('image/png');
  }

  // 生成按钮点击
  generateBtn.addEventListener('click', () => {
    if (!surfaceImg || !hiddenImg) return;
    try {
      const algoSelect = container.querySelector('#phantomAlgoSelect');
      const algo = algoSelect ? algoSelect.value : 'advanced';
      const dataUrl = (algo === 'classic')
        ? generatePhantomClassic(surfaceImg, hiddenImg)
        : generatePhantomAdvanced(surfaceImg, hiddenImg);

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

  // 背景色滑动条
  const slider = container.querySelector('#phantomBgSlider');
  const sliderPreview = container.querySelector('#phantomSliderPreview');
  function updateSliderBg(val) {
    const gray = 255 - Math.round((val / 100) * 255);
    sliderPreview.style.backgroundColor = `rgb(${gray},${gray},${gray})`;
  }
  slider.addEventListener('input', () => updateSliderBg(parseInt(slider.value)));

  // 重新生成按钮
  container.querySelector('#phantomRetryBtn').addEventListener('click', () => {
    container.querySelector('#phantomResultArea').style.display = 'none';
  });
}
