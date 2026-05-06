import fs from 'fs-extra';
import { generateHTML } from './template.js';

export default async function generateReport(data) {
    const id = Date.now();
    const reportPath = `output/reports/${id}.html`;

    const html = generateHTML(data);

    await fs.ensureDir('output/reports');
    await fs.writeFile(reportPath, html);

    return {
        id,
        url: data.url,
        report_url: reportPath,
        created_at: new Date().toISOString(),
        score: data.lighthouse.score
    };
}