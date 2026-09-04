import { Presentation } from '../types/presentation';
import { SAMPLE_PRESENTATION } from '../constants/samplePresentation';

const STORAGE_KEY = 'slidecast_presentation_data';
const DB_NAME = 'SlideCast_Audio_DB';
const DB_VERSION = 1;
const STORE_NAME = 'audio_blobs';

// Open or initialize IndexedDB for audio caching
function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save audio blob into IndexedDB cache
export async function cacheAudioBlob(cacheKey: string, blob: Blob): Promise<void> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, cacheKey);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to cache audio in IndexedDB:', err);
  }
}

// Retrieve audio blob from IndexedDB cache
export async function getCachedAudioBlob(cacheKey: string): Promise<Blob | null> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(cacheKey);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Clear all audio cache
export async function clearAudioCache(): Promise<void> {
  try {
    const db = await openAudioDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (err) {
    console.warn('Error clearing audio cache:', err);
  }
}

// Save presentation state to localStorage
export function savePresentationToStorage(presentation: Presentation): void {
  try {
    // Avoid saving ephemeral blob URLs in localStorage
    const serializable: Presentation = {
      ...presentation,
      slides: presentation.slides.map(slide => {
        const { audioBlobUrl, ...rest } = slide;
        return rest as any;
      }),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

// Load presentation state from localStorage
export function loadPresentationFromStorage(): Presentation {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved presentation:', e);
  }
  return SAMPLE_PRESENTATION;
}

export const loadPresentation = (fallback?: Presentation): Presentation => {
  const loaded = loadPresentationFromStorage();
  return loaded || fallback || SAMPLE_PRESENTATION;
};

export const savePresentation = savePresentationToStorage;

// Download presentation as JSON
export function exportPresentationAsJSON(presentation: Presentation): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(presentation, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${presentation.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'presentation'}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Export presentation as Standalone HTML file
export function exportPresentationAsHTML(presentation: Presentation): void {
  const slidesHtml = presentation.slides.map((slide, i) => {
    return `
      <section class="slide" id="slide-${i + 1}" style="display: ${i === 0 ? 'flex' : 'none'};">
        <div class="slide-content">
          <h2>${slide.title}</h2>
          <p class="script-note"><strong>Script:</strong> ${slide.script}</p>
        </div>
      </section>
    `;
  }).join('\n');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${presentation.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; height: 100vh; display: flex; flex-direction: column; }
    header { padding: 16px 24px; background: #1e293b; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
    main { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; }
    .slide { width: 90%; max-width: 1200px; aspect-ratio: 16/9; background: #1e293b; border-radius: 12px; padding: 48px; border: 1px solid #475569; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    h2 { font-size: 2.5rem; margin-bottom: 24px; color: #818cf8; }
    .script-note { font-size: 1.1rem; color: #94a3b8; line-height: 1.6; }
    .controls { padding: 16px; background: #1e293b; display: flex; justify-content: center; gap: 16px; border-top: 1px solid #334155; }
    button { background: #6366f1; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    button:hover { background: #4f46e5; }
  </style>
</head>
<body>
  <header>
    <h1>${presentation.title}</h1>
    <span id="counter">Slide 1 of ${presentation.slides.length}</span>
  </header>
  <main>
    ${slidesHtml}
  </main>
  <div class="controls">
    <button onclick="prevSlide()">← Previous</button>
    <button onclick="nextSlide()">Next →</button>
  </div>
  <script>
    let current = 0;
    const slides = document.querySelectorAll('.slide');
    const total = slides.length;
    function update() {
      slides.forEach((s, idx) => s.style.display = idx === current ? 'flex' : 'none');
      document.getElementById('counter').innerText = 'Slide ' + (current + 1) + ' of ' + total;
    }
    function nextSlide() { if (current < total - 1) { current++; update(); } }
    function prevSlide() { if (current > 0) { current--; update(); } }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    });
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${presentation.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'presentation'}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
