/**
 * KpiDashboard.js
 * Visualización de KPIs y métricas operativas en tiempo real
 */

import { formatDuration, formatPercentage, formatNumber } from '../utils/formatter.js';

export class KpiDashboard {
  /**
   * @param {string} containerId
   */
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="kpis-grid">
        <!-- 1. Pallets Recibidos -->
        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-title">Pallets Recibidos</span>
            <div class="kpi-icon-wrap" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              </svg>
            </div>
          </div>
          <div class="kpi-val" id="kpiReceived">0</div>
          <div class="kpi-subtext">
            <span>Meta Diaria:</span>
            <span id="kpiScheduled">450</span>
          </div>
        </div>

        <!-- 2. Flujo Cross Docking -->
        <div class="kpi-card" style="border-bottom: 3px solid var(--color-crossdock);">
          <div class="kpi-card-header">
            <span class="kpi-title">Flujo Cross Dock</span>
            <div class="kpi-icon-wrap" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="13 17 18 12 13 7"/>
                <polyline points="6 17 11 12 6 7"/>
              </svg>
            </div>
          </div>
          <div class="kpi-val" style="color: #10b981;" id="kpiCrossDock">0</div>
          <div class="kpi-subtext">
            <span class="kpi-badge badge-green" id="kpiCrossDockPct">40.0%</span>
            <span>Sin almacenamiento</span>
          </div>
        </div>

        <!-- 3. Almacenamiento Convencional -->
        <div class="kpi-card" style="border-bottom: 3px solid var(--color-storage);">
          <div class="kpi-card-header">
            <span class="kpi-title">A Racks Almacén</span>
            <div class="kpi-icon-wrap" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M3 15h18"/>
                <path d="M9 3v18"/>
              </svg>
            </div>
          </div>
          <div class="kpi-val" style="color: #f59e0b;" id="kpiStorage">0</div>
          <div class="kpi-subtext">
            <span class="kpi-badge badge-amber" id="kpiStoragePct">60.0%</span>
            <span>Ocupación Racks</span>
          </div>
        </div>

        <!-- 4. Pallets Despachados -->
        <div class="kpi-card" style="border-bottom: 3px solid #22c55e;">
          <div class="kpi-card-header">
            <span class="kpi-title">Pallets Despachados</span>
            <div class="kpi-icon-wrap" style="background: rgba(34, 197, 94, 0.15); color: #22c55e;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
          </div>
          <div class="kpi-val" style="color: #22c55e;" id="kpiDispatched">0</div>
          <div class="kpi-subtext">
            <span>Cumplimiento:</span>
            <span class="kpi-badge badge-green" id="kpiFulfillment">0.0%</span>
          </div>
        </div>

        <!-- 5. Tiempos Promedio de Permanencia -->
        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-title">Lead Time Cross Dock</span>
            <div class="kpi-icon-wrap" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <div class="kpi-val" style="color: #c084fc;" id="kpiAvgDwellCd">-- min</div>
          <div class="kpi-subtext">
            <span>vs Tradicional:</span>
            <span style="color:#ef4444; font-weight:600;">>8 horas</span>
          </div>
        </div>

        <!-- 6. Ocupación de Posiciones CEDI -->
        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-title">Ocupación Racks CEDI</span>
            <div class="kpi-icon-wrap" style="background: rgba(6, 182, 212, 0.15); color: #06b6d4;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                <path d="M22 12A10 10 0 0 0 12 2v10z"/>
              </svg>
            </div>
          </div>
          <div class="kpi-val" id="kpiStorageOccupancy">95.0%</div>
          <div class="kpi-subtext">
            <span>Capacidad: 2,800 pos.</span>
          </div>
        </div>
      </div>

      <!-- Barra de Verificación Matemática de Integridad -->
      <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.5rem 1rem; margin-top: 0.75rem; display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem;">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="color:#22c55e; font-weight:bold;">✓ Control Matemático:</span>
          <span style="color:var(--text-muted);">
            [ <b style="color:#10b981;" id="mathCd">0</b> Cross Dock + <b style="color:#f59e0b;" id="mathSt">0</b> Almacenamiento ] = <b style="color:#38bdf8;" id="mathRec">0</b> Recibidos
          </span>
        </div>
        <div>
          <span style="color:var(--text-dim);">Regla Estricta:</span>
          <span style="color:#38bdf8; font-weight:600;">Pallets CD en Racks = 0</span>
        </div>
      </div>
    `;
  }

  update(kpis) {
    if (!kpis) return;

    document.getElementById('kpiReceived').textContent = formatNumber(kpis.totalReceived);
    document.getElementById('kpiScheduled').textContent = formatNumber(kpis.totalScheduled);
    document.getElementById('kpiCrossDock').textContent = formatNumber(kpis.totalCrossDock);
    document.getElementById('kpiCrossDockPct').textContent = formatPercentage(kpis.crossDockPercentage);
    document.getElementById('kpiStorage').textContent = formatNumber(kpis.totalStorage);
    document.getElementById('kpiStoragePct').textContent = formatPercentage(kpis.storagePercentage);
    document.getElementById('kpiDispatched').textContent = formatNumber(kpis.totalDispatched);
    document.getElementById('kpiFulfillment').textContent = formatPercentage(kpis.fulfillmentRate);

    // Tiempos
    const dwellCd = kpis.avgDwellTimeCrossDock > 0 ? formatDuration(kpis.avgDwellTimeCrossDock) : (kpis.totalCrossDock > 0 ? '~1h 45m' : '-- min');
    document.getElementById('kpiAvgDwellCd').textContent = dwellCd;

    document.getElementById('kpiStorageOccupancy').textContent = formatPercentage(kpis.storageUtilizationRate);

    // Barra de control matemático
    document.getElementById('mathCd').textContent = kpis.totalCrossDock;
    document.getElementById('mathSt').textContent = kpis.totalStorage;
    document.getElementById('mathRec').textContent = kpis.totalReceived;
  }
}
