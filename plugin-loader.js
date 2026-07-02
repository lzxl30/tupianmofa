// 嵌入成功后
const embedRes = container.querySelector('#stegoEmbedResult');
// 清除旧的下载UI
const oldEmbedUI = embedRes.querySelector('.download-ui-container');
if (oldEmbedUI) oldEmbedUI.remove();
const embedUIContainer = document.createElement('div');
embedUIContainer.className = 'download-ui-container';
embedRes.appendChild(embedUIContainer);
createDownloadUI(embedUIContainer, url, 'hidden_image.png');

// 提取成功后类似
const extractRes = container.querySelector('#stegoExtractResult');
const oldExtractUI = extractRes.querySelector('.download-ui-container');
if (oldExtractUI) oldExtractUI.remove();
const extractUIContainer = document.createElement('div');
extractUIContainer.className = 'download-ui-container';
extractRes.appendChild(extractUIContainer);
createDownloadUI(extractUIContainer, secretUrl, 'extracted_secret.png');
