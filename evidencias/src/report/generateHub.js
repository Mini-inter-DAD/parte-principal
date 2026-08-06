import fs from 'fs-extra';
import { getReports } from '../utils/history.js';

export default async function generateHub() {
  const reports = await getReports();

  const html = `
  <html>
  <head>
    <title>Reports Hub</title>

    <style>
      body {
        font-family: Arial;
        background: #020617;
        color: white;
        padding: 40px;
      }

      h1 {
        margin-bottom: 20px;
      }

      .card {
        background: #1e293b;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 10px;
        transition: 0.2s;
      }

      .card:hover {
        transform: scale(1.02);
      }

      a {
        color: #38bdf8;
        text-decoration: none;
      }

      .score {
        float: right;
        font-weight: bold;
      }
    </style>
  </head>

  <body>
    <h1>Accessibility Reports</h1>

    ${reports.map(r => `
      <div class="card">
        <div>
          <strong>${r.url}</strong>
          <span class="score">${r.score}</span>
        </div>

        <div>
          <small>${r.created_at}</small>
        </div>

        <div>
          <a href="./reports/${r.id}.html" target="_blank">
            Ver relatório
          </a>
        </div>
      </div>
    `).join('')}
  </body>
  </html>
  `;

  await fs.writeFile('output/index.html', html);
}