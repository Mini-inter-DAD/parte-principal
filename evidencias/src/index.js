import runLighthouse from './service/lighthouse.js';
import runAxe from './service/axe.js';
import generateReport from './report/generateReport.js';
import generateHub from './report/generateHub.js';
import { saveReport } from './utils/history.js';

async function main() {
    const url = process.argv[2];

    if (!url) {
        console.log('Uso: node src/index.js https://site.com');
        return;
    }

    console.log('Rodando Lighthouse...');
    const lighthouseResult = await runLighthouse(url);

    console.log('Rodando axe...');
    const axeResult = await runAxe(url);

    console.log('Gerando relatório...');
    const reportMeta = await generateReport({
        url,
        lighthouse: lighthouseResult,
        axe: axeResult
    });

    await saveReport(reportMeta);
    await generateHub();

    console.log('Relatório criado:', reportMeta.report_url);
    console.log('Hub:', 'output/index.html');
}

main();