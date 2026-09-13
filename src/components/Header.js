/**
 * Header.js
 * Encabezado superior con branding LogiSur S.A.C., CEDI Arequipa, reloj simulado y accesos rápidos
 */

import { formatSimulatedTime } from '../utils/formatter.js';

export class Header {
  constructor(containerId, onOpenComparison, onExportCsv) {
    this.container = document.getElementById(containerId);
    this.onOpenComparison = onOpenComparison;
    this.onExportCsv = onExportCsv;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <header class="main-header">
        <div class="header-inner">
          <!-- Branding y Título -->
          <div class="brand-section">
            <div class="brand-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                <path d="m3.3 7 8.7 5 8.7-5"/>
                <path d="M12 22V12"/>
              </svg>
            </div>
            <div class="brand-title-wrap">
              <h1>
                LogiSur S.A.C.
                <span class="academic-badge">Simulador CEDI Arequipa</span>
              </h1>
              <div class="brand-subtitle">
                <span>Centro de Distribución Principal</span>
                <span>•</span>
                <span>Cross Docking Parcial (Tacna • Cusco • Puno)</span>
              </div>
            </div>
          </div>

          <!-- Reloj de Simulación -->
          <div class="header-clock">
            <div class="clock-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <div class="live-pulse" id="headerClockPulse"></div>
            </div>
            <div>
              <div class="clock-label">Hora Simulación</div>
              <div class="clock-text" id="simTimeDisplay">06:00 AM</div>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="header-actions">
            <button class="btn btn-accent-purple" id="btnOpenComparison">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 3h5v5"/>
                <path d="M4 20 21 3"/>
                <path d="M21 16v5h-5"/>
                <path d="M15 15l6 6"/>
                <path d="M4 4l5 5"/>
              </svg>
              Comparar Escenarios
            </button>
            <button class="btn btn-outline" id="btnExportCsv">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar CSV
            </button>
          </div>
        </div>
      </header>
    `;

    // Eventos
    document.getElementById('btnOpenComparison').addEventListener('click', () => {
      if (this.onOpenComparison) this.onOpenComparison();
    });

    document.getElementById('btnExportCsv').addEventListener('click', () => {
      if (this.onExportCsv) this.onExportCsv();
    });
  }

  updateTime(simMinutes, isRunning) {
    const display = document.getElementById('simTimeDisplay');
    const pulse = document.getElementById('headerClockPulse');
    if (display) {
      display.textContent = formatSimulatedTime(simMinutes);
    }
    if (pulse) {
      pulse.style.display = isRunning ? 'block' : 'none';
    }
  }
}
