registerPlugin({
  id: 'phantom-tank',
  name: '幻影坦克',
  icon: '🎭',
  badge: '热门',
  render(container) {
    container.innerHTML = `
      <h2>🎭 幻影坦克</h2>
      <p style="color:var(--text2);margin-bottom:20px;">
        生成一张神奇PNG——白色背景下显示表面图，黑色背景下显示隐藏图。
      </p>
      <div class="upload-grid">
        <div class="upload-zone" id="phantomSurfaceZone">
          <span class="placeholder-icon">🏞️</span>
          <span class="label-text">上传表面图（白色背景显示）</span>
          <input type="file" accept="image/*" id="phantomSurfaceInput">
          <button class="clear-btn">✕</button>
        </div>
        <div class="upload-zone" id="phantomHiddenZone">
          <span class="placeholder-icon">👻</span>
          <span class="label-text">上传隐藏图（黑色背景显示）</span>
          <input type="file" accept="image/*" id="phantomHiddenInput">
          <button class="clear-btn">✕</button>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" id="phantomGenerateBtn" disabled>🎭 生成幻影坦克</button>
      </div>
      <div class="result-area" id="phantomResultArea">
        <p style="color:var(--accent2);">✅ 幻影坦克生成成功！</p>
        <div class="phantom-previews">
          <div class="phantom-preview-box light-bg">
            <img id="phantomPreviewLight">
            <div class="bg-label">⬜ 白色背景</div>
          </div>
          <div class="phantom-preview-box dark-bg">
            <img id="phantomPreviewDark">
            <div class="bg-label">⬛ 黑色背景</div>
          </div>
        </div>
        <div class="gradient-slider-container">
          <label>🎚️ 拖动改变背景色</label>
          <input type="range" class="gradient-slider" id="phantomBgSlider" min="0" max="100" value="50">
          <div class="slider-preview" id="phantomSliderPreview">
            <img id="phantomPreviewSlider">
          </div>
        </div>
        <div class="btn-row">
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
  function setupUpload(zoneId, inputId, clearBtnId, onChange) {
    const zone = container.querySelector(`#${zoneId}`);
    const input = container.querySelector(`#${inputId}`);
    const clearBtn = container.querySelector(`#${clearBtnId}`);
    let img = null;

    zone.addEventListener('click', (e) => { if(e.target===clearBtn) return; input.click(); });
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.borderColor='var(--accent)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor='var(--border)'; });
    zone.addEventListener('drop', (e) => {
      e.preventDefault(); zone.style.borderColor='var(--border)';
      const file = e.dataTransfer.files[0];
      if(file && file.type.startsWith('image/')) { input.files = e.dataTransfer.files; input.dispatchEvent(new Event('change')); }
    });
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0]; if(!file) return;
      try {
        const loaded = await loadImageFromFile(file);
        img = loaded;
        const old = zone.querySelector('img'); if(old) old.remove();
        const preview = document.createElement('img'); preview.src = loaded.src;
        preview.style.maxWidth='100%'; preview.style.maxHeight='200px';
        zone.insertBefore(preview, clearBtn);
        zone.classList.add('has-image');
        zone.querySelector('.placeholder-icon').style.display='none';
        zone.querySelector('.label-text').style.display='none';
        clearBtn.style.display='block';
        if(onChange) onChange(loaded);
      } catch { showToast('❌ 图片加载失败'); }
    });
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation(); img = null; input.value = '';
      const old = zone.querySelector('img'); if(old) old.remove();
      zone.classList.remove('has-image');
      zone.querySelector('.placeholder-icon').style.display='';
      zone.querySelector('.label-text').style.display='';
      clearBtn.style.display='none';
      if(onChange) onChange(null);
    });
    return { getImage: () => img };
  }

  let surfaceImg = null, hiddenImg = null;
  setupUpload('phantomSurfaceZone','phantomSurfaceInput','phantomSurfaceClear', (i)=>{ surfaceImg=i; update(); });
  setupUpload('phantomHiddenZone','phantomHiddenInput','phantomHiddenClear', (i)=>{ hiddenImg=i; update(); });

  const genBtn = container.querySelector('#phantomGenerateBtn');
  function update() { genBtn.disabled = !(surfaceImg && hiddenImg); }

  genBtn.addEventListener('click', () => {
    if(!surfaceImg || !hiddenImg) return;
    const w = Math.min(surfaceImg.width, hiddenImg.width);
    const h = Math.min(surfaceImg.height, hiddenImg.height);
    const sc = document.createElement('canvas'); sc.width=w; sc.height=h;
    const sctx = sc.getContext('2d'); sctx.drawImage(surfaceImg,0,0,w,h);
    const sData = sctx.getImageData(0,0,w,h);
    const hc = document.createElement('canvas'); hc.width=w; hc.height=h;
    const hctx = hc.getContext('2d'); hctx.drawImage(hiddenImg,0,0,w,h);
    const hData = hctx.getImageData(0,0,w,h);
    const out = new ImageData(w,h);
    const sp=sData.data, hp=hData.data, op=out.data;
    for(let i=0;i<sp.length;i+=4) {
      const sR=sp[i], sG=sp[i+1], sB=sp[i+2];
      const hR=hp[i], hG=hp[i+1], hB=hp[i+2];
      const lumS = 0.299*sR+0.587*sG+0.114*sB;
      const lumH = 0.299*hR+0.587*hG+0.114*hB;
      let alpha = Math.round(255 + lumH - lumS);
      alpha = Math.max(0, Math.min(255, alpha));
      if(alpha>0) {
        op[i] = Math.min(255, Math.round((hR*255)/alpha));
        op[i+1] = Math.min(255, Math.round((hG*255)/alpha));
        op[i+2] = Math.min(255, Math.round((hB*255)/alpha));
      } else { op[i]=op[i+1]=op[i+2]=0; }
      op[i+3]=alpha;
    }
    const outCanvas = document.createElement('canvas'); outCanvas.width=w; outCanvas.height=h;
    outCanvas.getContext('2d').putImageData(out,0,0);
    const dataUrl = outCanvas.toDataURL('image/png');

    const resultArea = container.querySelector('#phantomResultArea');
    resultArea.classList.add('show');
    container.querySelector('#phantomPreviewLight').src = dataUrl;
    container.querySelector('#phantomPreviewDark').src = dataUrl;
    container.querySelector('#phantomPreviewSlider').src = dataUrl;
    container.querySelector('#phantomDownloadBtn').href = dataUrl;
    container.querySelector('#phantomBgSlider').value = 50;
    container.querySelector('#phantomSliderPreview').style.backgroundColor = 'rgb(127,127,127)';
    resultArea.scrollIntoView({ behavior:'smooth', block:'center' });
    showToast('🎭 幻影坦克生成成功！');
  });

  const slider = container.querySelector('#phantomBgSlider');
  const sliderPrev = container.querySelector('#phantomSliderPreview');
  slider.addEventListener('input', () => {
    const val = parseInt(slider.value);
    const gray = 255 - Math.round((val/100)*255);
    sliderPrev.style.backgroundColor = `rgb(${gray},${gray},${gray})`;
  });

  container.querySelector('#phantomRetryBtn').addEventListener('click', () => {
    container.querySelector('#phantomResultArea').classList.remove('show');
  });

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => { const img=new Image(); img.onload=()=>resolve(img); img.onerror=reject; img.src=e.target.result; };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
