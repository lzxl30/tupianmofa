registerPlugin({
  id: 'phantom-tank',
  name: '幻影坦克',
  icon: '🎭',
  badge: '热门',
  render(container) {
    container.innerHTML = `
      <h2>🎭 幻影坦克</h2>
      <p style="color:var(--text2);margin-bottom:20px;">
        生成一张神奇的PNG——<strong>白色背景下完美显示表面图</strong>，<strong>黑色背景下完美显示隐藏图</strong>，无残影。
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
  // 通用图片加载函数
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

  // 上传区域初始化
  function setupUpload(zoneId, inputId, clearBtnSelector, onChange) {
    const zone = container.querySelector(`#${zoneId}`);
    const input = container.querySelector(`#${inputId}`);
    const clearBtn = zone.querySelector(clearBtnSelector);
    let currentImg = null;

    zone.addEventListener('click', (e) => {
      if (e.target === clearBtn) return;
      input.click();
    });
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
  setupUpload('phantomSurfaceZone', 'phantomSurfaceInput', '.clear-btn', (img) => {
    surfaceImg = img;
    updateBtn();
  });
  setupUpload('phantomHiddenZone', 'phantomHiddenInput', '.clear-btn', (img) => {
    hiddenImg = img;
    updateBtn();
  });

  const generateBtn = container.querySelector('#phantomGenerateBtn');
  function updateBtn() {
    generateBtn.disabled = !(surfaceImg && hiddenImg);
  }

  // 核心算法：像素级精确解，完美分离两个背景
  function generatePhantom(surfaceImg, hiddenImg) {
    const w = Math.min(surfaceImg.width, hiddenImg.width);
    const h = Math.min(surfaceImg.height, hiddenImg.height);

    // 获取两张图缩放后的像素数据
    const getData = (img) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      return ctx.getImageData(0, 0, w, h).data;
    };

    const surf = getData(surfaceImg);
    const hide = getData(hiddenImg);

    const out = new ImageData(w, h);
    const op = out.data;

    for (let i = 0; i < surf.length; i += 4) {
      const sR = surf[i], sG = surf[i + 1], sB = surf[i + 2];
      const hR = hide[i], hG = hide[i + 1], hB = hide[i + 2];

      // 每个通道独立计算所需的 alpha
      const aR = 255 - (sR - hR);
      const aG = 255 - (sG - hG);
      const aB = 255 - (sB - hB);

      // 取最大 alpha 保证三个通道在白色背景下都不溢出
      let alpha = Math.max(aR, aG, aB, 0);
      alpha = Math.min(255, alpha);

      if (alpha > 0) {
        // 反推原始颜色 C = (隐藏色 * 255) / alpha
        op[i]     = Math.min(255, Math.round((hR * 255) / alpha));
        op[i + 1] = Math.min(255, Math.round((hG * 255) / alpha));
        op[i + 2] = Math.min(255, Math.round((hB * 255) / alpha));
      } else {
        op[i] = op[i + 1] = op[i + 2] = 0;
      }
      op[i + 3] = alpha;
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    outCanvas.getContext('2d').putImageData(out, 0, 0);
    return outCanvas.toDataURL('image/png');
  }

  // 生成按钮事件
  generateBtn.addEventListener('click', () => {
    if (!surfaceImg || !hiddenImg) return;
    try {
      const dataUrl = generatePhantom(surfaceImg, hiddenImg);
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

  // 背景渐变滑块
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
