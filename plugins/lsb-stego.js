registerPlugin({
  id: 'lsb-stego',
  name: 'LSB隐写术',
  icon: '🔐',
  render(container) {
    container.innerHTML = `
      <h2>🔐 LSB 隐写术</h2>
      <p style="color:var(--text2);margin-bottom:20px;">
        将秘密图片藏进普通载体图中，肉眼无法分辨。提取时需要原图（PNG无损）。
      </p>
      <div class="upload-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
        <div class="upload-zone" id="stegoCarrierZone">
          <span class="placeholder-icon">📷</span>
          <span class="label-text">上传载体图片（表面图）</span>
          <input type="file" accept="image/*" id="stegoCarrierInput" style="display:none;">
          <button class="clear-btn">✕</button>
        </div>
        <div class="upload-zone" id="stegoSecretZone">
          <span class="placeholder-icon">🔒</span>
          <span class="label-text">上传秘密图片</span>
          <input type="file" accept="image/*" id="stegoSecretInput" style="display:none;">
          <button class="clear-btn">✕</button>
        </div>
      </div>
      <div style="text-align:center;margin:20px 0;">
        <button class="btn btn-primary" id="stegoEmbedBtn" disabled>🔐 隐藏图片</button>
        <button class="btn btn-accent" id="stegoExtractBtn">🔍 提取隐藏图片</button>
      </div>
      <div class="result-area" id="stegoEmbedResult" style="display:none;">
        <p style="color:var(--accent2);">✅ 隐藏成功！含密图片（表面看不出）</p>
        <img id="stegoEmbedPreview" style="max-width:250px; border-radius:8px;">
        <div style="margin-top:10px;">
          <a class="btn btn-accent" id="stegoDownloadBtn" download="hidden_image.png">⬇️ 下载含密图片</a>
        </div>
      </div>
      <div class="result-area" id="stegoExtractResult" style="display:none;">
        <p style="color:var(--accent2);">🔓 提取成功！隐藏的图片：</p>
        <img id="stegoExtractPreview" style="max-width:250px; border-radius:8px;">
        <div style="margin-top:10px;">
          <a class="btn btn-accent" id="stegoExtractDownloadBtn" download="extracted_secret.png">⬇️ 下载提取的图片</a>
        </div>
      </div>
      <div class="tip-bar">
        ⚠️ <strong>重要：</strong>含密图片必须保持PNG格式，传输时勾选“原图”，JPEG压缩会破坏数据！
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
        const oldImg = zone.querySelector('img');
        if (oldImg) oldImg.remove();
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

  let carrierImg = null, secretImg = null;
  setupUpload('stegoCarrierZone', 'stegoCarrierInput', '.clear-btn', (img) => { carrierImg = img; updateBtn(); });
  setupUpload('stegoSecretZone', 'stegoSecretInput', '.clear-btn', (img) => { secretImg = img; updateBtn(); });

  const embedBtn = container.querySelector('#stegoEmbedBtn');
  function updateBtn() { embedBtn.disabled = !(carrierImg && secretImg); }

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
      sw = Math.floor(sw * scale);
      sh = Math.floor(sh * scale);
      if (sw < 1) sw = 1;
      if (sh < 1) sh = 1;
      const tmp = document.createElement('canvas'); tmp.width = sw; tmp.height = sh;
      const tCtx = tmp.getContext('2d'); tCtx.drawImage(secret, 0, 0, sw, sh);
      secPixels = tCtx.getImageData(0, 0, sw, sh).data;
    } else {
      const sc = document.createElement('canvas'); sc.width = sw; sc.height = sh;
      const sCtx = sc.getContext('2d'); sCtx.drawImage(secret, 0, 0);
      secPixels = sCtx.getImageData(0, 0, sw, sh).data;
    }
    const needed = 32 + sw * sh * 24;
    if (needed > cw * ch * 3) throw new Error('载体太小，请选择更大的载体图或更小的秘密图');
    function toBits(num, len) { const b = []; for (let i = len - 1; i >= 0; i--) b.push((num >> i) & 1); return b; }
    const bits = [];
    bits.push(...toBits(sw, 16), ...toBits(sh, 16));
    for (let i = 0; i < secPixels.length; i += 4) {
      bits.push(...toBits(secPixels[i], 8), ...toBits(secPixels[i + 1], 8), ...toBits(secPixels[i + 2], 8));
    }
    let idx = 0;
    for (let i = 0; i < coverPixels.length; i += 4) {
      if (idx < bits.length) coverPixels[i] = (coverPixels[i] & 0xFE) | bits[idx++];
      if (idx < bits.length) coverPixels[i + 1] = (coverPixels[i + 1] & 0xFE) | bits[idx++];
      if (idx < bits.length) coverPixels[i + 2] = (coverPixels[i + 2] & 0xFE) | bits[idx++];
    }
    const out = document.createElement('canvas'); out.width = cw; out.height = ch;
    out.getContext('2d').putImageData(new ImageData(coverPixels, cw, ch), 0, 0);
    return out.toDataURL('image/png');
  }

  function extractLSB(imageData, w, h) {
    const pixels = imageData.data;
    const bits = [];
    for (let i = 0; i < pixels.length; i += 4) {
      bits.push(pixels[i] & 1, pixels[i + 1] & 1, pixels[i + 2] & 1);
    }
    function read(arr, start, len) { let v = 0; for (let i = 0; i < len; i++) v = (v << 1) | arr[start + i]; return v; }
    if (bits.length < 32) throw new Error('无隐藏数据');
    const sw = read(bits, 0, 16), sh = read(bits, 16, 16);
    const needed = 32 + sw * sh * 24;
    if (bits.length < needed) throw new Error('数据不完整，可能被压缩');
    const sc = document.createElement('canvas'); sc.width = sw; sc.height = sh;
    const sctx = sc.getContext('2d');
    const imgData = sctx.createImageData(sw, sh);
    const dp = imgData.data;
    let pos = 32;
    for (let i = 0; i < dp.length; i += 4) {
      if (pos + 24 > bits.length) break;
      dp[i] = read(bits, pos, 8); pos += 8;
      dp[i + 1] = read(bits, pos, 8); pos += 8;
      dp[i + 2] = read(bits, pos, 8); pos += 8;
      dp[i + 3] = 255;
    }
    sctx.putImageData(imgData, 0, 0);
    return sc.toDataURL('image/png');
  }

  embedBtn.addEventListener('click', () => {
    if (!carrierImg || !secretImg) return;
    try {
      const url = embedLSB(carrierImg, secretImg);
      const embedRes = container.querySelector('#stegoEmbedResult');
      const extractRes = container.querySelector('#stegoExtractResult');
      embedRes.style.display = 'block';
      extractRes.style.display = 'none';
      container.querySelector('#stegoEmbedPreview').src = url;
      container.querySelector('#stegoDownloadBtn').href = url;
      embedRes.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('🔐 隐藏成功！');
    } catch (e) { showToast('❌ ' + e.message); }
  });

  container.querySelector('#stegoExtractBtn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const img = await loadImageFromFile(file);
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height);
        const secretUrl = extractLSB(data, img.width, img.height);
        const extractRes = container.querySelector('#stegoExtractResult');
        const embedRes = container.querySelector('#stegoEmbedResult');
        extractRes.style.display = 'block';
        embedRes.style.display = 'none';
        container.querySelector('#stegoExtractPreview').src = secretUrl;
        container.querySelector('#stegoExtractDownloadBtn').href = secretUrl;
        extractRes.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('🔓 提取成功！');
      } catch (e) { showToast('❌ ' + e.message); }
    };
    input.click();
  });
}
