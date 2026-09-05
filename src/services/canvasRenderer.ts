import { Slide, SlideElement, MasterSlide, TransitionType, TextElement, ShapeElement, ImageElement, TableElement, IconElement, CaptionSettings, KenBurnsSettings } from '../types/presentation';

// Cache for loaded HTML images
const imageCache = new Map<string, HTMLImageElement>();

export function getOrLoadImage(src: string): HTMLImageElement | null {
  if (imageCache.has(src)) {
    const img = imageCache.get(src)!;
    return img.complete ? img : null;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  imageCache.set(src, img);
  return null;
}

// Preload all images used in a presentation
export async function preloadPresentationImages(slides: Slide[]): Promise<void> {
  const urls: string[] = [];
  for (const slide of slides) {
    if (slide.background.imageUrl) urls.push(slide.background.imageUrl);
    for (const el of slide.elements) {
      if (el.type === 'image' && el.src) urls.push(el.src);
    }
  }

  const promises = urls.map(url => {
    return new Promise<void>((resolve) => {
      if (imageCache.has(url) && imageCache.get(url)!.complete) {
        resolve();
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCache.set(url, img);
        resolve();
      };
      img.onerror = () => {
        resolve(); // Gracefully proceed even if image fails
      };
      img.src = url;
    });
  });

  await Promise.all(promises);
}

// Render background for a slide
export function renderSlideBackground(
  ctx: CanvasRenderingContext2D,
  slide: Slide,
  width: number,
  height: number,
  kenBurnsProgress?: number
): void {
  const bg = slide.background;
  ctx.save();

  // Apply subtle Ken Burns camera motion if enabled
  if (slide.kenBurns?.enabled && kenBurnsProgress !== undefined) {
    const p = Math.max(0, Math.min(1, kenBurnsProgress));
    const effect = slide.kenBurns.effect || 'zoom-in';
    const intensity = slide.kenBurns.intensity || 1.10;
    ctx.translate(width / 2, height / 2);

    if (effect === 'zoom-in') {
      const s = 1.0 + (intensity - 1.0) * p;
      ctx.scale(s, s);
    } else if (effect === 'zoom-out') {
      const s = intensity - (intensity - 1.0) * p;
      ctx.scale(s, s);
    } else if (effect === 'pan-left') {
      ctx.scale(1.08, 1.08);
      ctx.translate((0.03 - 0.06 * p) * width, 0);
    } else if (effect === 'pan-right') {
      ctx.scale(1.08, 1.08);
      ctx.translate((-0.03 + 0.06 * p) * width, 0);
    } else if (effect === 'subtle-drift') {
      const s = 1.0 + 0.06 * p;
      ctx.scale(s, s);
      ctx.translate((-0.015 + 0.03 * p) * width, (-0.01 + 0.02 * p) * height);
    }
    ctx.translate(-width / 2, -height / 2);
  }

  if (bg.type === 'solid') {
    ctx.fillStyle = bg.color || '#0f172a';
    ctx.fillRect(0, 0, width, height);
  } else if (bg.type === 'linear-gradient') {
    const angle = ((bg.gradientAngle ?? 135) * Math.PI) / 180;
    const x1 = width / 2 - (Math.cos(angle) * width) / 2;
    const y1 = height / 2 - (Math.sin(angle) * height) / 2;
    const x2 = width / 2 + (Math.cos(angle) * width) / 2;
    const y2 = height / 2 + (Math.sin(angle) * height) / 2;

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, bg.gradientStart || '#0f172a');
    grad.addColorStop(1, bg.gradientEnd || '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (bg.type === 'radial-gradient') {
    const grad = ctx.createRadialGradient(
      width / 2, height / 2, 50,
      width / 2, height / 2, Math.max(width, height) / 1.5
    );
    grad.addColorStop(0, bg.gradientStart || '#1e1b4b');
    grad.addColorStop(1, bg.gradientEnd || '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (bg.type === 'image' && bg.imageUrl) {
    ctx.fillStyle = bg.color || '#0f172a';
    ctx.fillRect(0, 0, width, height);
    const img = getOrLoadImage(bg.imageUrl);
    if (img && img.complete) {
      if (bg.imageBlur) {
        ctx.filter = `blur(${bg.imageBlur}px)`;
      }
      ctx.drawImage(img, 0, 0, width, height);
      ctx.filter = 'none';
      if (bg.overlayOpacity && bg.overlayOpacity > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${bg.overlayOpacity})`;
        ctx.fillRect(0, 0, width, height);
      }
    }
  } else if (bg.type === 'pattern') {
    ctx.fillStyle = bg.color || '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = bg.patternColor || 'rgba(255, 255, 255, 0.08)';
    ctx.fillStyle = bg.patternColor || 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    if (bg.pattern === 'dots') {
      const spacing = 40;
      for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (bg.pattern === 'grid') {
      const step = 60;
      ctx.beginPath();
      for (let x = 0; x <= width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    } else if (bg.pattern === 'diagonal-stripes') {
      const step = 40;
      ctx.beginPath();
      for (let x = -height; x <= width + height; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x + height, height);
      }
      ctx.stroke();
    }
  }

  ctx.restore();
}

// Render Master Slide overlay (Header, Footer, Page Number, Branding)
export function renderMasterSlide(
  ctx: CanvasRenderingContext2D,
  master: MasterSlide,
  slideIndex: number,
  totalSlides: number,
  width: number,
  height: number,
  scale: number
): void {
  ctx.save();
  ctx.font = `${Math.round(18 * scale)}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.textBaseline = 'middle';

  // Header
  if (master.showHeader && master.headerText) {
    ctx.textAlign = 'left';
    ctx.fillText(master.headerText, 60 * scale, 40 * scale);
  }

  // Branding badge
  if (master.brandingText) {
    ctx.textAlign = 'right';
    ctx.fillText(master.brandingText, width - 60 * scale, 40 * scale);
  }

  // Footer
  if (master.showFooter && master.footerText) {
    ctx.textAlign = 'left';
    ctx.fillText(master.footerText, 60 * scale, height - 40 * scale);
  }

  // Slide Number
  if (master.showSlideNumber) {
    const text = `${slideIndex + 1} / ${totalSlides}`;
    if (master.slideNumberPosition === 'bottom-right') {
      ctx.textAlign = 'right';
      ctx.fillText(text, width - 60 * scale, height - 40 * scale);
    } else if (master.slideNumberPosition === 'bottom-left') {
      ctx.textAlign = 'left';
      ctx.fillText(text, 60 * scale, height - 40 * scale);
    } else {
      ctx.textAlign = 'right';
      ctx.fillText(text, width - 60 * scale, 40 * scale);
    }
  }

  ctx.restore();
}

// Render a single slide element to Canvas
export function renderElement(
  ctx: CanvasRenderingContext2D,
  element: SlideElement,
  scale: number = 1,
  timeInSlide?: number
): void {
  // Check element entrance animation timeline if timeInSlide is provided (live preview / video export)
  if (timeInSlide !== undefined && element.animation && element.animation.type !== 'none') {
    const delay = element.animation.delay || 0;
    const duration = Math.max(0.2, element.animation.duration || 0.6);

    // If currentTime is prior to this element's cue delay, skip rendering
    if (timeInSlide < delay) {
      return;
    }

    // If currently animating in: calculate progress & transform
    if (timeInSlide < delay + duration) {
      const rawProgress = (timeInSlide - delay) / duration;
      // Smooth cubic ease out
      const t = 1 - Math.pow(1 - rawProgress, 3);

      ctx.save();
      const x = element.x * scale;
      const y = element.y * scale;
      const w = element.width * scale;
      const h = element.height * scale;
      const cx = x + w / 2;
      const cy = y + h / 2;

      ctx.translate(cx, cy);
      if (element.rotation) {
        ctx.rotate((element.rotation * Math.PI) / 180);
      }

      const animType = element.animation.type;
      let alphaMultiplier = t;

      if (animType === 'fly-left') {
        ctx.translate(-140 * (1 - t) * scale, 0);
      } else if (animType === 'fly-right') {
        ctx.translate(140 * (1 - t) * scale, 0);
      } else if (animType === 'fly-top') {
        ctx.translate(0, -140 * (1 - t) * scale);
      } else if (animType === 'fly-bottom') {
        ctx.translate(0, 140 * (1 - t) * scale);
      } else if (animType === 'zoom-in') {
        const s = 0.3 + 0.7 * t;
        ctx.scale(s, s);
      } else if (animType === 'bounce-in') {
        const s = rawProgress < 0.7 ? (rawProgress / 0.7) * 1.15 : 1.15 - ((rawProgress - 0.7) / 0.3) * 0.15;
        ctx.scale(s, s);
        alphaMultiplier = Math.min(1, rawProgress * 2);
      } else if (animType === 'rotate-in') {
        ctx.rotate(-45 * (1 - t) * (Math.PI / 180));
        const s = 0.5 + 0.5 * t;
        ctx.scale(s, s);
      }

      ctx.globalAlpha = Math.max(0, Math.min(1, (element.opacity ?? 1) * alphaMultiplier));
      ctx.translate(-cx, -cy);

      if (element.shadowBlur && element.shadowColor) {
        ctx.shadowBlur = element.shadowBlur * scale;
        ctx.shadowOffsetX = (element.shadowOffsetX ?? 0) * scale;
        ctx.shadowOffsetY = (element.shadowOffsetY ?? 4) * scale;
        ctx.shadowColor = element.shadowColor;
      }

      if (element.type === 'text') renderTextElement(ctx, element, x, y, w, h, scale);
      else if (element.type === 'shape') renderShapeElement(ctx, element, x, y, w, h, scale);
      else if (element.type === 'image') renderImageElement(ctx, element, x, y, w, h, scale);
      else if (element.type === 'table') renderTableElement(ctx, element, x, y, w, h, scale);
      else if (element.type === 'icon') renderIconElement(ctx, element, x, y, w, h, scale);

      ctx.restore();
      return;
    }
  }

  ctx.save();

  const x = element.x * scale;
  const y = element.y * scale;
  const w = element.width * scale;
  const h = element.height * scale;
  const cx = x + w / 2;
  const cy = y + h / 2;

  // Rotation & Opacity
  ctx.translate(cx, cy);
  if (element.rotation) {
    ctx.rotate((element.rotation * Math.PI) / 180);
  }
  ctx.globalAlpha = Math.max(0, Math.min(1, element.opacity ?? 1));
  ctx.translate(-cx, -cy);

  // Apply Shadow if configured
  if (element.shadowBlur && element.shadowColor) {
    ctx.shadowBlur = element.shadowBlur * scale;
    ctx.shadowOffsetX = (element.shadowOffsetX ?? 0) * scale;
    ctx.shadowOffsetY = (element.shadowOffsetY ?? 4) * scale;
    ctx.shadowColor = element.shadowColor;
  }

  // Type-specific rendering
  if (element.type === 'text') {
    renderTextElement(ctx, element, x, y, w, h, scale);
  } else if (element.type === 'shape') {
    renderShapeElement(ctx, element, x, y, w, h, scale);
  } else if (element.type === 'image') {
    renderImageElement(ctx, element, x, y, w, h, scale);
  } else if (element.type === 'table') {
    renderTableElement(ctx, element, x, y, w, h, scale);
  } else if (element.type === 'icon') {
    renderIconElement(ctx, element, x, y, w, h, scale);
  }

  ctx.restore();
}

// Render Text Element with word wrapping and styling
function renderTextElement(
  ctx: CanvasRenderingContext2D,
  el: TextElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number
): void {
  const padding = (el.padding ?? 8) * scale;

  // Optional background highlight
  if (el.backgroundColor) {
    ctx.fillStyle = el.backgroundColor;
    const r = (el.borderRadius ?? 0) * scale;
    if (r > 0) {
      roundRect(ctx, x, y, w, h, r);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, h);
    }
  }

  // Border if defined
  if (el.borderWidth && el.borderColor) {
    ctx.lineWidth = el.borderWidth * scale;
    ctx.strokeStyle = el.borderColor;
    const r = (el.borderRadius ?? 0) * scale;
    if (r > 0) {
      roundRect(ctx, x, y, w, h, r);
      ctx.stroke();
    } else {
      ctx.strokeRect(x, y, w, h);
    }
  }

  // Text setup
  const fontSize = Math.round(el.fontSize * scale);
  const fontStyle = el.fontStyle === 'italic' ? 'italic ' : '';
  const fontWeight = el.fontWeight || 'normal';
  const fontFamily = el.fontFamily || 'Inter, sans-serif';

  ctx.font = `${fontStyle}${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = el.color || '#ffffff';
  ctx.textBaseline = 'top';

  const lineHeight = fontSize * (el.lineHeight || 1.4);
  const maxWidth = w - padding * 2;

  // Split lines and wrap words
  const rawLines = el.text.split('\n');
  const renderedLines: string[] = [];

  for (const rawLine of rawLines) {
    if (rawLine === '') {
      renderedLines.push('');
      continue;
    }
    const words = rawLine.split(' ');
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine ? currentLine + ' ' + words[n] : words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        renderedLines.push(currentLine);
        currentLine = words[n];
      } else {
        currentLine = testLine;
      }
    }
    renderedLines.push(currentLine);
  }

  let lineY = y + padding;
  for (const line of renderedLines) {
    let lineX = x + padding;
    if (el.textAlign === 'center') {
      const lineWidth = ctx.measureText(line).width;
      lineX = x + (w - lineWidth) / 2;
    } else if (el.textAlign === 'right') {
      const lineWidth = ctx.measureText(line).width;
      lineX = x + w - padding - lineWidth;
    }

    ctx.fillText(line, lineX, lineY);

    // Text decoration (underline, line-through)
    if (el.textDecoration === 'underline' || el.textDecoration === 'line-through') {
      const lineWidth = ctx.measureText(line).width;
      const decoY = el.textDecoration === 'underline' ? lineY + fontSize + 2 * scale : lineY + fontSize / 2;
      ctx.beginPath();
      ctx.lineWidth = Math.max(1, 2 * scale);
      ctx.strokeStyle = el.color || '#ffffff';
      ctx.moveTo(lineX, decoY);
      ctx.lineTo(lineX + lineWidth, decoY);
      ctx.stroke();
    }

    lineY += lineHeight;
  }
}

// Render Shape Element
function renderShapeElement(
  ctx: CanvasRenderingContext2D,
  el: ShapeElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number
): void {
  ctx.fillStyle = el.fillColor || '#6366f1';
  ctx.strokeStyle = el.strokeColor || el.fillColor || '#6366f1';
  ctx.lineWidth = (el.strokeWidth ?? 0) * scale;

  ctx.beginPath();

  if (el.shapeType === 'rectangle') {
    ctx.rect(x, y, w, h);
  } else if (el.shapeType === 'rounded-rect') {
    const radius = Math.min(w / 2, h / 2, (el.borderRadius ?? 16) * scale);
    roundRect(ctx, x, y, w, h, radius);
  } else if (el.shapeType === 'circle') {
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (el.shapeType === 'triangle') {
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  } else if (el.shapeType === 'arrow-right') {
    const headW = w * 0.4;
    const bodyH = h * 0.4;
    ctx.moveTo(x, y + (h - bodyH) / 2);
    ctx.lineTo(x + w - headW, y + (h - bodyH) / 2);
    ctx.lineTo(x + w - headW, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w - headW, y + h);
    ctx.lineTo(x + w - headW, y + (h + bodyH) / 2);
    ctx.lineTo(x, y + (h + bodyH) / 2);
    ctx.closePath();
  } else if (el.shapeType === 'arrow-left') {
    const headW = w * 0.4;
    const bodyH = h * 0.4;
    ctx.moveTo(x + headW, y);
    ctx.lineTo(x, y + h / 2);
    ctx.lineTo(x + headW, y + h);
    ctx.lineTo(x + headW, y + (h + bodyH) / 2);
    ctx.lineTo(x + w, y + (h + bodyH) / 2);
    ctx.lineTo(x + w, y + (h - bodyH) / 2);
    ctx.lineTo(x + headW, y + (h - bodyH) / 2);
    ctx.closePath();
  } else if (el.shapeType === 'line') {
    ctx.lineWidth = Math.max(2, (el.strokeWidth || 4) * scale);
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();
    return;
  } else if (el.shapeType === 'star') {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const outerR = Math.min(w, h) / 2;
    const innerR = outerR * 0.42;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (el.shapeType === 'diamond') {
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x, y + h / 2);
    ctx.closePath();
  } else if (el.shapeType === 'heart') {
    const topCurveH = h * 0.3;
    ctx.moveTo(x + w / 2, y + topCurveH);
    ctx.bezierCurveTo(x + w / 2, y, x, y, x, y + topCurveH);
    ctx.bezierCurveTo(x, y + (h + topCurveH) / 2, x + w / 2, y + (h + topCurveH) / 2, x + w / 2, y + h);
    ctx.bezierCurveTo(x + w / 2, y + (h + topCurveH) / 2, x + w, y + (h + topCurveH) / 2, x + w, y + topCurveH);
    ctx.bezierCurveTo(x + w, y, x + w / 2, y, x + w / 2, y + topCurveH);
    ctx.closePath();
  } else if (el.shapeType === 'speech-bubble') {
    const r = Math.min(w / 4, h / 4, 16 * scale);
    const bubbleH = h * 0.8;
    roundRect(ctx, x, y, w, bubbleH, r);
    ctx.moveTo(x + w * 0.25, y + bubbleH);
    ctx.lineTo(x + w * 0.2, y + h);
    ctx.lineTo(x + w * 0.45, y + bubbleH);
  }

  ctx.fill();
  if (el.strokeWidth && el.strokeWidth > 0) {
    ctx.stroke();
  }
}

// Render Image Element
function renderImageElement(
  ctx: CanvasRenderingContext2D,
  el: ImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number
): void {
  const r = (el.borderRadius ?? 0) * scale;
  if (r > 0) {
    ctx.save();
    roundRect(ctx, x, y, w, h, r);
    ctx.clip();
  }

  const img = getOrLoadImage(el.src);
  if (img && img.complete) {
    if (el.blur) ctx.filter = `blur(${el.blur}px)`;
    ctx.drawImage(img, x, y, w, h);
    ctx.filter = 'none';
  } else {
    // Placeholder while image loads
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#64748b';
    ctx.font = `${Math.round(20 * scale)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Loading Image...', x + w / 2, y + h / 2);
  }

  if (r > 0) ctx.restore();

  // Border
  if (el.borderWidth && el.borderColor) {
    ctx.lineWidth = el.borderWidth * scale;
    ctx.strokeStyle = el.borderColor;
    if (r > 0) {
      roundRect(ctx, x, y, w, h, r);
      ctx.stroke();
    } else {
      ctx.strokeRect(x, y, w, h);
    }
  }
}

// Render Table Element
function renderTableElement(
  ctx: CanvasRenderingContext2D,
  el: TableElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number
): void {
  const rows = el.rows || 3;
  const cols = el.cols || 3;
  const colWidth = w / cols;
  const rowHeight = h / rows;
  const fontSize = Math.round((el.fontSize || 20) * scale);

  ctx.font = `${fontSize}px Inter, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = (el.borderWidth || 1) * scale;
  ctx.strokeStyle = el.borderColor || '#475569';

  for (let r = 0; r < rows; r++) {
    const isHeader = r === 0;
    const rowY = y + r * rowHeight;

    for (let c = 0; c < cols; c++) {
      const colX = x + c * colWidth;

      // Cell Background
      ctx.fillStyle = isHeader ? el.headerBgColor : el.cellBgColor;
      ctx.fillRect(colX, rowY, colWidth, rowHeight);
      ctx.strokeRect(colX, rowY, colWidth, rowHeight);

      // Cell Text
      const text = el.data?.[r]?.[c] ?? '';
      ctx.fillStyle = isHeader ? el.headerTextColor : el.cellTextColor;
      ctx.textAlign = 'center';

      // Truncate if too long
      const textMetrics = ctx.measureText(text);
      if (textMetrics.width > colWidth - 16 * scale) {
        ctx.font = `${Math.round(fontSize * 0.85)}px Inter, sans-serif`;
      }
      ctx.fillText(text, colX + colWidth / 2, rowY + rowHeight / 2);
      ctx.font = `${fontSize}px Inter, sans-serif`;
    }
  }
}

// Render Icon Element with high-quality Canvas vector drawing
function renderIconElement(
  ctx: CanvasRenderingContext2D,
  el: IconElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number
): void {
  ctx.save();
  ctx.strokeStyle = el.color || '#38bdf8';
  ctx.fillStyle = el.color || '#38bdf8';
  ctx.lineWidth = Math.max(2, (el.strokeWidth || 2.5) * scale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = x + w / 2;
  const cy = y + h / 2;
  const s = Math.min(w, h) * 0.4;

  const name = (el.iconName || 'sparkles').toLowerCase();

  ctx.beginPath();
  if (name.includes('star')) {
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s : s * 0.45;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (name.includes('check')) {
    ctx.moveTo(cx - s * 0.6, cy);
    ctx.lineTo(cx - s * 0.1, cy + s * 0.5);
    ctx.lineTo(cx + s * 0.7, cy - s * 0.5);
    ctx.stroke();
  } else if (name.includes('chart') || name.includes('trending')) {
    ctx.moveTo(cx - s * 0.8, cy + s * 0.6);
    ctx.lineTo(cx - s * 0.2, cy);
    ctx.lineTo(cx + s * 0.2, cy + s * 0.3);
    ctx.lineTo(cx + s * 0.8, cy - s * 0.6);
    ctx.stroke();
  } else if (name.includes('zap') || name.includes('lightning')) {
    ctx.moveTo(cx + s * 0.2, cy - s * 0.8);
    ctx.lineTo(cx - s * 0.5, cy + s * 0.1);
    ctx.lineTo(cx, cy + s * 0.1);
    ctx.lineTo(cx - s * 0.2, cy + s * 0.8);
    ctx.lineTo(cx + s * 0.5, cy - s * 0.1);
    ctx.lineTo(cx, cy - s * 0.1);
    ctx.closePath();
    ctx.fill();
  } else if (name.includes('target')) {
    ctx.arc(cx, cy, s * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Default Sparkle / Diamond icon
    ctx.moveTo(cx, cy - s);
    ctx.quadraticCurveTo(cx, cy, cx + s, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + s);
    ctx.quadraticCurveTo(cx, cy, cx - s, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - s);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Render animated karaoke & social captions
export function renderAnimatedCaptions(
  ctx: CanvasRenderingContext2D,
  script: string,
  progress: number, // 0 to 1
  settings: CaptionSettings,
  width: number,
  height: number,
  scale: number
): void {
  if (!settings.enabled || !script) return;

  // Clean script of SSML and pause tags
  const cleanScript = script.replace(/\[[^\]]+\]/g, '').replace(/<[^>]+>/g, '').trim();
  const words = cleanScript.split(/\s+/).filter(Boolean);
  if (words.length === 0) return;

  // Calculate active word index
  const activeWordIdx = Math.min(words.length - 1, Math.floor(progress * words.length));

  // Determine sliding window chunk (4 to 6 words)
  const chunkSize = 5;
  const chunkStart = Math.max(0, Math.min(words.length - chunkSize, activeWordIdx - 2));
  const chunkWords = words.slice(chunkStart, chunkStart + chunkSize);
  const activeInChunk = activeWordIdx - chunkStart;

  ctx.save();

  // Position
  let y = height - 130 * scale;
  if (settings.position === 'top') y = 110 * scale;
  else if (settings.position === 'center') y = height / 2;

  const fontSize = Math.round((settings.fontSize || 38) * scale);
  ctx.font = `700 ${fontSize}px "Outfit", "Inter", sans-serif`;
  ctx.textBaseline = 'middle';

  // Measure word widths
  const wordWidths = chunkWords.map(w => ctx.measureText(w + ' ').width);
  const totalWidth = wordWidths.reduce((a, b) => a + b, 0);

  const startX = (width - totalWidth) / 2;

  // Render frosted background pill
  const paddingH = 28 * scale;
  const paddingV = 16 * scale;
  const pillHeight = fontSize + paddingV * 2;
  const pillY = y - pillHeight / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(15, 15, 15, 0.82)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5 * scale;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 14 * scale;
  roundRect(ctx, startX - paddingH, pillY, totalWidth + paddingH * 2, pillHeight, 14 * scale);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Render individual words with karaoke active highlight
  let curX = startX;
  chunkWords.forEach((word, idx) => {
    const isActive = idx === activeInChunk;
    const wWidth = wordWidths[idx];

    ctx.save();
    if (isActive) {
      const highlightColor = settings.highlightColor || '#3B82F6';

      ctx.fillStyle = highlightColor;
      ctx.shadowColor = highlightColor;
      ctx.shadowBlur = 10 * scale;

      // Bounce effect
      if (settings.style === 'bounce-pop') {
        ctx.translate(0, -4 * scale);
      }
      ctx.font = `800 ${fontSize * 1.06}px "Outfit", "Inter", sans-serif`;
    } else {
      ctx.fillStyle = settings.textColor || 'rgba(255, 255, 255, 0.9)';
    }

    ctx.fillText(word, curX, y);
    ctx.restore();

    curX += wWidth;
  });

  ctx.restore();
}

// Render complete slide to canvas
export function renderCompleteSlide(
  ctx: CanvasRenderingContext2D,
  slide: Slide,
  slideIndex: number,
  totalSlides: number,
  masterSlide: MasterSlide,
  width: number = 1920,
  height: number = 1080,
  currentTimeInSlide?: number,
  slideDuration?: number,
  captionSettings?: CaptionSettings
): void {
  const scale = width / 1920;
  const kenBurnsProgress = (currentTimeInSlide !== undefined && slideDuration && slideDuration > 0)
    ? Math.max(0, Math.min(1, currentTimeInSlide / slideDuration))
    : undefined;

  // 1. Background (with subtle Ken Burns if active)
  renderSlideBackground(ctx, slide, width, height, kenBurnsProgress);

  // 2. Elements sorted by z-index (with animation timeline if active)
  const sortedElements = [...slide.elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  for (const el of sortedElements) {
    renderElement(ctx, el, scale, currentTimeInSlide);
  }

  // 3. Master Slide Overlay
  renderMasterSlide(ctx, masterSlide, slideIndex, totalSlides, width, height, scale);

  // 4. Animated Karaoke / Social Captions
  if (captionSettings?.enabled && slide.script && currentTimeInSlide !== undefined && slideDuration) {
    const progress = Math.max(0, Math.min(1, currentTimeInSlide / slideDuration));
    renderAnimatedCaptions(ctx, slide.script, progress, captionSettings, width, height, scale);
  }
}

// Render transition frame between two slides
export function renderTransitionFrame(
  ctx: CanvasRenderingContext2D,
  fromSlide: Slide,
  toSlide: Slide,
  transitionType: TransitionType,
  progress: number, // 0 to 1
  fromCanvas: HTMLCanvasElement,
  toCanvas: HTMLCanvasElement,
  width: number,
  height: number
): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Apply easing (ease-in-out)
  const t = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  switch (transitionType) {
    case 'fade':
    case 'dissolve':
    case 'blur-fade':
      ctx.drawImage(fromCanvas, 0, 0);
      ctx.globalAlpha = t;
      ctx.drawImage(toCanvas, 0, 0);
      break;

    case 'slide-left':
    case 'push-left':
      ctx.drawImage(fromCanvas, -width * t, 0);
      ctx.drawImage(toCanvas, width * (1 - t), 0);
      break;

    case 'slide-right':
    case 'push-right':
      ctx.drawImage(fromCanvas, width * t, 0);
      ctx.drawImage(toCanvas, -width * (1 - t), 0);
      break;

    case 'slide-up':
      ctx.drawImage(fromCanvas, 0, -height * t);
      ctx.drawImage(toCanvas, 0, height * (1 - t));
      break;

    case 'slide-down':
      ctx.drawImage(fromCanvas, 0, height * t);
      ctx.drawImage(toCanvas, 0, -height * (1 - t));
      break;

    case 'zoom-in':
      ctx.drawImage(fromCanvas, 0, 0);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(t, t);
      ctx.globalAlpha = t;
      ctx.drawImage(toCanvas, -width / 2, -height / 2);
      ctx.restore();
      break;

    case 'zoom-out':
      ctx.drawImage(toCanvas, 0, 0);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      const scaleOut = Math.max(0.01, 1 - t);
      ctx.scale(scaleOut, scaleOut);
      ctx.globalAlpha = 1 - t;
      ctx.drawImage(fromCanvas, -width / 2, -height / 2);
      ctx.restore();
      break;

    case 'flip-x':
      ctx.save();
      ctx.translate(width / 2, height / 2);
      if (t < 0.5) {
        ctx.scale(Math.cos(t * Math.PI), 1);
        ctx.drawImage(fromCanvas, -width / 2, -height / 2);
      } else {
        ctx.scale(-Math.cos(t * Math.PI), 1);
        ctx.drawImage(toCanvas, -width / 2, -height / 2);
      }
      ctx.restore();
      break;

    case 'flip-y':
      ctx.save();
      ctx.translate(width / 2, height / 2);
      if (t < 0.5) {
        ctx.scale(1, Math.cos(t * Math.PI));
        ctx.drawImage(fromCanvas, -width / 2, -height / 2);
      } else {
        ctx.scale(1, -Math.cos(t * Math.PI));
        ctx.drawImage(toCanvas, -width / 2, -height / 2);
      }
      ctx.restore();
      break;

    case 'rotate-cw':
      ctx.drawImage(fromCanvas, 0, 0);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(t * Math.PI * 0.5);
      ctx.scale(t, t);
      ctx.globalAlpha = t;
      ctx.drawImage(toCanvas, -width / 2, -height / 2);
      ctx.restore();
      break;

    case 'wipe-left':
      ctx.drawImage(fromCanvas, 0, 0);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width * t, height);
      ctx.clip();
      ctx.drawImage(toCanvas, 0, 0);
      ctx.restore();
      break;

    case 'wipe-right':
      ctx.drawImage(fromCanvas, 0, 0);
      ctx.save();
      ctx.beginPath();
      ctx.rect(width * (1 - t), 0, width * t, height);
      ctx.clip();
      ctx.drawImage(toCanvas, 0, 0);
      ctx.restore();
      break;

    case 'cube-left':
      ctx.save();
      ctx.drawImage(fromCanvas, -width * t, 0);
      ctx.globalAlpha = 0.5 + 0.5 * (1 - t);
      ctx.drawImage(toCanvas, width * (1 - t), 0);
      ctx.restore();
      break;

    default:
      // None / fallback
      if (t < 0.5) {
        ctx.drawImage(fromCanvas, 0, 0);
      } else {
        ctx.drawImage(toCanvas, 0, 0);
      }
      break;
  }

  ctx.restore();
}
