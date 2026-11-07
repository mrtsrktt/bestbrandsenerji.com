import { spawn } from 'child_process';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const PORT = 9224;
const TEMP_DIR = 'C:\\Users\\murat\\AppData\\Local\\Temp\\antigravity\\chrome-capture';
const SCREENSHOTS_DIR = 'C:\\3matolye\\bestbrands\\bestbrands-site\\screenshots';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) {
          reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        } else {
          resolve(msg.result);
        }
      }
    };
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  async setViewport(width, height, deviceScaleFactor = 1, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: isMobile,
    });
  }

  async captureScreenshot(path) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    await writeFile(path, buffer);
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function main() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  console.log('Launching headless Chrome...');
  const chromeProcess = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://127.0.0.1:5173/',
  ]);

  try {
    let connected = false;
    let wsUrl = '';
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        const versionRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
        const pages = await versionRes.json();
        const page = pages.find((p) => p.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          connected = true;
          break;
        }
      } catch {
        // Retry
      }
    }

    if (!connected) {
      throw new Error('Could not connect to Chrome CDP');
    }

    console.log('Connecting to Page via CDP:', wsUrl);
    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    // Wait for video/page ready
    await sleep(1500);

    // ==========================================
    // 1. DESKTOP 1440px - Closed Header
    // ==========================================
    console.log('Testing Desktop 1440px - Closed Header...');
    await cdp.setViewport(1440, 900, 1, false);
    await sleep(500);

    const desktopClosedAudit = await cdp.evaluate(`(() => {
      const header = document.querySelector('header');
      const headerStyle = window.getComputedStyle(header);
      const navContainer = document.querySelector('header > div');
      const navContainerStyle = window.getComputedStyle(navContainer);
      const logoImg = document.querySelector('header img');
      const navButtons = Array.from(document.querySelectorAll('header button[id^="nav-button-"]')).map(b => ({
        id: b.id,
        text: b.innerText.trim(),
        color: window.getComputedStyle(b).color,
        fontWeight: window.getComputedStyle(b).fontWeight,
        bg: window.getComputedStyle(b).backgroundColor
      }));
      const directLinks = Array.from(document.querySelectorAll('header a[class*="navDirectLink"]')).map(a => ({
        text: a.innerText.trim(),
        hasArrow: a.innerText.includes('↗')
      }));

      return {
        headerHeight: headerStyle.height,
        headerBg: headerStyle.backgroundColor,
        navContainerPadding: navContainerStyle.padding,
        logoSrc: logoImg?.src,
        logoWidth: logoImg?.clientWidth,
        logoHeight: logoImg?.clientHeight,
        navButtons,
        directLinks
      };
    })()`);
    console.log('Desktop Closed Header Audit:', JSON.stringify(desktopClosedAudit, null, 2));
    await cdp.captureScreenshot(join(SCREENSHOTS_DIR, '01-header-closed-1440.png'));

    // ==========================================
    // 2. DESKTOP 1440px - Kurumsal Mega Menu
    // ==========================================
    console.log('Testing Desktop 1440px - Kurumsal Mega Menu...');
    await cdp.evaluate(`(() => {
      const btn = document.getElementById('nav-button-kurumsal');
      btn.click();
      btn.blur();
    })()`);
    await sleep(600);

    const kurumsalAudit = await cdp.evaluate(`(() => {
      const panel = document.getElementById('megamenu-panel-kurumsal');
      const panelStyle = window.getComputedStyle(panel);
      const header = document.querySelector('header');
      const headerStyle = window.getComputedStyle(header);
      const links = Array.from(panel.querySelectorAll('a[class*="corporateEditorialLink"]')).map(a => ({
        text: a.innerText.trim(),
        fontSize: window.getComputedStyle(a).fontSize,
        fontWeight: window.getComputedStyle(a).fontWeight,
        color: window.getComputedStyle(a).color
      }));
      const visualCard = panel.querySelector('[class*="corporateVisualCard"]');
      const visualCardStyle = visualCard ? window.getComputedStyle(visualCard) : null;
      const visualImg = panel.querySelector('img[class*="corporateImage"]');

      return {
        headerBgWhenOpen: headerStyle.backgroundColor,
        panelBg: panelStyle.backgroundColor,
        panelHeight: panelStyle.height,
        linksCount: links.length,
        links,
        visualCardHeight: visualCardStyle?.height,
        visualImgLoaded: visualImg?.complete
      };
    })()`);
    console.log('Kurumsal Panel Audit:', JSON.stringify(kurumsalAudit, null, 2));
    await cdp.captureScreenshot(join(SCREENSHOTS_DIR, '02-megamenu-kurumsal-1440.png'));

    // Test hover on second link (Yönetim Kurulu Mesajı) to observe dimming effect
    await cdp.evaluate(`(() => {
      const links = document.querySelectorAll('a[class*="corporateEditorialLink"]');
      if (links[1]) {
        links[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }
    })()`);
    await sleep(200);
    await cdp.captureScreenshot(join(SCREENSHOTS_DIR, '02b-megamenu-kurumsal-hover-1440.png'));

    // ==========================================
    // 3. DESKTOP 1440px - Yatırımlarımız Mega Menu (Switching Tabs)
    // ==========================================
    console.log('Testing Desktop 1440px - Switch to Yatırımlarımız...');
    await cdp.evaluate(`(() => {
      const btn = document.getElementById('nav-button-yatirimlarimiz');
      btn.click();
      btn.blur();
    })()`);
    await sleep(500);

    const investmentsAudit = await cdp.evaluate(`(() => {
      const panel = document.getElementById('megamenu-panel-yatirimlarimiz');
      const cards = Array.from(panel.querySelectorAll('a[class*="investmentVisualCard"]')).map(c => {
        const title = c.querySelector('h3');
        const img = c.querySelector('img');
        const style = window.getComputedStyle(c);
        return {
          title: title?.innerText.trim(),
          cardHeight: style.height,
          imgSrc: img?.src,
          imgLoaded: img?.complete
        };
      });
      const allLink = panel.querySelector('a[class*="allInvestmentsLink"]');

      return {
        cards,
        allInvestmentsText: allLink?.innerText.trim(),
        allInvestmentsHref: allLink?.href
      };
    })()`);
    console.log('Investments Panel Audit:', JSON.stringify(investmentsAudit, null, 2));
    await cdp.captureScreenshot(join(SCREENSHOTS_DIR, '03-megamenu-yatirimlarimiz-1440.png'));

    // ==========================================
    // 4. DESKTOP 1440px - Yatırımcı İlişkileri Mega Menu (Switching Tabs)
    // ==========================================
    console.log('Testing Desktop 1440px - Switch to Yatırımcı İlişkileri...');
    await cdp.evaluate(`(() => {
      const btn = document.getElementById('nav-button-yatirimci-iliskileri');
      btn.click();
      btn.blur();
    })()`);
    await sleep(500);

    const investorAudit = await cdp.evaluate(`(() => {
      const panel = document.getElementById('megamenu-panel-yatirimci-iliskileri');
      const columns = Array.from(panel.querySelectorAll('[class*="investorColumn"]')).map(col => {
        const header = col.querySelector('h4')?.innerText.trim();
        const links = Array.from(col.querySelectorAll('a, [class*="investorDisabledItem"]')).map(l => l.innerText.trim());
        return { header, linksCount: links.length, sampleLinks: links.slice(0, 3) };
      });
      const contacts = Array.from(panel.querySelectorAll('[class*="footerContactLink"]')).map(a => a.innerText.trim());
      const socials = Array.from(panel.querySelectorAll('[class*="footerSocialLink"]')).map(a => a.innerText.trim());

      return {
        columns,
        contacts,
        socials
      };
    })()`);
    console.log('Investor Relations Panel Audit:', JSON.stringify(investorAudit, null, 2));
    await cdp.captureScreenshot(join(SCREENSHOTS_DIR, '04-megamenu-yatirimci-1440.png'));

    // Close panel with Escape
    await cdp.evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    })()`);
    await sleep(400);

    // ==========================================
    // 5. HERO CONTROLS - Video End & Replay
    // ==========================================
    console.log('Testing Hero Video Ended & Replay...');
    await cdp.evaluate(`(() => {
      document.querySelectorAll('button, a').forEach(el => el.blur());
    })()`);
    await cdp.evaluate(`new Promise(resolve => {
      const video = document.querySelector('video');
      video.currentTime = 46.3;
      video.play();
      video.addEventListener('ended', () => {
        setTimeout(resolve, 150);
      }, { once: true });
    })`);
    await sleep(200);

    const videoEndedAudit = await cdp.evaluate(`(() => {
      const pausePlayBtn = document.querySelector('button[aria-label="Videoyu duraklat"], button[aria-label="Videoyu devam ettir"]');
      const replayBtn = document.querySelector('button[aria-label="Videoyu baştan tekrar izle"]');
      return {
        pausePlayHidden: pausePlayBtn === null,
        replayVisible: replayBtn !== null,
        replayText: replayBtn?.innerText.trim()
      };
    })()`);
    console.log('Video Ended Audit:', JSON.stringify(videoEndedAudit, null, 2));
    await cdp.captureScreenshot(join(SCREENSHOTS_DIR, '05-hero-video-ended-1440.png'));

    // Click Replay and verify pause/play returns
    await cdp.evaluate(`(() => {
      const replayBtn = document.querySelector('button[aria-label="Videoyu baştan tekrar izle"]');
      replayBtn?.click();
    })()`);
    await sleep(400);

    const afterReplayAudit = await cdp.evaluate(`(() => {
      const pausePlayBtn = document.querySelector('button[aria-label="Videoyu duraklat"], button[aria-label="Videoyu devam ettir"]');
      const replayBtn = document.querySelector('button[aria-label="Videoyu baştan tekrar izle"]');
      const video = document.querySelector('video');
      return {
        pausePlayReturned: pausePlayBtn !== null,
        replayHidden: replayBtn === null,
        videoPlaying: !video.paused
      };
    })()`);
    console.log('After Replay Audit:', JSON.stringify(afterReplayAudit, null, 2));

    // ==========================================
    // 6. TABLET 1024px - Kurumsal Mega Menu
    // ==========================================
    console.log('Testing Tablet 1024px...');
    await cdp.setViewport(1024, 768, 1, false);
    await sleep(400);

    await cdp.evaluate(`(() => {
      document.querySelectorAll('button, a').forEach(el => el.blur());
      const btn = document.getElementById('nav-button-kurumsal');
      btn.click();
      btn.blur();
    })()`);
    await sleep(500);

    await cdp.captureScreenshot(join(SCREENSHOTS_DIR, '06-megamenu-tablet-1024.png'));

    // Close panel
    await cdp.evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    })()`);
    await sleep(300);

    // ==========================================
    // 7. MOBILE 390px - Closed & Open
    // ==========================================
    console.log('Testing Mobile 390px...');
    await cdp.setViewport(390, 844, 2, true);
    await sleep(400);

    await cdp.captureScreenshot(join(SCREENSHOTS_DIR, '07-mobile-closed-390.png'));

    // Open mobile hamburger menu
    await cdp.evaluate(`(() => {
      const hamburger = document.querySelector('header button[aria-controls="mobile-navigation-drawer"]');
      hamburger?.click();
    })()`);
    await sleep(500);

    // Expand Kurumsal and Yatırımlarımız accordions
    await cdp.evaluate(`(() => {
      const accordions = document.querySelectorAll('button[class*="accordionHeader"]');
      accordions[0]?.click(); // Kurumsal
    })()`);
    await sleep(300);

    const mobileAudit = await cdp.evaluate(`(() => {
      const drawer = document.getElementById('mobile-navigation-drawer');
      const drawerStyle = window.getComputedStyle(drawer);
      const openPanel = document.getElementById('mobile-panel-kurumsal');
      const links = Array.from(openPanel.querySelectorAll('a')).map(a => a.innerText.trim());

      return {
        drawerBg: drawerStyle.backgroundColor,
        drawerColor: drawerStyle.color,
        links
      };
    })()`);
    console.log('Mobile Drawer Audit:', JSON.stringify(mobileAudit, null, 2));
    await cdp.captureScreenshot(join(SCREENSHOTS_DIR, '08-mobile-open-390.png'));

    console.log('All tests and visual captures completed successfully!');
    cdp.close();
  } finally {
    chromeProcess.kill('SIGKILL');
  }
}

main().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
