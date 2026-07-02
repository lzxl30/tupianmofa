// ==================== LSB隐写术插件 ====================
registerPlugin({
  id: 'lsb-stego',
  name: 'LSB隐写术',
  icon: '🔐',
  render(container) {
    container.innerHTML = `
      <h2>🔐 LSB 隐写术</h2>
      <p style="color:var(--text2);margin-bottom:20px;">
        将<strong>秘密图片</strong>藏进一张普通的<strong>载体图片</strong>中。肉眼无法分辨差异，提取需无损PNG。
      </p>
      <div class="upload-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-bottom:20px;">
        <div class="upload-zone" id="stegoCarrierZone">
          <span class="placeholder-icon">📷</span>
          <span class="label-text">点击上传<strong>载体图片</strong>（表面图）</span>
          <input type="file" accept="image/*" id="stegoCarrierInput" style="display:none;">
          <button class="clear-btn">✕</button>
        </div>
        <div class="upload-zone" id="stegoSecretZone">
          <span class="placeholder-icon">🔒</span>
          <span class="label-text">点击上传<strong>秘密图片</strong>（需隐藏）</span>
          <input type="file" accept="image/*" id="stegoSecretInput" style="display:none;">
          <button class="clear-btn">✕</button>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" id="stegoEmbedBtn" disabled>🔐 隐藏图片</button>
        <button class="btn btn-accent" id="stegoExtractBtn">🔍 提取隐藏图片</button>
      </div>
      <div class="result-area" id="stegoEmbedResult">
        <p style="color:var(--accent2); font-weight:bold;">✅ 隐藏成功！含密图片（表面看与原始载体无异）</p>
        <img id="stegoEmbedPreview" style="max-width:250px; border-radius:8px;">
        <div class="btn-row">
          <a class="btn btn-accent" id="stegoDownloadBtn" download="hidden_image.png">⬇️ 下载含密图片</a>
        </div>
      </div>
      <div class="result-area" id="stegoExtractResult">
        <p style="color:var(--accent2); font-weight:bold;">🔓 提取成功！隐藏的图片：</p>
        <img id="stegoExtractPreview" style="max-width:250px; border-radius:8px;">
        <div class="btn-row">
          <a class="btn btn-accent" id="stegoExtractDownloadBtn" download="extracted_secret.png">⬇️ 下载提取的图片</a>
        </div>
      </div>
      <div class="tip-bar">
        ⚠️ <strong>重要提醒：</strong>含密图片必须保持<strong>PNG格式</strong>，传输时请勾选<strong>「原图」</strong>。JPEG压缩或有损处理会破坏隐藏数据！
      </div>
    `;

    initStegoEvents(container);
  },
  destroy() {}
});

function initStegoEvents(container) {
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

    zone.addEventListener('click', (e) => {
      if (e.target === clearBtn) return;
      input.click();
    });
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

  let carrierImg = null, secretImg = null;
  setupUpload('stegoCarrierZone', 'stegoCarrierInput', (img) => { carrierImg = img; updateBtn(); });
  setupUpload('stegoSecretZone', 'stegoSecretInput', (img) => { secretImg = img; updateBtn(); });

  const embedBtn = container.querySelector('#stegoEmbedBtn');
  function updateBtn() { embedBtn.disabled = !(carrierImg && secretImg); }

  // LSB 嵌入
  function embedLSB(cover, secret) {
    const cw = cover.width, ch = cover.height;
    const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d'); ctx.drawImage(cover, 0, 0);
    const coverData = ctx.getImageData(0, 0, cw, ch);
    const coverPixels = coverData.data;

    const maxPixels = Math.floor((cw * ch * 3) / 24);
    let sw = secret.width, sh = secret.height;
    let secPixels;
    if (sw * sh > maxPixels) {
      const scale = Math.sqrt(maxPixels / (sw * sh));
      sw = Math.floor(sw * scale); sh = Math.floor(sh * scale);
      if (sw < 1) sw = 1; if (sh < 1) sh = 1;
      const tmpCanvas = document.createElement('canvas'); tmpCanvas.width = sw; tmpCanvas.height = sh;
      const tCtx = tmpCanvas.getContext('2d'); tCtx.drawImage(secret, 0, 0, sw, sh);
      secPixels = tCtx.getImageData(0, 0, sw, sh).data;
    } else {
      const secCanvas = document.createElement('canvas'); secCanvas.width = sw; secCanvas.height = sh;
      const sCtx = secCanvas.getContext('2d'); sCtx.drawImage(secret, 0, 0);
      secPixels = sCtx.getImageData(0, 0, sw, sh).data;
    }

    const neededBits = 32 + sw * sh * 24;
    if (neededBits > cw * ch * 3) throw new Error('载体图片太小，无法隐藏秘密图片');

    function toBits(num, len) {
      const bits = [];
      for (let i = len - 1; i >= 0; i--) bits.push((num >> i) & 1);
      return bits;
    }

    const bits = [];
    bits.push(...toBits(sw, 16), ...toBits(sh, 16));
    for (let i = 0; i < secPixels.length; i += 4) {
      bits.push(...toBits(secPixels[i], 8));
      bits.push(...toBits(secPixels[i+1], 8));
      bits.push(...toBits(secPixels[i+2], 8));
    }

    let idx = 0;
    for (let i = 0; i < coverPixels.length; i += 4) {
      if (idx < bits.length) coverPixels[i] = (coverPixels[i] & 0xFE) | bits[idx++];
      if (idx < bits.length) coverPixels[i+1] = (coverPixels[i+1] & 0xFE) | bits[idx++];
      if (idx < bits.length) coverPixels[i+2] = (coverPixels[i+2] & 0xFE) | bits[idx++];
      if (idx >= bits.length) break;
    }

    const outCanvas = document.createElement('canvas'); outCanvas.width = cw; outCanvas.height = ch;
    outCanvas.getContext('2d').putImageData(new ImageData(coverPixels, cw, ch), 0, 0);
    return outCanvas.toDataURL('image/png');
  }

  // LSB 提取
  function extractLSB(imageData, w, h) {
    const pixels = imageData.data;
    const bits = [];
    for (let i = 0; i < pixels.length; i += 4) {
      bits.push(pixels[i] & 1, pixels[i+1] & 1, pixels[i+2] & 1);
    }
    function readBits(arr, start, len) {
      let val = 0;
      for (let i = 0; i < len; i++) val = (val << 1) | arr[start + i];
      return val;
    }
    if (bits.length < 32) throw new Error('图片无隐藏数据');
    const sw = readBits(bits, 0, 16);
    const sh = readBits(bits, 16, 16);
    const needed = 32 + sw * sh * 24;
    if (bits.length < needed) throw new Error('隐藏数据不完整（可能被压缩）');

    const secCanvas = document.createElement('canvas'); secCanvas.width = sw; secCanvas.height = sh;
    const sctx = secCanvas.getContext('2d');
    const imgData = sctx.createImageData(sw, sh);
    const dp = imgData.data;
    let pos = 32;
    for (let i = 0; i < dp.length; i += 4) {
      if (pos + 24 > bits.length) break;
      dp[i]   = readBits(bits, pos, 8); pos += 8;
      dp[i+1] = readBits(bits, pos, 8); pos += 8;
      dp[i+2] = readBits(bits, pos, 8); pos += 8;
      dp[i+3] = 255;
    }
    sctx.putImageData(imgData, 0, 0);
    return secCanvas.toDataURL('image/png');
  }

  embedBtn.addEventListener('click', () => {
    if (!carrierImg || !secretImg) return;
    try {
      const url = embedLSB(carrierImg, secretImg);
      const embedRes = container.querySelector('#stegoEmbedResult');
      const extractRes = container.querySelector('#stegoExtractResult');
      embedRes.classList.add('show');
      extractRes.classList.remove('show');
      container.querySelector('#stegoEmbedPreview').src = url;
      container.querySelector('#stegoDownloadBtn').href = url;
      embedRes.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('🔐 隐藏成功！请下载PNG并原图传输');
    } catch (e) { showToast('❌ ' + e.message); }
  });

  container.querySelector('#stegoExtractBtn').addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const img = await loadImageFromFile(file);
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const secretUrl = extractLSB(imageData, img.width, img.height);
        const extractRes = container.querySelector('#stegoExtractResult');
        const embedRes = container.querySelector('#stegoEmbedResult');
        extractRes.classList.add('show');
        embedRes.classList.remove('show');
        container.querySelector('#stegoExtractPreview').src = secretUrl;
        container.querySelector('#stegoExtractDownloadBtn').href = secretUrl;
        extractRes.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('🔓 提取成功！');
      } catch (e) { showToast('❌ ' + e.message); }
    };
    fileInput.click();
  });
}
