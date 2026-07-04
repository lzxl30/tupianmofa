// ==================== 光棱坦克（通道隐藏）插件 ====================
registerPlugin({
  id: 'prism-tank',
  name: '光棱坦克',
  icon: '🌈',
  badge: '新',
  render(container) {
    container.innerHTML = `
      <h2>🌈 光棱坦克</h2>
      <p style="color:var(--text2);margin-bottom:20px;">
        将<strong>隐藏图</strong>编码到<strong>表面图</strong>的红色通道。肉眼难以察觉，提取红色通道或戴红蓝眼镜（左红右蓝）可见隐藏图。
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
        <button class="btn btn-outline" id="prismExtractRedBtn">🔴 提取红色通道</button>
      </div>
      <div class="result-area" id="prismResultArea" style="display:none;">
        <p style="color:var(--accent2); font-weight:bold;">✅ 光棱坦克生成成功！</p>
        <div style="display:flex; flex-wrap:wrap; gap:16px; justify-content:center;">
          <div>
            <p style="font-size:0.85rem; color:var(--text2);">正常观看</p>
            <img id="prismResultImg" style="max-width:260px; border-radius:8px;">
          </div>
          <div>
            <p style="font-size:0.85rem; color:var(--text2);">红色通道（隐藏图）</p>
            <img id="prismRedImg" style="max-width:260px; border-radius:8px;">
          </div>
        </div>
      </div>
      <div class="tip-bar">
        💡 <strong>玩法说明：</strong>下载图片后戴上<strong>红蓝眼镜</strong>（左眼红、右眼蓝），或使用修图软件提取红色通道即可看到隐藏图。保持 PNG 格式。
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

  function generatePrismTank(surface, hidden) {
    const w = surface.width;
    const h = surface.height;

    // 绘制表面图
    const surfaceCanvas = document.createElement('canvas');
    surfaceCanvas.width = w; surfaceCanvas.height = h;
    const sCtx = surfaceCanvas.getContext('2d');
    sCtx.drawImage(surface, 0, 0, w, h);
    const surfaceData = sCtx.getImageData(0, 0, w, h);

    // 绘制隐藏图并缩放至相同尺寸
    const hiddenCanvas = document.createElement('canvas');
    hiddenCanvas.width = w; hiddenCanvas.height = h;
    const hCtx = hiddenCanvas.getContext('2d');
    hCtx.drawImage(hidden, 0, 0, w, h);
    const hiddenData = hCtx.getImageData(0, 0, w, h);

    const outputData = new ImageData(w, h);
    const sPix = surfaceData.data;
    const hPix = hiddenData.data;
    const oPix = outputData.data;

    for (let i = 0; i < oPix.length; i += 4) {
      // 红色通道：用隐藏图的亮度
      const gray = Math.round(0.299 * hPix[i] + 0.587 * hPix[i+1] + 0.114 * hPix[i+2]);
      oPix[i] = gray;           // R 来自隐藏图灰度
      oPix[i+1] = sPix[i+1];   // G 保留表面图
      oPix[i+2] = sPix[i+2];   // B 保留表面图
      oPix[i+3] = 255;         // Alpha 不透明
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = w; outCanvas.height = h;
    outCanvas.getContext('2d').putImageData(outputData, 0, 0);
    return outCanvas.toDataURL('image/png');
  }

  function extractRedChannel(imageDataUrl) {
    const img = new Image();
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const redData = new ImageData(canvas.width, canvas.height);
        const rPix = redData.data;
        for (let i = 0; i < rPix.length; i += 4) {
          const r = data[i];
          rPix[i] = r;
          rPix[i+1] = r;
          rPix[i+2] = r;
          rPix[i+3] = 255;
        }
        ctx.putImageData(redData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = imageDataUrl;
    });
  }

  let generatedDataUrl = null;

  generateBtn.addEventListener('click', () => {
    if (!surfaceImg || !hiddenImg) return;
    try {
      generatedDataUrl = generatePrismTank(surfaceImg, hiddenImg);
      const resultArea = container.querySelector('#prismResultArea');
      resultArea.style.display = 'block';
      resultArea.classList.add('show');
      container.querySelector('#prismResultImg').src = generatedDataUrl;

      // 显示红色通道预览
      extractRedChannel(generatedDataUrl).then(url => {
        container.querySelector('#prismRedImg').src = url;
      });

      resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('🌈 光棱坦克生成成功！');
    } catch (err) {
      showToast('❌ 生成失败: ' + err.message);
    }
  });

  // 提取红色通道按钮（方便查看）
  container.querySelector('#prismExtractRedBtn').addEventListener('click', async () => {
    if (!generatedDataUrl) {
      showToast('请先生成光棱坦克');
      return;
    }
    const url = await extractRedChannel(generatedDataUrl);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'red_channel.png';
    a.click();
    showToast('🔴 红色通道已下载');
  });
}
