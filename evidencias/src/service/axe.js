import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

export default async function runAxe(url) {
    const browser = await chromium.launch();

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 60000
    });

    await page.waitForTimeout(5000);

    const results = await new AxeBuilder({ page }).analyze();

    await browser.close();

    return results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length
    }));
}