import fs from 'fs-extra';

export default async function generateReport(data) {
  const { url, lighthouse, axe } = data;

  const html = `
  <html>
  <body>
    <h1>Relatório</h1>
    <p>${url}</p>
    <h2>Score: ${lighthouse.score}</h2>

    <h3>Erros:</h3>
    ${axe.map(v => `
      <div>
        <b>${v.id}</b> (${v.impact})<br/>
        ${v.description}<br/>
        Elementos: ${v.nodes}
      </div>
    `).join('')}
  </body>
  </html>
  `;

  await fs.writeFile(url
    .replace("https://www.", "")
    .replace("/", "")
    .replace("https:", "")
    .concat('.html'), html);
}