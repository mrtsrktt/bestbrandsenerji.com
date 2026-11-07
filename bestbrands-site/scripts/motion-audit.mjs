import { spawn } from 'child_process';
const PORT = 9226;
const TEMP_DIR = 'C:\\Users\\murat\\AppData\\Local\\Temp\\antigravity\\chrome-motion-audit';

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

  on(method, handler) {
    this.eventHandlers.set(method, handler);
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

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function runMotionAudit(targetUrl = 'http://127.0.0.1:5173/') {
  console.log(`\n======================================================`);
  console.log(`--- STARTING MOTION SYSTEM AUDIT ON: ${targetUrl} ---`);
  console.log(`======================================================\n`);

  const chromeProcess = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    targetUrl,
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
    cdp.on('Runtime.consoleAPICalled', (params) => {
      const text = params.args?.map((a) => a.value || a.description).join(' ');
      console.log('    >> BROWSER CONSOLE:', text);
    });
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

    await sleep(1500);
    for (let i = 0; i < 30; i++) {
      const ready = await cdp.evaluate(`Boolean(document.getElementById('nav-button-kurumsal'))`);
      if (ready) break;
      await sleep(200);
    }

    // Diagnostic helper in page context to track animation triggers
    await cdp.evaluate(`(() => {
      window.__motionAudit = {
        openTriggers: 0,
        switchTriggers: 0,
        closeTriggers: 0,
        frameSamples: []
      };
    })()`);

    // -------------------------------------------------------------
    // SCENARIO 1: Aynı Menüyü 10 Kez Aç / Kapat
    // -------------------------------------------------------------
    console.log('[SENARYO 1] Aynı menüyü 10 kez ardışık açma / kapatma testi:');
    let s1Passed = true;
    for (let cycle = 1; cycle <= 10; cycle++) {
      // Aç
      await cdp.evaluate(`document.getElementById('nav-button-kurumsal').click()`);
      await sleep(800); // 750ms open duration
      const openCheck = await cdp.evaluate(`(() => {
        const wrapper = document.querySelector('[class*="menuWrapper"]');
        const kurumsal = document.getElementById('megamenu-panel-kurumsal');
        const root = document.getElementById('megamenu-root');
        return {
          isVisible: root?.className.includes('isVisible'),
          kurumsalOpacity: kurumsal ? window.getComputedStyle(kurumsal).opacity : null,
          wrapperTransform: wrapper ? window.getComputedStyle(wrapper).transform : null
        };
      })()`);

      // Kapat (Escape)
      await cdp.evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
      await sleep(550); // 480ms close duration
      const closeCheck = await cdp.evaluate(`(() => {
        const root = document.getElementById('megamenu-root');
        const kurumsal = document.getElementById('megamenu-panel-kurumsal');
        return {
          isClosed: !root?.className.includes('isVisible'),
          kurumsalHidden: kurumsal?.getAttribute('aria-hidden') === 'true'
        };
      })()`);

      const cycleOk = openCheck.isVisible && openCheck.kurumsalOpacity === '1' && closeCheck.isClosed;
      if (!cycleOk) {
        s1Passed = false;
        console.error(`  x Döngü ${cycle} Başarısız:`, { openCheck, closeCheck });
        break;
      }
    }
    console.log(`  ✓ 10x Açma/Kapatma Döngüsü: ${s1Passed ? 'BAŞARILI (10/10 döngü kusursuz)' : 'BAŞARISIZ'}`);

    // -------------------------------------------------------------
    // SCENARIO 2: Üç Menü Arasında Yavaşça Geçiş & Yükseklik Morflanması
    // -------------------------------------------------------------
    console.log('\n[SENARYO 2] Üç menü arasında yavaşça geçiş ve dinamik yükseklik:');
    // Open Kurumsal
    await cdp.evaluate(`document.getElementById('nav-button-kurumsal').click()`);
    await sleep(800);
    const hKurumsal = await cdp.evaluate(`document.querySelector('[class*="heightContainer"]').offsetHeight`);

    // Switch -> Yatırımlarımız
    await cdp.evaluate(`document.getElementById('nav-button-yatirimlarimiz').click()`);
    await sleep(500);
    const hYatirim = await cdp.evaluate(`document.querySelector('[class*="heightContainer"]').offsetHeight`);

    // Switch -> Yatırımcı İlişkileri
    await cdp.evaluate(`document.getElementById('nav-button-yatirimci-iliskileri').click()`);
    await sleep(500);
    const hIliskiler = await cdp.evaluate(`document.querySelector('[class*="heightContainer"]').offsetHeight`);

    console.log(`  ✓ Kurumsal Yükseklik: ${hKurumsal}px`);
    console.log(`  ✓ Yatırımlarımız Yükseklik: ${hYatirim}px`);
    console.log(`  ✓ Yatırımcı İlişkileri Yükseklik: ${hIliskiler}px`);
    const s2Passed = hKurumsal > 0 && hYatirim > 0 && hIliskiler > 0;
    console.log(`  ✓ Yavaş Geçiş Testi: ${s2Passed ? 'BAŞARILI' : 'BAŞARISIZ'}`);

    // -------------------------------------------------------------
    // SCENARIO 3: Üç Menü Arasında Hızla Geçiş (Rapid Staccato Hover)
    // -------------------------------------------------------------
    console.log('\n[SENARYO 3] Üç menü arasında hızlı geçiş (50ms aralıklarla tetikleme):');
    await cdp.evaluate(`(() => {
      const b1 = document.getElementById('nav-button-kurumsal');
      const b2 = document.getElementById('nav-button-yatirimlarimiz');
      const b3 = document.getElementById('nav-button-yatirimci-iliskileri');
      b1.click();
      setTimeout(() => b2.click(), 50);
      setTimeout(() => b3.click(), 100);
    })()`);
    await sleep(850);

    const s3Result = await cdp.evaluate(`(() => {
      const p1 = document.getElementById('megamenu-panel-kurumsal');
      const p2 = document.getElementById('megamenu-panel-yatirimlarimiz');
      const p3 = document.getElementById('megamenu-panel-yatirimci-iliskileri');
      return {
        p1Opacity: Number(window.getComputedStyle(p1).opacity),
        p2Opacity: Number(window.getComputedStyle(p2).opacity),
        p3Opacity: Number(window.getComputedStyle(p3).opacity),
        p3AriaHidden: p3.getAttribute('aria-hidden'),
        panelsCount: document.querySelectorAll('[class*="panelShell"]').length
      };
    })()`);
    console.log(`  ✓ Hızlı Geçiş Son Durumu (Son panel açık kalmalı):`, s3Result);
    const s3Passed = s3Result.p3Opacity === 1 && s3Result.p3AriaHidden === 'false' && s3Result.p1Opacity === 0 && s3Result.p2Opacity === 0;
    console.log(`  ✓ Hızlı Geçiş Testi: ${s3Passed ? 'BAŞARILI' : 'BAŞARISIZ'}`);

    // Close before scenario 4
    await cdp.evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    await sleep(550);

    // -------------------------------------------------------------
    // SCENARIO 4: Açılışın Ortasında Çık ve Yeniden Gir (Mid-open Exit & Re-enter)
    // -------------------------------------------------------------
    console.log('\n[SENARYO 4] Açılışın ortasında çıkıp tekrar girme (Sıçrama kontrolü):');
    await cdp.evaluate(`document.getElementById('nav-button-kurumsal').click()`);
    await sleep(200); // 200ms into 750ms open

    const s4MidOpen = await cdp.evaluate(`(() => {
      const root = document.getElementById('megamenu-root');
      const kurumsal = document.getElementById('megamenu-panel-kurumsal');
      return {
        isOpen: root?.className.includes('isVisible'),
        kurumsalAria: kurumsal?.getAttribute('aria-hidden')
      };
    })()`);
    console.log('  [DEBUG s4MidOpen]:', s4MidOpen);

    // Mid-open: Mouse leave
    await cdp.evaluate(`document.querySelector('header').dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))`);
    await sleep(80);

    // Re-enter on Yatırımlarımız before close executes
    const clickResult = await cdp.evaluate(`(() => {
      const btn = document.getElementById('nav-button-yatirimlarimiz');
      btn.click();
      return {
        btnExists: Boolean(btn),
        btnId: btn?.id
      };
    })()`);
    console.log('  [DEBUG clickResult]:', clickResult);
    await sleep(800);

    const s4Result = await cdp.evaluate(`(() => {
      const root = document.getElementById('megamenu-root');
      const yatirim = document.getElementById('megamenu-panel-yatirimlarimiz');
      const wrapper = document.querySelector('[class*="menuWrapper"]');
      return {
        isOpen: root?.className.includes('isVisible'),
        yatirimActive: yatirim?.getAttribute('aria-hidden') === 'false',
        yatirimOpacity: yatirim ? window.getComputedStyle(yatirim).opacity : null,
        transform: wrapper ? window.getComputedStyle(wrapper).transform : null
      };
    })()`);
    console.log('  ✓ Açılırken Çıkıp Tekrar Girme Sonucu:', s4Result);
    const s4Passed = s4Result.isOpen && s4Result.yatirimActive && s4Result.yatirimOpacity === '1';
    console.log(`  ✓ Açılış Ortası Dönüş Testi: ${s4Passed ? 'BAŞARILI' : 'BAŞARISIZ'}`);

    // -------------------------------------------------------------
    // SCENARIO 5: Kapanışın Ortasında Başka Başlığa Gir (Mid-close Redirection)
    // -------------------------------------------------------------
    console.log('\n[SENARYO 5] Kapanışın ortasında başka başlığa girme:');
    // Start close by pressing escape or clicking active panel button or moving mouse away
    // First, let's close via clicking the active button or programmatic close:
    await cdp.evaluate(`(() => {
      // Trigger close by clicking active button or Escape
      const activeBtn = document.getElementById('nav-button-yatirimlarimiz');
      activeBtn.click();
    })()`);
    await sleep(150); // 150ms into 480ms close animation

    // Re-enter on Kurumsal mid-flight (reversal from in-flight retraction)
    await cdp.evaluate(`(() => {
      const btn = document.getElementById('nav-button-kurumsal');
      btn.click();
    })()`);
    await sleep(800);

    const s5Result = await cdp.evaluate(`(() => {
      const root = document.getElementById('megamenu-root');
      const kurumsal = document.getElementById('megamenu-panel-kurumsal');
      return {
        isOpen: root?.className.includes('isVisible'),
        kurumsalActive: kurumsal?.getAttribute('aria-hidden') === 'false',
        kurumsalOpacity: kurumsal ? window.getComputedStyle(kurumsal).opacity : null
      };
    })()`);
    console.log('  ✓ Kapanış Ortasında Yön Değiştirme Sonucu:', s5Result);
    const s5Passed = s5Result.isOpen && s5Result.kurumsalActive && s5Result.kurumsalOpacity === '1';
    console.log(`  ✓ Kapanış Ortası Yön Değiştirme Testi: ${s5Passed ? 'BAŞARILI' : 'BAŞARISIZ'}`);

    // -------------------------------------------------------------
    // SCENARIO 6: Escape ile Kapat ve Odağın Menüyü Tekrar Açmadığını Doğrula
    // -------------------------------------------------------------
    console.log('\n[SENARYO 6] Escape ile kapatma ve odak iadesi hijyeni:');
    // Focus the active trigger
    await cdp.evaluate(`document.getElementById('nav-button-kurumsal').focus()`);
    // Press Escape
    await cdp.evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    await sleep(550);

    const s6Result = await cdp.evaluate(`(() => {
      const root = document.getElementById('megamenu-root');
      const activeElement = document.activeElement;
      return {
        isClosed: !root?.className.includes('isVisible'),
        focusedButtonId: activeElement?.id,
        rootInert: root?.hasAttribute('inert')
      };
    })()`);
    console.log('  ✓ Escape Kapanış ve Odak Durumu:', s6Result);
    const s6Passed = s6Result.isClosed && s6Result.focusedButtonId === 'nav-button-kurumsal';
    console.log(`  ✓ Escape ve Odak Hijyeni Testi: ${s6Passed ? 'BAŞARILI (Odak butonda, menü kapalı)' : 'BAŞARISIZ'}`);

    // -------------------------------------------------------------
    // TRANSITION END FRAME STABILITY CHECK (Son Karelerde Sıçrama Kontrolü)
    // -------------------------------------------------------------
    console.log('\n[GEÇİŞ SONU KARARLILIK KONTROLÜ] Açılışın son karelerinde y ve height sıçramamalı:');
    await cdp.evaluate(`document.getElementById('nav-button-kurumsal').click()`);
    await sleep(650); // wait until near completion of 750ms open animation
    const samples = [];
    for (let t = 700; t <= 900; t += 50) {
      const sample = await cdp.evaluate(`(() => {
        const wrapper = document.querySelector('[class*="menuWrapper"]');
        const heightContainer = document.querySelector('[class*="heightContainer"]');
        return {
          transform: wrapper ? window.getComputedStyle(wrapper).transform : null,
          height: heightContainer ? heightContainer.offsetHeight : null
        };
      })()`);
      samples.push({ time: t, ...sample });
      await sleep(50);
    }
    console.log('  ✓ Son kareler örneklemeleri:', samples);
    const finalHeights = samples.map((s) => s.height);
    const heightStable = finalHeights.every((h) => h === finalHeights[finalHeights.length - 1]);
    console.log(`  ✓ Geçiş Sonu Kararlılığı: ${heightStable ? 'SIÇRAMA YOK (Sabit ve akıcı)' : 'SIÇRAMA TESPİT EDİLDİ'}`);

    console.log('\n======================================================');
    console.log('--- TÜM DOĞRULAMA SENARYOLARI TAMAMLANDI ---');
    console.log(`GENEL SONUÇ: ${s1Passed && s2Passed && s3Passed && s4Passed && s5Passed && s6Passed && heightStable ? 'TÜM TESTLER BAŞARIYLA GEÇTİ' : 'BAZI TESTLER BAŞARISIZ'}`);
    console.log('======================================================\n');

    cdp.close();
  } finally {
    chromeProcess.kill('SIGKILL');
  }
}

runMotionAudit(process.argv[2] || 'http://127.0.0.1:5173/').catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
