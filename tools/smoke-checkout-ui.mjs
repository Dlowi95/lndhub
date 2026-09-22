import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const remotePort = 9223;
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lndhub-ui-smoke-'));
const outputDir = path.resolve('artifacts');
fs.mkdirSync(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
  '--remote-debugging-port=' + remotePort,
  '--user-data-dir=' + profileDir,
  'about:blank',
], { stdio: 'ignore', windowsHide: true });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitForJson = async (url, attempts = 50) => {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {}
    await wait(100);
  }
  throw new Error('Chrome DevTools endpoint did not become ready');
};

let socket;
try {
  const targets = await waitForJson('http://127.0.0.1:' + remotePort + '/json/list');
  const target = targets.find((item) => item.type === 'page');
  if (!target?.webSocketDebuggerUrl) throw new Error('No Chrome page target');

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let messageId = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++messageId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await wait(900);

  const storefrontCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: "(() => { const logo = document.querySelector('.brand__mark--navbar-logo img'); const heading = document.querySelector('.hero h1'); return { logoReady: Boolean(logo && logo.complete && logo.naturalWidth > 0), bodyFont: getComputedStyle(document.body).fontFamily, headingFont: heading ? getComputedStyle(heading).fontFamily : '', hasBrokenGlyph: document.body.innerText.includes('�') }; })()",
  });
  const storefront = storefrontCheck.result?.value;
  if (!storefront?.logoReady) throw new Error('Navbar logo did not load');
  if (!storefront.headingFont || storefront.headingFont.toLowerCase().includes('fredoka')) throw new Error('Vietnamese heading font was not applied');
  if (storefront.hasBrokenGlyph) throw new Error('Storefront contains a broken replacement glyph');
  const homepage = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(outputDir, 'homepage-polished-desktop.png'), homepage.data, 'base64');

  const lightThemeCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: "(() => ({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('lndhub-color-theme'), toggle: Boolean(document.querySelector('.theme-toggle')) }))()",
  });
  if (lightThemeCheck.result?.value?.theme !== 'light' || !lightThemeCheck.result?.value?.toggle) throw new Error('Light theme is not the storefront default');
  await send('Runtime.evaluate', { expression: "document.querySelector('.theme-toggle')?.click()" });
  await wait(300);
  const darkThemeCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: "(() => ({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('lndhub-color-theme') }))()",
  });
  if (darkThemeCheck.result?.value?.theme !== 'dark' || darkThemeCheck.result?.value?.stored !== 'dark') throw new Error('Dark theme did not activate or persist');
  const darkHomepage = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(outputDir, 'homepage-darkmode-desktop.png'), darkHomepage.data, 'base64');
  await send('Page.reload', { ignoreCache: true });
  await wait(700);
  const persistedThemeCheck = await send('Runtime.evaluate', { returnByValue: true, expression: "document.documentElement.dataset.theme" });
  if (persistedThemeCheck.result?.value !== 'dark') throw new Error('Dark theme was not restored after reload');
  await send('Runtime.evaluate', { expression: "document.querySelector('.theme-toggle')?.click()" });
  await wait(300);
  await send('Page.navigate', { url: 'http://localhost:3000/lndhub-sysadmin' });
  await wait(700);
  const adminThemeCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: "(() => ({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('lndhub-color-theme') }))()",
  });
  if (adminThemeCheck.result?.value?.theme !== 'dark' || adminThemeCheck.result?.value?.stored !== 'light') throw new Error('Admin theme changed the saved storefront preference');
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await wait(800);
  const returnThemeCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: "(() => ({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('lndhub-color-theme') }))()",
  });
  if (returnThemeCheck.result?.value?.theme !== 'light' || returnThemeCheck.result?.value?.stored !== 'light') throw new Error('Storefront preference was not restored after leaving admin');

  const commerceLabelsCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: "(() => ({ gptButton: Boolean(document.querySelector('.desktop-nav .nav-gpt-button')), warrantyButton: Boolean(document.querySelector('.desktop-nav .nav-warranty-button')), buyNowCount: [...document.querySelectorAll('.card-action')].filter((node) => node.textContent.includes('Mua ngay')).length, oldDetailCount: [...document.querySelectorAll('.card-action')].filter((node) => node.textContent.includes('Xem chi tiết')).length }))()",
  });
  const commerceLabels = commerceLabelsCheck.result?.value;
  if (!commerceLabels?.gptButton || !commerceLabels.warrantyButton) throw new Error('Navbar commerce actions are missing');
  if (!commerceLabels.buyNowCount || commerceLabels.oldDetailCount) throw new Error('Product CTA labels were not fully migrated to Mua ngay');

  await send('Runtime.evaluate', { expression: "document.querySelector('.desktop-nav .nav-gpt-button')?.click()" });
  await wait(350);
  const gptModalCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: "(() => { const modal = document.querySelector('.gpt-plus-modal'); const button = modal?.querySelector('.store-info-primary'); return Boolean(modal) && modal.textContent.includes('Kho quà tặng đã hết hàng miễn phí') && button?.disabled === true && !modal.textContent.includes('Cookie-Editor') && !modal.textContent.includes('Copy toàn bộ đoạn mã'); })()",
  });
  if (!gptModalCheck.result?.value) throw new Error('Disabled or empty GPT Plus gift state did not render safely');
  const gptModal = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(outputDir, 'gpt-plus-modal-desktop.png'), gptModal.data, 'base64');
  await send('Runtime.evaluate', { expression: "document.querySelector('.gpt-plus-modal .mantine-Modal-close')?.click()" });
  await wait(300);

  await send('Runtime.evaluate', { expression: "document.querySelector('.desktop-nav .nav-warranty-button')?.click()" });
  await wait(350);
  const warrantyModalCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: "Boolean(document.querySelector('.warranty-policy-modal')) && document.body.innerText.includes('Công thức hoàn tiền minh bạch')",
  });
  if (!warrantyModalCheck.result?.value) throw new Error('Warranty policy modal did not render');
  const warrantyModal = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(outputDir, 'warranty-modal-desktop.png'), warrantyModal.data, 'base64');
  await send('Runtime.evaluate', { expression: "document.querySelector('.warranty-policy-modal .mantine-Modal-close')?.click()" });
  await wait(300);

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await wait(250);
  await send('Runtime.evaluate', { expression: "document.querySelector('.mobile-nav summary')?.click()" });
  await wait(200);
  const mobileNavCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: "(() => { const menu = document.querySelector('.mobile-nav'); const gpt = menu?.querySelector('.nav-gpt-button'); const warranty = menu?.querySelector('.nav-warranty-button'); return Boolean(menu?.hasAttribute('open') && gpt && warranty && getComputedStyle(gpt).display !== 'none' && getComputedStyle(warranty).display !== 'none'); })()",
  });
  if (!mobileNavCheck.result?.value) throw new Error('Mobile navbar actions are not usable');
  const mobileNavbar = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(outputDir, 'navbar-mobile.png'), mobileNavbar.data, 'base64');
  await send('Runtime.evaluate', { expression: "document.querySelector('.mobile-nav')?.removeAttribute('open')" });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await wait(250);

  let clicked = false;
  for (let attempt = 0; attempt < 40 && !clicked; attempt += 1) {
    await wait(250);
    const result = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: "(() => { const button = document.querySelector('.product-card .card-action:not([disabled])'); if (!button) return false; button.click(); return true; })()",
    });
    clicked = Boolean(result.result?.value);
  }
  if (!clicked) throw new Error('Could not open an available product modal');
  await wait(700);

  const modalCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: "Boolean(document.querySelector('.product-modal')) && !document.body.innerText.includes('Chọn gói phù hợp')",
  });
  if (!modalCheck.result?.value) throw new Error('Modal did not render the new quantity-first UI');

  const paymentUiCheck = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: "(() => { const cards = [...document.querySelectorAll('.payment-method-card')]; const cta = document.querySelector('.modal-sticky-footer>button'); return { methods: cards.length, disabledMethods: cards.filter((item) => item.disabled).length, bankSelected: cards[0]?.getAttribute('aria-checked') === 'true', cta: cta?.textContent?.trim() || '' }; })()",
  });
  const paymentUi = paymentUiCheck.result?.value;
  if (paymentUi?.methods !== 4 || paymentUi.disabledMethods !== 3 || !paymentUi.bankSelected || !paymentUi.cta.includes('Tạo mã chuyển khoản')) {
    throw new Error('Bank transfer payment selector is not configured safely');
  }

  const desktop = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(outputDir, 'checkout-modal-desktop.png'), desktop.data, 'base64');
  await send('Runtime.evaluate', { expression: "(() => { const content = document.querySelector('.modal-content'); if (content) content.scrollTop = content.scrollHeight; })()" });
  await wait(200);
  const paymentMethods = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(outputDir, 'payment-methods-desktop.png'), paymentMethods.data, 'base64');
  const measureLayout = async () => {
    const result = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: "(() => { const rect = (selector) => { const value = document.querySelector(selector)?.getBoundingClientRect(); return value ? { top: Math.round(value.top), bottom: Math.round(value.bottom), height: Math.round(value.height) } : null; }; return { modal: rect('.product-modal'), summary: rect('.modal-product-summary'), content: rect('.modal-content'), footer: rect('.modal-sticky-footer') }; })()",
    });
    return result.result?.value;
  };
  const assertLayout = (label, layout) => {
    if (!layout?.modal || !layout.summary || !layout.content || !layout.footer) throw new Error(label + ' modal layout nodes are missing');
    if (layout.summary.bottom > layout.content.top + 2) throw new Error(label + ' summary overlaps scroll content');
    if (layout.content.bottom > layout.footer.top + 2) throw new Error(label + ' footer overlaps scroll content');
    if (layout.footer.bottom > layout.modal.bottom + 2) throw new Error(label + ' footer escapes modal');
  };
  const desktopLayout = await measureLayout();
  assertLayout('Desktop', desktopLayout);

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await wait(400);
  const mobile = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(outputDir, 'checkout-modal-mobile.png'), mobile.data, 'base64');
  const mobileLayout = await measureLayout();
  assertLayout('Mobile', mobileLayout);

  console.log(JSON.stringify({
    desktop: path.join(outputDir, 'checkout-modal-desktop.png'),
    mobile: path.join(outputDir, 'checkout-modal-mobile.png'),
    homepage: path.join(outputDir, 'homepage-polished-desktop.png'),
    darkHomepage: path.join(outputDir, 'homepage-darkmode-desktop.png'),
    gptPlusModal: path.join(outputDir, 'gpt-plus-modal-desktop.png'),
    warrantyModal: path.join(outputDir, 'warranty-modal-desktop.png'),
    mobileNavbar: path.join(outputDir, 'navbar-mobile.png'),
    paymentMethods: path.join(outputDir, 'payment-methods-desktop.png'),
    storefront,
    themes: { default: lightThemeCheck.result?.value, dark: darkThemeCheck.result?.value, persistedAfterReload: persistedThemeCheck.result?.value, admin: adminThemeCheck.result?.value, restoredAfterAdmin: returnThemeCheck.result?.value },
    commerceLabels,
    modalOpened: true,
    removedPackageHeading: true,
    paymentUi,
    desktopLayout,
    mobileLayout,
  }, null, 2));
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill();
  await wait(200);
  if (profileDir.startsWith(os.tmpdir())) {
    try {
      fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
    } catch (error) {
      console.warn('Skipped locked Chrome profile cleanup:', error.code || error.message);
    }
  }
}
