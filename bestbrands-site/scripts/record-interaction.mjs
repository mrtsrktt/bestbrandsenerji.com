import { spawn, execSync } from 'child_process';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';

const PORT = 9230;
const TEMP_DIR = 'C:\\Users\\murat\\AppData\\Local\\Temp\\antigravity\\chrome-record-60fps';
const FRAMES_DIR = 'C:\\Users\\murat\\AppData\\Local\\Temp\\antigravity\\record-frames-60fps';
const OUTPUT_MP4 = 'C:\\3matolye\\bestbrands\\bestbrands-site\\screenshots\\megamenu-interaction.mp4';
const FFMPEG_PATH = 'C:\\Users\\murat\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.eventHandlers = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method) {
        const handler = this.eventHandlers.get(msg.method);
        if (handler) handler(msg.params);
      }
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }

  on(method, handler) {
    this.eventHandlers.set(method, handler);
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  sendImmediate(method, params = {}) {
    const id = this.id++;
    this.ws.send(JSON.stringify({ id, method, params }));
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function recordAt60Fps() {
  console.log('Preparing frames directory...');
  try {
    await rm(FRAMES_DIR, { recursive: true, force: true });
  } catch {}
  await mkdir(FRAMES_DIR, { recursive: true });

  console.log('Launching Chrome with 60fps compositor...');
  const chromeProcess = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-frame-rate-limit',
    '--autoplay-policy=no-user-gesture-required',
    'http://127.0.0.1:5173/',
  ]);

  try {
    let wsUrl = '';
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
        const pages = await res.json();
        const page = pages.find((p) => p.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
    }

    if (!wsUrl) throw new Error('Could not connect to Chrome CDP');

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    });

    // Sayfa ve video yüklemesi için kısa bekleme
    await sleep(2000);

    const receivedFrames = [];
    const startTime = Date.now();

    cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
      cdp.sendImmediate('Page.screencastFrameAck', { sessionId });
      receivedFrames.push({
        time: Date.now() - startTime,
        data,
        metadata
      });
    });

    console.log('Starting hardware-accelerated 60fps screencast...');
    await cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 92,
      maxWidth: 1440,
      maxHeight: 900,
      everyNthFrame: 1,
    });

    // =========================================================
    // ETKİLEŞİM SENARYOSU (Tüm hareket sistemini eksiksiz gösterir)
    // =========================================================

    // 1. Kapalı Durum: Şeffaf header, beyaz logo ve arka planda hero video (800ms)
    console.log('1. Kapalı durum kaydediliyor...');
    await sleep(800);

    // 2. Kapalı -> Açık: Kurumsal menüsü açılıyor (~650ms kayma + 100ms editoryal görsel gelişi)
    console.log('2. Kurumsal açılışı kaydediliyor...');
    await cdp.evaluate(`(() => {
      const btn = document.getElementById('nav-button-kurumsal');
      btn.focus();
      btn.click();
    })()`);
    await sleep(1200);

    // 3. İçerik Hover: Bağlantı üzerine hover etkileşimi (500ms)
    console.log('3. Kurumsal bağlantı hover etkisi kaydediliyor...');
    await cdp.evaluate(`(() => {
      const links = document.querySelectorAll('a[class*="corporateEditorialLink"]');
      if (links[1]) {
        links[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }
    })()`);
    await sleep(500);

    // 4. Paneller Arası Geçiş: Kurumsal -> Yatırımlarımız (~400ms dinamik yükseklik tweening)
    console.log('4. Yatırımlarımız geçişi ve yükseklik animasyonu kaydediliyor...');
    await cdp.evaluate(`(() => {
      const btn = document.getElementById('nav-button-yatirimlarimiz');
      btn.focus();
      btn.click();
    })()`);
    await sleep(1300);

    // 5. Paneller Arası Geçiş: Yatırımlarımız -> Yatırımcı İlişkileri (3 sütunlu editoryal düzen)
    console.log('5. Yatırımcı İlişkileri geçişi kaydediliyor...');
    await cdp.evaluate(`(() => {
      const btn = document.getElementById('nav-button-yatirimci-iliskileri');
      btn.focus();
      btn.click();
    })()`);
    await sleep(1300);

    // 6. Hızlı Başlık Değişimi: Yatırımcı İlişkileri -> Kurumsal -> Yatırımlarımız (sıra dışı hızlı geçiş)
    console.log('6. Hızlı başlık değişimi kaydediliyor...');
    await cdp.evaluate(`(() => {
      const b1 = document.getElementById('nav-button-kurumsal');
      b1.click();
    })()`);
    await sleep(250);
    await cdp.evaluate(`(() => {
      const b2 = document.getElementById('nav-button-yatirimlarimiz');
      b2.click();
    })()`);
    await sleep(900);

    // 7. Açılırken Çıkma ve Tekrar Girme (Sıçramasız yön değiştirme)
    console.log('7. Açılırken çıkma ve tekrar girme kaydediliyor...');
    // Mouse ayrılır, kapanış başlar
    await cdp.evaluate(`(() => {
      document.querySelector('header').dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    })()`);
    await sleep(180);
    // Kapanış bitmeden tekrar girilir: Panel in-flight konumundan yumuşakça geri açılır
    await cdp.evaluate(`(() => {
      const btn = document.getElementById('nav-button-kurumsal');
      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      btn.click();
    })()`);
    await sleep(900);

    // 8. Açık -> Kapalı: Escape tuşu ile kapanış ve odak iadesi (~480ms koordineli geri çekilme)
    console.log('8. Escape ile kapanış kaydediliyor...');
    await cdp.evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    })()`);
    await sleep(900);

    // 9. Son Kapalı Durum (600ms)
    console.log('9. Son kapalı durum kaydediliyor...');
    await sleep(600);

    console.log(`Stopping screencast. Total raw events captured: ${receivedFrames.length}`);
    await cdp.send('Page.stopScreencast');
    cdp.close();

    if (receivedFrames.length === 0) {
      throw new Error('No frames captured from screencast');
    }

    const TARGET_FPS = 60;
    const frameIntervalMs = 1000 / TARGET_FPS;
    const totalDurationMs = Date.now() - startTime;
    const totalOutputFrames = Math.floor(totalDurationMs / frameIntervalMs);

    console.log(`Synchronizing real-time timeline:`);
    console.log(`  Raw captured frames: ${receivedFrames.length}`);
    console.log(`  Session duration: ${(totalDurationMs / 1000).toFixed(2)}s`);
    console.log(`  Target FPS: ${TARGET_FPS}`);
    console.log(`  Output frames to render: ${totalOutputFrames}`);

    // Map each target frame time to the most recent screencast frame buffer
    let rawIdx = 0;
    let currentBuffer = Buffer.from(receivedFrames[0].data, 'base64');
    const writePromises = [];

    for (let f = 0; f < totalOutputFrames; f++) {
      const targetTime = f * frameIntervalMs;
      while (rawIdx + 1 < receivedFrames.length && receivedFrames[rawIdx + 1].time <= targetTime) {
        rawIdx++;
        currentBuffer = Buffer.from(receivedFrames[rawIdx].data, 'base64');
      }
      const filename = join(FRAMES_DIR, `frame_${String(f).padStart(6, '0')}.jpg`);
      writePromises.push(writeFile(filename, currentBuffer));
    }

    console.log('Writing frame files to disk...');
    await Promise.all(writePromises);

    console.log(`Stitching ${totalOutputFrames} frames into 60fps MP4 using FFmpeg...`);
    const inputPattern = join(FRAMES_DIR, 'frame_%06d.jpg');
    execSync(`"${FFMPEG_PATH}" -y -framerate ${TARGET_FPS} -i "${inputPattern}" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p "${OUTPUT_MP4}"`);

    console.log(`\n========================================`);
    console.log(`SUCCESS! 60fps video generated at:`);
    console.log(OUTPUT_MP4);
    console.log(`Total rendered frames: ${totalOutputFrames}`);
    console.log(`Exact duration: ${(totalOutputFrames / TARGET_FPS).toFixed(2)}s`);
    console.log(`Effective framerate: ${TARGET_FPS} fps`);
    console.log(`========================================\n`);
  } finally {
    chromeProcess.kill('SIGKILL');
  }
}

recordAt60Fps().catch((err) => {
  console.error('Recording failed:', err);
  process.exit(1);
});
