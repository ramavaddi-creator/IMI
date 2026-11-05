// Renders an Iddav poster onto a 1080x1350 (4:5) canvas, applying the brand
// system: #080F08 ground, white Cormorant Garamond headline, gold #C9A84C
// only on the eyebrow and divider, cream #F0E8CC secondary text, brand mark
// at 8px / 42% opacity, series numbering, softer editorial overlays.
// The AI image is used as a background only; all type is set here, never
// generated, so spelling and brand typography are always exact.

export type PosterTemplate = 'bottom' | 'left' | 'full_bleed' | 'dark';

export const TEMPLATE_LABELS: Record<PosterTemplate, string> = {
  bottom: 'Bottom',
  left: 'Left',
  full_bleed: 'Full Bleed',
  dark: 'Dark',
};

export interface PosterSpec {
  backgroundUrl?: string;
  template: PosterTemplate;
  eyebrow: string;
  headline: string;
  seriesLabel: string; // e.g. "Monsoon Stillness · Nº 03"
  aiDisclosure?: boolean; // AI background: label must travel with the asset (FR-BRD-007)
}

const W = 1080;
const H = 1350;
const INK = '#080F08';
const GOLD = '#C9A84C';
const CREAM = '#F0E8CC';
const PAD = 88;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the background image.'));
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, dx: number, dy: number, dw: number, dh: number) {
  const scale = Math.max(dw / img.width, dh / img.height);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`;
}

export async function renderPoster(canvas: HTMLCanvasElement, spec: PosterSpec): Promise<void> {
  await Promise.all([
    document.fonts.load('600 96px "Cormorant Garamond"'),
    document.fonts.load('600 22px "Montserrat"'),
    document.fonts.load('500 18px "Montserrat"'),
  ]);

  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  const img = spec.backgroundUrl ? await loadImage(spec.backgroundUrl) : null;

  // --- image + overlays
  if (img) {
    if (spec.template === 'dark') {
      const imgH = H * 0.62;
      drawCover(ctx, img, 0, 0, W, imgH);
      const g = ctx.createLinearGradient(0, imgH * 0.55, 0, imgH);
      g.addColorStop(0, 'rgba(8,15,8,0)');
      g.addColorStop(1, 'rgba(8,15,8,1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, imgH);
    } else {
      drawCover(ctx, img, 0, 0, W, H);
    }
  }

  if (spec.template === 'bottom') {
    const g = ctx.createLinearGradient(0, H * 0.42, 0, H);
    g.addColorStop(0, 'rgba(8,15,8,0)');
    g.addColorStop(0.55, 'rgba(8,15,8,0.62)');
    g.addColorStop(1, 'rgba(8,15,8,0.9)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else if (spec.template === 'left') {
    const g = ctx.createLinearGradient(0, 0, W * 0.7, 0);
    g.addColorStop(0, 'rgba(8,15,8,0.88)');
    g.addColorStop(0.6, 'rgba(8,15,8,0.45)');
    g.addColorStop(1, 'rgba(8,15,8,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else if (spec.template === 'full_bleed') {
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.8);
    v.addColorStop(0, 'rgba(8,15,8,0)');
    v.addColorStop(1, 'rgba(8,15,8,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, H * 0.6, 0, H);
    g.addColorStop(0, 'rgba(8,15,8,0)');
    g.addColorStop(1, 'rgba(8,15,8,0.7)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  // Top scrim so the brand mark and series number stay legible.
  const top = ctx.createLinearGradient(0, 0, 0, 200);
  top.addColorStop(0, 'rgba(8,15,8,0.45)');
  top.addColorStop(1, 'rgba(8,15,8,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, 200);

  // --- type
  ctx.textBaseline = 'top';
  const maxWidth = spec.template === 'left' ? 540 : W - PAD * 2;

  ctx.font = '600 96px "Cormorant Garamond", Georgia, serif';
  setSpacing(ctx, 0);
  const lines = wrapLines(ctx, spec.headline, maxWidth);
  const lineH = 102;

  const eyebrowH = spec.eyebrow ? 22 : 0;
  const gapA = spec.eyebrow ? 24 : 0;
  const dividerH = 2;
  const gapB = 34;
  const blockH = eyebrowH + gapA + dividerH + gapB + lines.length * lineH;
  let y = spec.template === 'left' ? (H - blockH) / 2 : H - 128 - blockH;

  if (spec.eyebrow) {
    ctx.font = '600 22px "Montserrat", Arial, sans-serif';
    setSpacing(ctx, 6);
    ctx.fillStyle = GOLD;
    ctx.fillText(spec.eyebrow.toUpperCase(), PAD, y);
    y += eyebrowH + gapA;
  }

  ctx.fillStyle = GOLD;
  ctx.fillRect(PAD, y, 64, dividerH);
  y += dividerH + gapB;

  ctx.font = '600 96px "Cormorant Garamond", Georgia, serif';
  setSpacing(ctx, 0);
  ctx.fillStyle = '#FFFFFF';
  for (const l of lines) {
    ctx.fillText(l, PAD, y);
    y += lineH;
  }

  // Brand mark: 8px at 42% opacity, per the Iddav v2 poster standard.
  ctx.font = '600 8px "Montserrat", Arial, sans-serif';
  setSpacing(ctx, 2);
  ctx.fillStyle = 'rgba(240,232,204,0.42)';
  ctx.fillText('IDDAV WILDSTAY', PAD, 72);

  if (spec.aiDisclosure) {
    ctx.font = '500 16px "Montserrat", Arial, sans-serif';
    setSpacing(ctx, 2);
    ctx.fillStyle = 'rgba(240,232,204,0.7)';
    ctx.textAlign = 'right';
    ctx.fillText('AI-GENERATED BACKGROUND', W - PAD, H - 64);
    ctx.textAlign = 'left';
  }

  if (spec.seriesLabel) {
    ctx.font = '500 18px "Montserrat", Arial, sans-serif';
    setSpacing(ctx, 3);
    ctx.fillStyle = CREAM;
    ctx.globalAlpha = 0.6;
    ctx.textAlign = 'right';
    ctx.fillText(spec.seriesLabel.toUpperCase(), W - PAD, 68);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

export function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not export the poster.'))), 'image/jpeg', 0.92);
  });
}

export function posterWordCount(eyebrow: string, headline: string): number {
  return `${eyebrow} ${headline}`.trim().split(/\s+/).filter(Boolean).length;
}
