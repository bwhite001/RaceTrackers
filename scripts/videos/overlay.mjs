/**
 * Video overlay: a caption bar under the app, a visible cursor and a ripple on
 * every click. Nothing here touches the app's code; it's injected per context.
 *
 * Uses CSS animation only, because the recordings run on a Playwright fake
 * clock and page timers would stall.
 */
export const CAPTION_HEIGHT = 96;

const overlay = (height) => {
  const start = () => {
    if (document.getElementById('vk-video-caption')) return;
    const css = document.createElement('style');
    css.textContent = `
      html { background: #0B2545; }
      /* Room for the caption, and a containing block so sheets and fixed bars stop above it */
      body { height: calc(100vh - ${height}px) !important; min-height: 0 !important; overflow: auto !important; transform: translateZ(0); }
      .h-\\[100dvh\\] { height: calc(100vh - ${height}px) !important; }
      .min-h-screen { min-height: calc(100vh - ${height}px) !important; }
      #vk-video-caption { position: fixed; left: 0; right: 0; bottom: 0; height: ${height}px; z-index: 2147483646;
        display: flex; align-items: center; justify-content: center; padding: 8px 18px; box-sizing: border-box;
        background: #0B2545; border-top: 4px solid #D4AF37; color: #fff; text-align: center;
        font: 600 clamp(17px, 2.4vw, 24px)/1.25 system-ui, sans-serif; pointer-events: none; }
      #vk-video-cursor { position: fixed; left: 0; top: 0; width: 22px; height: 22px; margin: -11px 0 0 -11px; z-index: 2147483647;
        border-radius: 50%; background: rgba(212,175,55,.55); border: 2px solid #0B2545; pointer-events: none; display: none; }
      .vk-video-ripple { position: fixed; width: 18px; height: 18px; margin: -9px 0 0 -9px; border-radius: 50%; z-index: 2147483647;
        border: 5px solid #D4AF37; pointer-events: none; animation: vk-ripple .7s ease-out forwards; }
      @keyframes vk-ripple { to { transform: scale(6); opacity: 0; } }
      .vk-video-target { outline: 4px solid #D4AF37 !important; outline-offset: 3px !important; }`;
    document.documentElement.append(css);

    const bar = document.createElement('div');
    bar.id = 'vk-video-caption';
    bar.textContent = sessionStorage.getItem('vk-caption') || '';
    document.documentElement.append(bar);
    const dot = document.createElement('div');
    dot.id = 'vk-video-cursor';
    document.documentElement.append(dot);

    window.__caption = (text) => { sessionStorage.setItem('vk-caption', text); bar.textContent = text; };
    addEventListener('mousemove', e => {
      dot.style.display = 'block';
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }, true);
    addEventListener('mousedown', e => {
      const r = document.createElement('div');
      r.className = 'vk-video-ripple';
      r.style.left = `${e.clientX}px`;
      r.style.top = `${e.clientY}px`;
      r.addEventListener('animationend', () => r.remove());
      document.documentElement.append(r);
    }, true);
  };
  if (document.documentElement) start(); else addEventListener('DOMContentLoaded', start);
};

export const installOverlay = (ctx, height = CAPTION_HEIGHT) => ctx.addInitScript(overlay, height);

export const caption = async (page, text) => {
  // The overlay starts on DOMContentLoaded; wait for it so an early caption isn't lost
  await page.waitForFunction(() => window.__caption, null, { timeout: 5000 }).catch(() => {});
  await page.evaluate(t => window.__caption?.(t), text).catch(() => {});
};
