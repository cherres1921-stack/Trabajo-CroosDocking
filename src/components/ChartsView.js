/**
 * ChartsView.js
 * Gráficos analíticos dinámicos del CEDI LogiSur
 * (Flujo acumulado en el tiempo, Pallets por destino y Comparativa de Lead Times)
 */

export class ChartsView {
  /**
   * @param {string} containerId
   */
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.historyData = {
      timestamps: [],
      received: [],
      dispatched: []
    };
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.25rem;">
        <!-- Gráfico 1: Curva de Flujo Acumulativo -->
        <div class="chart-card">
          <div class="card-title-bar">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Curva de Entrada vs Salida (Throughput)
            </h3>
          </div>
          <div class="chart-wrapper">
            <canvas id="flowThroughputCanvas"></canvas>
          </div>
        </div>

        <!-- Gráfico 2: Distribución por Destino -->
        <div class="chart-card">
          <div class="card-title-bar">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                <path d="M18 20V10"/>
                <path d="M12 20V4"/>
                <path d="M6 20v-6"/>
              </svg>
              Pallets por Destino (Tacna, Cusco, Puno)
            </h3>
          </div>
          <div class="chart-wrapper">
            <canvas id="destinationsCanvas"></canvas>
          </div>
        </div>
      </div>
    `;

    this.flowCanvas = document.getElementById('flowThroughputCanvas');
    this.destCanvas = document.getElementById('destinationsCanvas');
  }

  update(tickData) {
    const kpis = tickData.kpis;
    if (!kpis) return;

    // Registrar histórico cada 15 min simulados
    const simMins = Math.floor(tickData.simTimeMinutes);
    if (this.historyData.timestamps.length === 0 || simMins - this.historyData.timestamps[this.historyData.timestamps.length - 1] >= 15) {
      this.historyData.timestamps.push(simMins);
      this.historyData.received.push(kpis.totalReceived);
      this.historyData.dispatched.push(kpis.totalDispatched);

      if (this.historyData.timestamps.length > 50) {
        this.historyData.timestamps.shift();
        this.historyData.received.shift();
        this.historyData.dispatched.shift();
      }
    }

    this.drawFlowChart(kpis);
    this.drawDestinationsChart(kpis);
  }

  drawFlowChart(kpis) {
    const canvas = this.flowCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.parentElement.clientWidth);
    const h = (canvas.height = canvas.parentElement.clientHeight);

    ctx.clearRect(0, 0, w, h);

    const padL = 45, padR = 20, padT = 25, padB = 35;
    const graphW = w - padL - padR;
    const graphH = h - padT - padB;

    const maxVal = Math.max(kpis.totalScheduled || 450, 100);

    // Ejes y Cuadrícula
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = padT + (graphH / 4) * i;
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), 10, y + 3);
    }
    ctx.stroke();

    const dataLen = this.historyData.timestamps.length;
    if (dataLen < 2) return;

    // Dibujar Curva Recibidos (Cyan)
    this.drawLineSeries(ctx, this.historyData.received, '#06b6d4', maxVal, padL, padT, graphW, graphH);

    // Dibujar Curva Despachados (Verde)
    this.drawLineSeries(ctx, this.historyData.dispatched, '#10b981', maxVal, padL, padT, graphW, graphH);

    // Leyenda
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(w - 180, 10, 10, 10);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px sans-serif';
    ctx.fillText('Recibidos', w - 165, 18);

    ctx.fillStyle = '#10b981';
    ctx.fillRect(w - 90, 10, 10, 10);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('Despachados', w - 75, 18);
  }

  drawLineSeries(ctx, dataArr, color, maxVal, padL, padT, graphW, graphH) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    
    dataArr.forEach((val, idx) => {
      const x = padL + (idx / (dataArr.length - 1)) * graphW;
      const y = padT + graphH - (val / maxVal) * graphH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }

  drawDestinationsChart(kpis) {
    const canvas = this.destCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.parentElement.clientWidth);
    const h = (canvas.height = canvas.parentElement.clientHeight);

    ctx.clearRect(0, 0, w, h);

    const padL = 40, padR = 20, padT = 30, padB = 40;
    const graphW = w - padL - padR;
    const graphH = h - padT - padB;

    const byDest = kpis.byDestination || {
      tacna: { crossDock: 0, dispatched: 0, total: 0 },
      cusco: { crossDock: 0, dispatched: 0, total: 0 },
      puno: { crossDock: 0, dispatched: 0, total: 0 }
    };

    const dests = [
      { name: 'Tacna', data: byDest.tacna, color: '#06b6d4' },
      { name: 'Cusco', data: byDest.cusco, color: '#8b5cf6' },
      { name: 'Puno', data: byDest.puno, color: '#f59e0b' }
    ];

    const maxVal = Math.max(100, ...dests.map(d => d.data.total || 0));
    const barWidth = graphW / (dests.length * 3);

    dests.forEach((d, i) => {
      const groupX = padL + (i + 0.5) * (graphW / dests.length) - barWidth;

      // Barra 1: Cross Docking (Verde)
      const cdH = ((d.data.crossDock || 0) / maxVal) * graphH;
      ctx.fillStyle = '#10b981';
      ctx.fillRect(groupX, padT + graphH - cdH, barWidth - 4, cdH);

      // Barra 2: Despachados
      const despH = ((d.data.dispatched || 0) / maxVal) * graphH;
      ctx.fillStyle = d.color;
      ctx.fillRect(groupX + barWidth, padT + graphH - despH, barWidth - 4, despH);

      // Etiqueta del Destino
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.name, groupX + barWidth, h - 15);
    });

    ctx.textAlign = 'left';
    // Leyenda
    ctx.fillStyle = '#10b981';
    ctx.fillRect(padL, 10, 10, 10);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px sans-serif';
    ctx.fillText('Cross Dock Asignado', padL + 15, 18);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(padL + 150, 10, 10, 10);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('Despachado Total', padL + 165, 18);
  }
}
