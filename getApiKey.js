const { chromium } = require('playwright');
require('dotenv').config();
const selectors = {

    usernameInput: '//input[@id="username"]',
    passwordInput: '//input[@id="password"]',
    continueButton: '//button[text()="Continue"]',
    apiDocLink: '//a[@id="API Documentation_nav_link"]',
    generateButton: '//div[@id="apiDocumentation_generateKey_button"]',
    apiKeyInput: '//input[@type="text"]'


}
const credentials = {
    username: process.env.USERNAME,
    password: process.env.PASSWORD
}

async function enterUsername(page, username) {

    await page.waitForSelector(selectors.usernameInput);
    await page.fill(selectors.usernameInput, username);
}

async function enterPassword(page, password) {

    await page.waitForSelector(selectors.passwordInput);
    await page.fill(selectors.passwordInput, password);
}

async function clickOnContinueButton(page) {
    await page.waitForSelector(selectors.continueButton);
    await page.locator(selectors.continueButton).click();

}



async function login(page) {

    await enterUsername(page, credentials.username);
    await enterPassword(page, credentials.password);
    await clickOnContinueButton(page);

}

async function forceRedirection(page, url) {

    await page.goto(url);
    await page.WaitForRedirection(url);


}

async function clickOnApiDoc(page) {
    const linkLocator = await page.locator(selectors.apiDocLink);
    await linkLocator.click();

}
async function generateApiKey(page) {

    const btnLocator = await page.locator(selectors.generateButton);
    await btnLocator.click();
}

async function getApiKey(page) {

    await clickOnApiDoc(page);
    await page.waitForTimeout(1000);
    const inputLocator = await page.locator(selectors.apiKeyInput);
    await inputLocator.waitFor({state:'attached'});


    let apiKey;

    apiKey = await page.$eval(selectors.apiKeyInput, async function (input) {
        return await input.value;
    });
    if (apiKey == "No API Key to be displayed ,please generate one !" && apiKey.length != 44) {
        await generateApiKey(page);
        await page.waitForTimeout(2000);

    }
    apiKey = await page.$eval(selectors.apiKeyInput, async function (input) {
        return await input.value;
    });

    return apiKey;
}

async function beforeAll() {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: null });
    page = await context.newPage();
    let retryCount = 1;
    while (retryCount <= 3) {
        try {
            const webUrl = process.env.WEB_URL;
            await page.goto(webUrl);
            const btnLocator = page.locator(selectors.continueButton);
            await btnLocator.waitFor();
            await login(page);
            const apiKey = await getApiKey(page);
            console.log(`API Key: ${apiKey}`);
            break;


        } catch (error) {
            console.error(`Pre-Setup failed. Retrying... (${retryCount} attempts left)`, error);
            await page.screenshot({ path: `./Screenshots/beforeAll_retry_${retryCount}.png`, fullPage: true });
            retryCount++;
        } finally {
            await browser.close();
        }
    }

};

beforeAll();