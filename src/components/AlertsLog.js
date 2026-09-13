/**
 * AlertsLog.js
 * Registro en tiempo real de eventos, alertas de congestión y avisos operativos
 */

import { formatSimulatedTime } from '../utils/formatter.js';

export class AlertsLog {
  /**
   * @param {string} containerId
   */
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.alerts = [];
    this.currentFilter = 'ALL';
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="card">
        <div class="card-title-bar">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Registro de Eventos y Alertas
          </h3>
          <span style="font-size:0.75rem; color:var(--text-muted);" id="alertCountBadge">0 eventos</span>
        </div>

        <div class="alerts-feed" id="alertsList">
          <div style="text-align:center; padding:2rem; color:var(--text-dim); font-size:0.8rem;">
            Esperando inicio de simulación...
          </div>
        </div>
      </div>
    `;
  }

  update(alerts) {
    this.alerts = alerts || [];
    const listEl = document.getElementById('alertsList');
    const badgeEl = document.getElementById('alertCountBadge');
    if (!listEl) return;

    if (badgeEl) badgeEl.textContent = `${this.alerts.length} eventos`;

    if (this.alerts.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:2rem; color:var(--text-dim); font-size:0.8rem;">
          No hay alertas registradas aún.
        </div>
      `;
      return;
    }

    listEl.innerHTML = this.alerts.map(a => `
      <div class="alert-item ${a.type}">
        <div style="flex:1;">
          <h4>${a.title}</h4>
          <p>${a.message}</p>
        </div>
        <span class="alert-time">${formatSimulatedTime(a.time)}</span>
      </div>
    `).join('');
  }
}
