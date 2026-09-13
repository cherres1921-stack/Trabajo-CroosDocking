/**
 * ComparisonModal.js
 * Modal interactivo para el análisis comparativo formal entre
 * Escenario 1 (Operación Tradicional) vs Escenario 2 (Cross Docking Parcial)
 */

import { formatDuration } from '../utils/formatter.js';

export class ComparisonModal {
  /**
   * @param {string} modalId
   * @param {Function} onExportComparisonCsv
   */
  constructor(modalId, onExportComparisonCsv) {
    this.modal = document.getElementById(modalId);
    this.onExportComparisonCsv = onExportComparisonCsv;
    this.comparisonData = null;
    this.renderStructure();
  }

  renderStructure() {
    this.modal.innerHTML = `
      <div class="modal-dialog" style="max-width: 950px;">
        <div class="modal-header">
          <h2>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2">
              <path d="M16 3h5v5"/>
              <path d="M4 20 21 3"/>
              <path d="M21 16v5h-5"/>
              <path d="M15 15l6 6"/>
              <path d="M4 4l5 5"/>
            </svg>
            Evaluación Comparativa: Tradicional vs Cross Docking Parcial
          </h2>
          <button class="modal-close-btn" id="btnCloseCompModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body" id="compModalBody">
          <!-- Inyectado dinámicamente -->
        </div>

        <div style="padding: 1rem 1.75rem; background: rgba(15, 23, 42, 0.95); border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.75rem; color: var(--text-muted);">
            Demostración Académica de Optimización de Centros de Distribución • LogiSur S.A.C.
          </span>
          <button class="btn btn-outline" id="btnExportCompCsv">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar Reporte CSV
          </button>
        </div>
      </div>
    `;

    document.getElementById('btnCloseCompModal').addEventListener('click', () => this.close());
    document.getElementById('btnExportCompCsv').addEventListener('click', () => {
      if (this.onExportComparisonCsv && this.comparisonData) {
        this.onExportComparisonCsv(this.comparisonData);
      }
    });

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  showComparison(comparisonData) {
    this.comparisonData = comparisonData;
    const body = document.getElementById('compModalBody');
    if (!body) return;

    const trad = comparisonData.traditional;
    const cd = comparisonData.crossDock;

    body.innerHTML = `
      <!-- Banner de Impacto / Mejoras Cuantitativas -->
      <div class="comparison-banner">
        <div>
          <div class="comp-metric-big">-${comparisonData.timeReductionPercentage}%</div>
          <div class="comp-metric-label">Reducción en Tiempo de Ciclo</div>
          <div style="font-size:0.7rem; color:var(--text-dim); margin-top:2px;">
            De ${formatDuration(trad.avgCycleTime)} a ${formatDuration(cd.avgCycleTime)}
          </div>
        </div>
        <div>
          <div class="comp-metric-big" style="color:#38bdf8;">-${comparisonData.movementsReduction}%</div>
          <div class="comp-metric-label">Movimientos Internos Evitados</div>
          <div style="font-size:0.7rem; color:var(--text-dim); margin-top:2px;">
            ${comparisonData.movementsSaved} traslados menos por día
          </div>
        </div>
        <div>
          <div class="comp-metric-big" style="color:#c084fc;">+${comparisonData.efficiencyGain}%</div>
          <div class="comp-metric-label">Incremento de Eficiencia CEDI</div>
          <div style="font-size:0.7rem; color:var(--text-dim); margin-top:2px;">
            Liberación de ${comparisonData.positionsSaved} posiciones en racks
          </div>
        </div>
      </div>

      <!-- Comparativa Lado a Lado de Escenarios -->
      <div class="comparison-grid">
        <!-- Escenario 1: Tradicional -->
        <div class="scenario-box trad">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
            <h3 style="color:#f59e0b;">1. Operación Tradicional</h3>
            <span class="status-pill status-storage">Sin Cross Dock</span>
          </div>
          <div class="scenario-flow-diagram">
            Recepción → Putaway Racks → Picking → Consolidación → Despacho
          </div>
          <ul class="scenario-stats-list">
            <li>
              <span>Tiempo promedio de ciclo:</span>
              <span class="metric-val" style="color:#ef4444;">${formatDuration(trad.avgCycleTime)} (>8h)</span>
            </li>
            <li>
              <span>Pallets almacenados en racks:</span>
              <span class="metric-val">${trad.storageCount} pallets (100%)</span>
            </li>
            <li>
              <span>Pallets en flujo Cross Dock:</span>
              <span class="metric-val">0 pallets (0%)</span>
            </li>
            <li>
              <span>Movimientos internos totales:</span>
              <span class="metric-val">${trad.totalMovements} movs</span>
            </li>
            <li>
              <span>Ocupación estimada de racks:</span>
              <span class="metric-val" style="color:#ef4444;">${trad.storageOccupancyRate}% (Saturado)</span>
            </li>
            <li>
              <span>Tasa de cumplimiento:</span>
              <span class="metric-val">${trad.fulfillmentRate}%</span>
            </li>
          </ul>
        </div>

        <!-- Escenario 2: Cross Docking Parcial -->
        <div class="scenario-box cd">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
            <h3 style="color:#10b981;">2. Cross Docking Parcial</h3>
            <span class="status-pill status-crossdock">Mejora LogiSur</span>
          </div>
          <div class="scenario-flow-diagram" style="border-color:rgba(16,185,129,0.3); color:#34d399;">
            Recepción → Clasificación → Bahía Cross Dock → Carga Inmediata
          </div>
          <ul class="scenario-stats-list">
            <li>
              <span>Tiempo promedio de ciclo:</span>
              <span class="metric-val" style="color:#10b981;">${formatDuration(cd.avgCycleTime)} (~2-4h)</span>
            </li>
            <li>
              <span>Pallets almacenados en racks:</span>
              <span class="metric-val">${cd.storageCount} pallets</span>
            </li>
            <li>
              <span>Pallets en flujo Cross Dock:</span>
              <span class="metric-val" style="color:#10b981;">${cd.crossDockCount} pallets (${cd.crossDockPercentage}%)</span>
            </li>
            <li>
              <span>Movimientos internos totales:</span>
              <span class="metric-val" style="color:#38bdf8;">${cd.totalMovements} movs</span>
            </li>
            <li>
              <span>Ocupación de racks en CEDI:</span>
              <span class="metric-val" style="color:#10b981;">${cd.storageOccupancyRate}%</span>
            </li>
            <li>
              <span>Tasa de cumplimiento:</span>
              <span class="metric-val" style="color:#22c55e;">${cd.fulfillmentRate}%</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Tabla Comparativa Académica -->
      <div>
        <h4 style="font-size:0.85rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.5rem;">
          Matriz de Indicadores Clave de Desempeño (KPIs)
        </h4>
        <div class="custom-table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Criterio Operativo</th>
                <th>Tradicional</th>
                <th>Cross Docking Parcial</th>
                <th>Impacto Logístico</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Tiempo en CEDI (Lead Time)</b></td>
                <td>${formatDuration(trad.avgCycleTime)}</td>
                <td style="color:#10b981; font-weight:700;">${formatDuration(cd.avgCycleTime)}</td>
                <td><span class="status-pill status-crossdock">-${comparisonData.timeReductionPercentage}% tiempo</span></td>
              </tr>
              <tr>
                <td><b>Movimientos por Pallet</b></td>
                <td>5 movimientos</td>
                <td style="color:#38bdf8; font-weight:700;">2 en CD / 5 en Racks</td>
                <td><span class="status-pill status-loading">-${comparisonData.movementsReduction}% manipulación</span></td>
              </tr>
              <tr>
                <td><b>Posiciones de Rack Ocupadas</b></td>
                <td>${trad.positionsOccupied} pos.</td>
                <td style="color:#10b981; font-weight:700;">${cd.positionsOccupied} pos.</td>
                <td><span class="status-pill status-crossdock">${comparisonData.positionsSaved} pos. liberadas</span></td>
              </tr>
              <tr>
                <td><b>Eficiencia Operativa</b></td>
                <td>${trad.operationalEfficiency}%</td>
                <td style="color:#22c55e; font-weight:700;">${cd.operationalEfficiency}%</td>
                <td><span class="status-pill status-dispatched">+${comparisonData.efficiencyGain}% productividad</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Conclusiones Académicas -->
      <div style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.2); border-radius:8px; padding:0.85rem 1rem; font-size:0.775rem; color:var(--text-muted); line-height:1.4;">
        <b style="color:#38bdf8;">Conclusión para el Trabajo Final:</b> 
        La implementación del Cross Docking Parcial en el CEDI Arequipa de LogiSur S.A.C. resuelve el cuello de botella estructural de ocupación al 95%, reduciendo los recorridos internos improductivos (30% de ineficiencia inicial) y asegurando el despacho ágil hacia Tacna, Cusco y Puno en menos de 3 horas para productos de alta rotación.
      </div>
    `;

    this.open();
  }

  open() {
    this.modal.classList.add('open');
  }

  close() {
    this.modal.classList.remove('open');
  }
}
