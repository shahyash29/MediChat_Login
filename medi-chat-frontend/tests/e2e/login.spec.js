// const { Builder, By, Key, until } = require('selenium-webdriver');
// const assert = require('assert');

// describe('MediChat E2E - Register Flow', function () {
//   let driver;
//   this.timeout(120000);

//     const baseUrl = process.env.FRONTEND_URL || 'http://frontend:3000';
//     const FRONTEND = `${baseUrl}/medichat`;


//   before(async () => {
//     console.log('>>> Starting WebDriver...');
//     driver = await new Builder()
//       .forBrowser('chrome')
//       .usingServer('http://localhost:4444/wd/hub')
//       .build();
//     console.log('>>> WebDriver ready');
//   });

//   after(async () => {
//     if (driver) await driver.quit();
//   });

//   it('registers a new patient successfully', async () => {
//     await driver.get(FRONTEND);
//     console.log('>>> Page loaded');
//     await driver.sleep(2000);

//     const send = async (text) => {
//       console.log(`>>> Sending: ${text}`);
//       // capture how many bot messages we have before sending
//       const before = await driver.findElements(By.css('.msg.bot .message-text'));
//       const countBefore = before.length;

//       await driver.wait(until.elementLocated(By.css('.chat-input input')), 15000);
//       const input = await driver.findElement(By.css('.chat-input input'));
//       await driver.wait(until.elementIsVisible(input), 5000);
//       await driver.wait(until.elementIsEnabled(input), 5000);
//       await input.sendKeys(text, Key.RETURN);

//       // wait for ANY change in the number of bot messages (new spinner or final text)
//       const newMessage = await driver.wait(async () => {
//         // const after = await driver.findElements(By.css('.msg.bot .message-text'));
//         const last = await driver.findElement(By.css('.msg.bot .message-text:last-child'));
//         const txt  = await last.getText();
//         return txt !== '⏳ Registering your account…' ? txt : false;
//         // if (after.length !== countBefore) {
//         //   return await after[after.length - 1].getText();
//         // }
//         // return false;
//       }, 90000, 'Timed out waiting for bot response');

//       console.log(`>>> Bot said: ${newMessage}`);
//       return newMessage;
//     };

//     const waitForBotReply = async (pattern, timeout = 90000) => {
//       const start = Date.now();
//       return await driver.wait(async () => {
//         const messages = await driver.findElements(By.css('.msg.bot .message-text'));
//         if (messages.length === 0) return false;
//         const last = await messages[messages.length - 1].getText();
//         const seconds = Math.floor((Date.now() - start) / 1000);
//         console.log(`>>> [${seconds}s] Waiting… Bot last said: ${last}`);
//         return pattern.test(last) ? last : false;
//       }, timeout, `Timed out waiting for bot reply matching: ${pattern}`);
//     };

//     await send('register');
//     await send('patient');
//     await send('Test User');
//     await send('P@ssw0rd!');
//     await send(`test${Date.now()}@gmail.com`);
//     await send('1990/01/01');
//     await send('1234');
//     await send('12345');
//     await send('1234567890');

//     const finalMessage = await waitForBotReply(/registered/i, 90000);
//     console.log('>>> Final bot message:', finalMessage);
//     assert(/registered/i.test(finalMessage));
//   });
// });
const { Builder, By, Key, until } = require('selenium-webdriver');
const assert = require('assert');

describe('MediChat E2E - Register Flow', function () {
  let driver;
  this.timeout(120000);

  const baseUrl  = process.env.FRONTEND_URL || 'http://frontend:3000';
  const FRONTEND = `${baseUrl}/medichat`;

  before(async () => {
    console.log('>>> Starting WebDriver...');
    driver = await new Builder()
      .forBrowser('chrome')
      .usingServer('http://localhost:4444/wd/hub')
      .build();
    console.log('>>> WebDriver ready');
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  const send = async (text) => {
    console.log(`>>> Sending: ${text}`);

    const before = await driver.findElements(By.css('.msg.bot .message-text'));
    const countBefore = before.length;

    await driver.wait(until.elementLocated(By.css('.chat-input input')), 15000);
    const input = await driver.findElement(By.css('.chat-input input'));
    await driver.wait(until.elementIsVisible(input), 5000);
    await driver.wait(until.elementIsEnabled(input), 5000);
    await input.sendKeys(text, Key.RETURN);

    const newMessage = await driver.wait(async () => {
      await driver.wait(until.elementLocated(By.css('.msg.bot .message-text')), 15000);
      const last = await driver.findElement(By.css('.msg.bot .message-text:last-child'));
      const txt = await last.getText();
      if (txt !== '⏳ Registering your account…') return txt;

      const after = await driver.findElements(By.css('.msg.bot .message-text'));
      if (after.length !== countBefore) {
        return await after[after.length - 1].getText();
      }
      return false;
    }, 90000, 'Timed out waiting for bot response');

    console.log(`>>> Bot said: ${newMessage}`);
    return newMessage;
  };

  const waitForBotReply = async (pattern, timeout = 90000) => {
    await driver.wait(until.elementLocated(By.css('.msg.bot .message-text')), 15000);
    const start = Date.now();

    return driver.wait(async () => {
      try {
        const bubbles = await driver.findElements(By.css('.msg.bot .message-text'));
        if (!bubbles.length) return false;

        const lastTxt = await bubbles[bubbles.length - 1].getText();
        if (pattern.test(lastTxt)) return lastTxt;

        const secs = Math.floor((Date.now() - start) / 1000);
        console.log(`>>> [${secs}s] Waiting… Bot last said: ${lastTxt}`);
        return false;
      } catch (e) {
        if (e.name !== 'StaleElementReferenceError') throw e;
        return false;
      }
    }, timeout, `Timed out waiting for bot reply matching: ${pattern}`);
  };

  it('registers a new patient successfully', async () => {
    await driver.get(FRONTEND);
    console.log('>>> Page loaded');
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

    const finalMessage = await waitForBotReply(/registered/i, 90000);
    console.log('>>> Final bot message:', finalMessage);
    assert(/registered/i.test(finalMessage));
  });
});
