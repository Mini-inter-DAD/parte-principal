import { getImpactColor } from '../utils/formatter.js';

export function generateHTML({ url, lighthouse, axe }) {
    const scoreColor =
        lighthouse.score > 80 ? '#22c55e' :
            lighthouse.score > 50 ? '#facc15' : '#ef4444';

    return `
  <html>
  <head>
    <title>Accessibility Report</title>

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', sans-serif;
        background: linear-gradient(135deg, #0f172a, #020617);
        color: white;
        padding: 40px;
      }

      h1 {
        font-size: 32px;
        margin-bottom: 10px;
      }

      .subtitle {
        color: #94a3b8;
        margin-bottom: 30px;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .card {
        background: rgba(30, 41, 59, 0.6);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      }

      .score-circle {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 10px solid ${scoreColor};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        font-weight: bold;
        margin: 20px auto;
      }

      .bar {
        height: 10px;
        border-radius: 10px;
        background: #1e293b;
        overflow: hidden;
        margin-top: 10px;
      }

      .bar-fill {
        height: 100%;
        width: ${lighthouse.score}%;
        background: ${scoreColor};
        transition: width 1s ease;
      }

      .issues {
        margin-top: 20px;
        max-height: 400px;
        overflow-y: auto;
      }

      .issue {
        background: rgba(255,255,255,0.03);
        border-radius: 10px;
        padding: 10px;
        margin-bottom: 10px;
        border-left: 5px solid;
        transition: transform 0.2s;
      }


      .badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        margin-bottom: 5px;
        font-weight: bold;
      }

      .footer {
        margin-top: 40px;
        color: #64748b;
        font-size: 12px;
      }
    </style>
  </head>

  <body>
    <h1>Accessibility Report</h1>
    <p class="subtitle">${url}</p>

    <div class="grid">
      
      <div class="card">
        <h2>Lighthouse Score</h2>

        <div class="score-circle">
          ${lighthouse.score}
        </div>

        <div class="bar">
          <div class="bar-fill"></div>
        </div>
      </div>

      <div class="card">
        <h2>Resumo</h2>
        <p>Total de issues: <strong>${axe.length}</strong></p>
        <p>Críticas: <strong>${axe.filter(a => a.impact === 'critical').length}</strong></p>
        <p>Sérias: <strong>${axe.filter(a => a.impact === 'serious').length}</strong></p>
      </div>

    </div>

    <div class="card" style="margin-top:20px;">
      <h2>Issues detectadas (Axe)</h2>

      <div class="issues">
        ${axe.map(v => `
          <div class="issue" style="border-color:${getImpactColor(v.impact)}">
            <div class="badge" style="background:${getImpactColor(v.impact)}">
              ${v.impact}
            </div>

            <strong>${v.id}</strong><br/>
            ${v.description}<br/>
            <small>Elementos afetados: ${v.nodes}</small>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="footer">
      Gerado com Lighthouse + Axe
    </div>
  </body>
  </html>
  `;
}