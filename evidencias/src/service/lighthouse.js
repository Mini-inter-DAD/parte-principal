import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

export default async function runLighthouse(url) {
    const chrome = await launch({
        chromeFlags: ['--headless', '--no-sandbox']
    });

    const result = await lighthouse(url, {
        port: chrome.port,
        output: 'json',
        onlyCategories: ['accessibility']
    });

    await chrome.kill();

    return {
        score: result.lhr.categories.accessibility.score * 100,
        audits: result.lhr.audits
    };
}