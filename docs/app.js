const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

// Icon definitions used to build Contents.json + generated images
// Each entry: idiom, size (point or px string), scales array
const ICON_DEFINITIONS = [
  // iPhone
  { idiom: 'iphone', size: '20x20', scales: ['2x','3x'] },
  { idiom: 'iphone', size: '29x29', scales: ['2x','3x'] },
  { idiom: 'iphone', size: '40x40', scales: ['2x','3x'] },
  { idiom: 'iphone', size: '60x60', scales: ['2x','3x'] },
  // iPad
  { idiom: 'ipad', size: '20x20', scales: ['1x','2x'] },
  { idiom: 'ipad', size: '29x29', scales: ['1x','2x'] },
  { idiom: 'ipad', size: '40x40', scales: ['1x','2x'] },
  { idiom: 'ipad', size: '76x76', scales: ['1x','2x'] },
  { idiom: 'ipad', size: '83.5x83.5', scales: ['2x'] },
  // App Store / marketing
  { idiom: 'ios-marketing', size: '1024x1024', scales: ['1x'] },
  // macOS (include 1x + 2x entries commonly used in asset catalogs)
  { idiom: 'mac', size: '16x16', scales: ['1x','2x'] },
  { idiom: 'mac', size: '32x32', scales: ['1x','2x'] },
  { idiom: 'mac', size: '128x128', scales: ['1x','2x'] },
  { idiom: 'mac', size: '256x256', scales: ['1x','2x'] },
  { idiom: 'mac', size: '512x512', scales: ['1x','2x'] },
  // watchOS (common sizes)
  { idiom: 'watch', size: '48x48', scales: ['2x'] },
  { idiom: 'watch', size: '55x55', scales: ['2x'] },
  { idiom: 'watch', size: '86x86', scales: ['2x'] },
  { idiom: 'watch', size: '98x98', scales: ['2x'] },
  // tvOS (common sizes) — included so Xcode recognizes tv images if used in a universal asset
  { idiom: 'tv', size: '400x240', scales: ['1x'] },
  { idiom: 'tv', size: '1280x768', scales: ['1x'] },
  // visionOS — include a complete set of standard 2D icon sizes used by asset catalogs
  // NOTE: these cover common sizes (1x/2x) used by Xcode's App Icon (Vision) slots.
  { idiom: 'vision', size: '16x16', scales: ['1x','2x'] },
  { idiom: 'vision', size: '32x32', scales: ['1x','2x'] },
  { idiom: 'vision', size: '64x64', scales: ['1x','2x'] },
  { idiom: 'vision', size: '128x128', scales: ['1x','2x'] },
  { idiom: 'vision', size: '256x256', scales: ['1x','2x'] },
  { idiom: 'vision', size: '512x512', scales: ['1x','2x'] },
  { idiom: 'vision', size: '1024x1024', scales: ['1x'] }
];

// DOM
const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const generateBtn = document.getElementById('generateBtn');
const statusEl = document.getElementById('status');
const previewCard = document.getElementById('previewCard');
const previewGrid = document.getElementById('previewGrid');
const cropModeSelect = document.getElementById('cropMode');

const themeCheckbox = document.getElementById('themeCheckbox');
const themeLabel = document.getElementById('themeLabel');

const platIos = document.getElementById('plat-ios');
const platIpad = document.getElementById('plat-ipad');
const platMac = document.getElementById('plat-mac');
const platWatch = document.getElementById('plat-watch');
const platTv = document.getElementById('plat-tv');
const platVision = document.getElementById('plat-vision');
const platVisionStack = document.getElementById('plat-vision-stack');

let selectedFile = null;

// ---------------- Theme ----------------
function applyTheme(theme) {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  themeCheckbox.checked = (theme === 'dark');
  themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
}

function initTheme() {
  const saved = localStorage.getItem('assetic:theme');
  if (saved) { applyTheme(saved); return; }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

themeCheckbox.addEventListener('change', () => {
  const theme = themeCheckbox.checked ? 'dark' : 'light';
  applyTheme(theme);
  localStorage.setItem('assetic:theme', theme);
});
initTheme();

// ---------------- Utilities ----------------
function setStatus(msg, isError = false) {
  statusEl.textContent = msg || '';
  statusEl.style.color = isError ? 'var(--danger)' : '';
}

function humanBytes(n) {
  if (!n) return '0 B';
  const u = ['B','KB','MB','GB']; let i = 0; while (n >= 1024 && i < u.length-1) { n/=1024; i++; }
  return `${n.toFixed(n >= 100 ? 0 : 1)} ${u[i]}`;
}

// parse sizes like "20x20" or "83.5x83.5" or "400x240"
function parseSize(sizeStr) {
  const [w,h] = sizeStr.split('x').map(s => parseFloat(s));
  return { w, h };
}

// Create filename consistent with Xcode-style naming
function makeFilename(sizeStr, scale) {
  // example: AppIcon-20x20@2x.png or AppIcon-1024x1024@1x.png
  return `AppIcon-${sizeStr}@${scale}.png`;
}

async function loadImageBitmap(file) {
  // try createImageBitmap first (fast)
  if (window.createImageBitmap) {
    try {
      const bitmap = await createImageBitmap(file);
      return bitmap;
    } catch (err) {
      // fallthrough to Image-based loader
    }
  }

  // fallback for older browsers
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // draw into canvas to make an ImageBitmap-like object
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      // convert to ImageBitmap where available
      if (window.createImageBitmap) createImageBitmap(c).then(resolve, () => resolve(c));
      else resolve(c);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(canvas, type = 'image/png') {
  return new Promise((resolve) => canvas.toBlob(resolve, type));
}

function drawToCanvas(source, sw, sh, targetW, targetH, mode = 'cover') {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(targetW);
  canvas.height = Math.round(targetH);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // source may be ImageBitmap or HTMLCanvasElement
  const srcW = sw;
  const srcH = sh;
  const targetAspect = targetW / targetH;
  const srcAspect = srcW / srcH;

  if (mode === 'contain') {
    // fit inside canvas and leave transparent letterbox
    let dw = canvas.width;
    let dh = canvas.height;
    if (srcAspect > targetAspect) {
      // image is wider, fit by width
      dh = Math.round(canvas.width / srcAspect);
    } else {
      // fit by height
      dw = Math.round(canvas.height * srcAspect);
    }
    const dx = Math.round((canvas.width - dw) / 2);
    const dy = Math.round((canvas.height - dh) / 2);
    ctx.drawImage(source, 0, 0, srcW, srcH, dx, dy, dw, dh);
  } else {
    // cover (center-crop)
    let sx = 0, sy = 0, sWidth = srcW, sHeight = srcH;
    if (srcAspect > targetAspect) {
      // source wider — crop horizontally
      sWidth = Math.round(srcH * targetAspect);
      sx = Math.round((srcW - sWidth) / 2);
    } else {
      // source taller — crop vertically
      sHeight = Math.round(srcW / targetAspect);
      sy = Math.round((srcH - sHeight) / 2);
    }
    ctx.drawImage(source, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

// ---------------- UI handlers ----------------
fileInput.addEventListener('change', (ev) => {
  const f = ev.target.files && ev.target.files[0];
  handleFileSelection(f);
});

['dragenter','dragover'].forEach(evt => {
  dropArea.addEventListener(evt, (e) => { e.preventDefault(); dropArea.classList.add('drag'); });
});
['dragleave','drop'].forEach(evt => {
  dropArea.addEventListener(evt, (e) => { e.preventDefault(); dropArea.classList.remove('drag'); });
});

dropArea.addEventListener('drop', (e) => {
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  handleFileSelection(f);
});

function handleFileSelection(file) {
  selectedFile = null;
  previewGrid.innerHTML = '';
  previewCard.hidden = true;
  setStatus('');

  if (!file) {
    generateBtn.disabled = true;
    return;
  }

  if (!file.type || !file.type.startsWith('image/')) {
    setStatus('Unsupported file type — please select an image.', true);
    generateBtn.disabled = true;
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    setStatus(`File too large — max ${humanBytes(MAX_FILE_SIZE)}.`, true);
    generateBtn.disabled = true;
    return;
  }

  // warn for animated GIFs (we'll only use first frame)
  if (file.type === 'image/gif') {
    setStatus('Animated GIF detected — only the first frame will be used.');
  } else {
    setStatus('Ready — click "Generate ZIP" to create your AppIcon.appiconset.');
  }

  selectedFile = file;
  generateBtn.disabled = false;
}

// Build list of targets depending on platform selections
function buildTargets() {
  const targets = [];
  const enabled = (d) => {
    if (d.idiom === 'iphone') return platIos.checked;
    if (d.idiom === 'ipad') return platIpad.checked;
    if (d.idiom === 'mac') return platMac.checked;
    if (d.idiom === 'watch') return platWatch.checked;
    if (d.idiom === 'tv') return platTv.checked;
    if (d.idiom === 'vision') return platVision.checked;
    if (d.idiom === 'ios-marketing') return platIos.checked || platIpad.checked || platMac.checked || platVision.checked;
    return true;
  };

  for (const def of ICON_DEFINITIONS) {
    if (!enabled(def)) continue;
    for (const scale of def.scales) {
      targets.push({ idiom: def.idiom, size: def.size, scale });
    }
  }
  return targets;
}

// Generate all images, create Contents.json and ZIP
async function generateAppIconZip() {
  if (!selectedFile) return;
  generateBtn.disabled = true;
  setStatus('Loading image...');

  // helper: GA4 event push (no-op if gtag not present)
  function trackGenerateEvent(platforms, visionStack, cropMode) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'generate_zip', {
          platforms: platforms.join(','),
          vision_stack: !!visionStack,
          crop_mode: cropMode
        });
      }
    } catch (err) {
      // fail silently if analytics blocked
      console.debug('gtag event failed', err);
    }
  }


  let source;
  try {
    source = await loadImageBitmap(selectedFile);
  } catch (err) {
    console.error(err);
    setStatus('Could not read the image. Try a different file.', true);
    generateBtn.disabled = false;
    return;
  }

  const cropMode = cropModeSelect.value || 'cover';
  const targets = buildTargets();
  if (!targets.length) {
    setStatus('No platforms selected.', true);
    generateBtn.disabled = false;
    return;
  }

  setStatus('Generating images...');
  previewGrid.innerHTML = '';
  previewCard.hidden = false;

  const zip = new JSZip();
  const folder = zip.folder('AppIcon.appiconset');
  const contents = { images: [], info: { version: 1, author: 'xcode' } };

  // cache blobs for identical pixel sizes to avoid duplicate canvas work
  const generatedCache = new Map(); // key -> {blob, url}

  for (const t of targets) {
    const { w: wPt, h: hPt } = parseSize(t.size);
    const scaleNum = parseInt(t.scale.replace('x',''), 10) || 1;
    const pxW = Math.round(wPt * scaleNum);
    const pxH = Math.round(hPt * scaleNum);
    const filename = makeFilename(t.size, t.scale);

    const cacheKey = `${pxW}x${pxH}`;
    let blobEntry = generatedCache.get(cacheKey);
    if (!blobEntry) {
      // draw and create blob
      const canvas = drawToCanvas(source, source.width || source.naturalWidth, source.height || source.naturalHeight, pxW, pxH, cropMode);
      // warn when upscaling
      if ((source.width || source.naturalWidth) < pxW || (source.height || source.naturalHeight) < pxH) {
        // show a brief warning in status (don't override fatal errors)
        setStatus(`Note: some images are being upscaled (source smaller than target). Results may be blurry.`);
      }
      // convert to PNG blob
      // use 0.92 quality for png (ignored) — PNG is lossless
      // canvasToBlob returns null only on failure
      const blob = await canvasToBlob(canvas, 'image/png');
      const url = URL.createObjectURL(blob);
      blobEntry = { blob, url };
      generatedCache.set(cacheKey, blobEntry);
    }

    // Add the blob to the zip under AppIcon.appiconset/<filename>
    folder.file(filename, blobEntry.blob);

    // Add entry to Contents.json
    contents.images.push({ idiom: t.idiom, size: t.size, filename, scale: t.scale });

    // Add preview tile
    const tile = document.createElement('div');
    tile.className = 'preview-item';
    const img = document.createElement('img');
    img.src = blobEntry.url;
    img.alt = `${filename}`;
    const fname = document.createElement('div'); fname.className = 'fname'; fname.textContent = filename;
    const sizeText = document.createElement('div'); sizeText.className = 'size'; sizeText.textContent = `${pxW}×${pxH}`;
    tile.appendChild(img);
    tile.appendChild(sizeText);
    tile.appendChild(fname);
    previewGrid.appendChild(tile);
  }

  // add Contents.json for the appicon set
  folder.file('Contents.json', JSON.stringify(contents, null, 2));

  // Optional: generate a visionOS Solid Image Stack export (best-effort)
  if (platVision.checked && platVisionStack && platVisionStack.checked) {
    setStatus('Generating visionOS solid image stack (optional)...');
    try {
      // create the solid image stack at the ZIP root (sibling to AppIcon.appiconset)
      await addSolidImageStackToZip(zip, source);
      setStatus('Included AppIcon.solidimagestack (optional)');
    } catch (err) {
      console.error(err);
      setStatus('Failed to generate solid image stack (optional).', true);
    }
  }

  setStatus('Creating zip…');
  try {
    const zblob = await zip.generateAsync({ type: 'blob' });

    // Analytics: track successful generation (GA4 event via gtag)
    const selectedPlatforms = [];
    if (platIos.checked) selectedPlatforms.push('iOS');
    if (platIpad.checked) selectedPlatforms.push('iPadOS');
    if (platMac.checked) selectedPlatforms.push('macOS');
    if (platWatch.checked) selectedPlatforms.push('watchOS');
    if (platTv.checked) selectedPlatforms.push('tvOS');
    if (platVision.checked) selectedPlatforms.push('visionOS');

    trackGenerateEvent(selectedPlatforms, platVisionStack && platVisionStack.checked, cropMode);

    saveAs(zblob, 'AppIcon.appiconset.zip');
    setStatus('Done — downloaded AppIcon.appiconset.zip');
  } catch (err) {
    console.error(err);
    // Analytics: optional failure event
    try { if (typeof window.gtag === 'function') window.gtag('event', 'generate_zip_failed', { crop_mode: cropMode, vision_stack: platVisionStack && platVisionStack.checked }); } catch(e){}
    setStatus('Failed to create ZIP.', true);
  } finally {
    generateBtn.disabled = false;
  }
}

// Best-effort: create a simple AppIcon.solidimagestack package with layered PNGs.
// This creates layer images (back->front) at 1024@1x and 2048@2x and a minimal Contents.json.
async function addSolidImageStackToZip(zipRoot, source) {
  const stackFolder = zipRoot.folder('AppIcon.solidimagestack');
  const layers = 3;
  const baseSize = 1024; // primary surface size for solid stack
  const scales = [1, 2];

  const imagesEntries = [];

  for (const scaleNum of scales) {
    const px = Math.round(baseSize * scaleNum);
    for (let i = 0; i < layers; i++) {
      const layerIndex = i + 1; // 1..layers
      // compute visual parameters for each layer (back = more blur + smaller)
      const shrink = 1 - (layers - layerIndex) * 0.04; // 0.92, 0.96, 1.0 for 3 layers
      const blur = (layers - layerIndex) * (6 * scaleNum); // stronger blur for back layers
      const canvas = drawToCanvas(source, source.width || source.naturalWidth, source.height || source.naturalHeight, px * shrink, px * shrink, 'cover');
      // if shrink != 1, draw canvas smaller and center on final canvas
      if (Math.abs(shrink - 1) > 0.001) {
        const final = document.createElement('canvas');
        final.width = px; final.height = px;
        const ctx = final.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0,0,px,px);
        // apply blur via ctx.filter where supported
        ctx.filter = `blur(${blur}px)`;
        const dw = Math.round(px * shrink);
        const dh = Math.round(px * shrink);
        const dx = Math.round((px - dw) / 2);
        const dy = Math.round((px - dh) / 2);
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, dx, dy, dw, dh);
        // reset filter
        ctx.filter = 'none';
        const blob = await canvasToBlob(final, 'image/png');
        const fname = `layer-${layerIndex}@${scaleNum}x.png`;
        stackFolder.file(fname, blob);
        imagesEntries.push({ idiom: 'vision', filename: fname, scale: `${scaleNum}x`, layer: layerIndex });
      } else {
        // no shrink — draw full canvas and optionally blur
        const ctxCanvas = canvas;
        const ctx = ctxCanvas.getContext('2d');
        if (blur > 0) {
          // apply blur by drawing into a temporary canvas with filter
          const tmp = document.createElement('canvas'); tmp.width = px; tmp.height = px;
          const tctx = tmp.getContext('2d');
          tctx.filter = `blur(${blur}px)`;
          tctx.drawImage(ctxCanvas, 0, 0, px, px);
          const blob = await canvasToBlob(tmp, 'image/png');
          const fname = `layer-${layerIndex}@${scaleNum}x.png`;
          stackFolder.file(fname, blob);
          imagesEntries.push({ idiom: 'vision', filename: fname, scale: `${scaleNum}x`, layer: layerIndex });
        } else {
          const blob = await canvasToBlob(ctxCanvas, 'image/png');
          const fname = `layer-${layerIndex}@${scaleNum}x.png`;
          stackFolder.file(fname, blob);
          imagesEntries.push({ idiom: 'vision', filename: fname, scale: `${scaleNum}x`, layer: layerIndex });
        }
      }
    }
  }

  // Minimal Contents.json — Xcode's exact solidimagestack schema is not publicly documented,
  // so this is a best-effort descriptor that provides the layer files. If Xcode does not
  // recognise it directly, the layer PNGs can be imported manually into a Solid Image Stack asset.
  const stackContents = {
    images: imagesEntries,
    info: { version: 1, author: 'assetic' },
    properties: { generator: 'assetic', type: 'solid-image-stack', layers }
  };

  stackFolder.file('Contents.json', JSON.stringify(stackContents, null, 2));
}


generateBtn.addEventListener('click', () => generateAppIconZip());

// initialize small demo state if user drops none
setStatus('Select or drop an image to get started.');
