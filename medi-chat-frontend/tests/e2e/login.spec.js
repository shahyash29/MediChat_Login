const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const os = require('os');
const path = require('path');

describe('MediChat E2E - Register Flow', function () {
  let driver;
  this.timeout(180000);

  const baseUrl = process.env.FRONTEND_URL || 'http://frontend:3000';
  const FRONTEND = `${baseUrl}/medichat`;

  before(async () => {
    const builder = new Builder().forBrowser('chrome');
    const tmpProfile = path.join(os.tmpdir(), `selenium-${Date.now()}`);
    const options = new chrome.Options()
      .addArguments(
        '--headless',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        `--user-data-dir=${tmpProfile}`
      );
    builder.setChromeOptions(options);
    if (process.env.SELENIUM_URL) {
      builder.usingServer(process.env.SELENIUM_URL);
    }
    driver = await builder.build();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  async function send(text) {
    const before = await driver.findElements(By.css('.msg.bot .message-text'));
    const n0 = before.length;
    const input = await driver.wait(
      until.elementLocated(By.css('.chat-input input')),
      15000
    );
    await driver.wait(until.elementIsVisible(input), 5000);
    await driver.wait(until.elementIsEnabled(input), 5000);
    await input.sendKeys(text, Key.RETURN);
    const msg = await driver.wait(
      async () => {
        const after = await driver.findElements(By.css('.msg.bot .message-text'));
        if (after.length !== n0) return after[after.length - 1].getText();
        return false;
      },
      90000
    );
    return msg;
  }

  async function waitFor(pattern, timeout = 90000) {
    const start = Date.now();
    return driver.wait(
      async () => {
        const msgs = await driver.findElements(By.css('.msg.bot .message-text'));
        if (!msgs.length) return false;
        const last = await msgs[msgs.length - 1].getText();
        return pattern.test(last) ? last : false;
      },
      timeout
    );
  }

  it('registers a new patient successfully', async () => {
    await driver.get(FRONTEND);
    await driver.sleep(2000);
    await send('register');
    await send('patient');
    await send('Test User');
    await send('P@ssw0rd!');
    await send(`test${Date.now()}@gmail.com`);
    await send('1990/01/01');
    await send('1234');
    await send('12345');
    await send('1234567890');
    const final = await waitFor(/registered/i);
    assert(/registered/i.test(final));
  });
});
