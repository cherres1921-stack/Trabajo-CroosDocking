/**
 * PalletInspector.js
 * Inspector interactivo y modal de trazabilidad completa por pallet
 */

import { formatSimulatedTime, formatDuration, formatStateLabel, getStateColorClass } from '../utils/formatter.js';

export class PalletInspector {
  /**
   * @param {string} modalId
   */
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.currentPallet = null;
    this.renderModalStructure();
  }

  renderModalStructure() {
    this.modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              <path d="m3.3 7 8.7 5 8.7-5"/>
              <path d="M12 22V12"/>
            </svg>
            Trazabilidad Detallada del Pallet
          </h2>
          <button class="modal-close-btn" id="btnClosePalletModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" id="palletModalBody">
          <!-- Contenido inyectado dinámicamente -->
        </div>
      </div>
    `;

    document.getElementById('btnClosePalletModal').addEventListener('click', () => {
      this.close();
    });

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  inspectPallet(pallet) {
    this.currentPallet = pallet;
    const body = document.getElementById('palletModalBody');
    if (!body) return;

    const isCrossDock = pallet.type === 'CROSS_DOCK';
    const ts = pallet.timestamps || {};

    const steps = [
      { label: 'Recepción', key: 'received', state: 'RECEIVED' },
      { label: 'Control de Calidad', key: 'checking', state: 'CHECKING' },
      { label: 'Clasificación', key: 'classified', state: 'CLASSIFIED' },
      { 
        label: isCrossDock ? 'Bahía Cross Dock' : 'Almacenamiento (Racks)', 
        key: isCrossDock ? 'cross_dock' : 'storage', 
        state: isCrossDock ? 'CROSS_DOCK' : 'STORAGE' 
      },
      ...(isCrossDock ? [] : [{ label: 'Picking de Racks', key: 'picking', state: 'PICKING' }]),
      { label: 'Consolidación', key: 'consolidation', state: 'CONSOLIDATION' },
      { label: 'Carga en Camión', key: 'loading', state: 'LOADING' },
      { label: 'Despachado', key: 'dispatched', state: 'DISPATCHED' }
    ];

    body.innerHTML = `
      <!-- Cabecera de Datos del Pallet -->
      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1rem; background:rgba(15,23,42,0.6); padding:1rem; border-radius:10px; border:1px solid rgba(255,255,255,0.06);">
        <div>
          <div style="font-size:1.15rem; font-weight:800; font-family:var(--font-mono); color:#38bdf8; display:flex; align-items:center; gap:0.5rem;">
            ${pallet.id}
            <span class="status-pill ${getStateColorClass(pallet.state)}">${formatStateLabel(pallet.state)}</span>
          </div>
          <div style="font-size:0.95rem; font-weight:700; color:white; margin-top:0.35rem;">
            ${pallet.description}
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">
            SKU: <b style="color:#f8fafc;">${pallet.sku}</b> | Categoría: <b>${pallet.category}</b> | Proveedor: <b>${pallet.supplier}</b>
          </div>
        </div>

        <div style="text-align:right; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <span style="font-size:0.7rem; color:var(--text-dim); text-transform:uppercase;">Tipo de Flujo</span>
            <div style="font-weight:800; font-size:0.85rem; color:${isCrossDock ? '#10b981' : '#f59e0b'};">
              ${isCrossDock ? '⚡ CROSS DOCKING DIRECTO' : '📦 ALMACENAMIENTO CONVENCIONAL'}
            </div>
          </div>
          <div>
            <span style="font-size:0.7rem; color:var(--text-dim); text-transform:uppercase;">Destino</span>
            <div style="font-weight:700; font-size:0.85rem; color:${pallet.destinationColor || '#fff'};">
              📍 ${pallet.destinationName || pallet.destination}
            </div>
          </div>
        </div>
      </div>

      <!-- Línea de Tiempo de Estados y Dwell Times -->
      <div>
        <h4 style="font-size:0.85rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em;">
          Línea de Vida y Tiempos de Permanencia
        </h4>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          ${steps.map((step, idx) => {
            const timeVal = ts[step.key];
            const isCompleted = timeVal !== null && timeVal !== undefined;
            const timeFormatted = isCompleted ? formatSimulatedTime(timeVal) : 'Pendiente';
            
            return `
              <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.25); padding:0.5rem 0.85rem; border-radius:6px; border-left:3px solid ${isCompleted ? '#22c55e' : 'rgba(255,255,255,0.1)'};">
                <div style="display:flex; align-items:center; gap:0.6rem;">
                  <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-dim);">0${idx + 1}</span>
                  <span style="font-size:0.8rem; font-weight:600; color:${isCompleted ? '#fff' : 'var(--text-dim)'};">${step.label}</span>
                </div>
                <div style="font-family:var(--font-mono); font-size:0.8rem; color:${isCompleted ? '#38bdf8' : 'var(--text-dim)'};">
                  ${timeFormatted}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Métricas de Resumen del Pallet -->
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:0.75rem; text-align:center; background:rgba(15,23,42,0.8); padding:0.75rem; border-radius:8px;">
        <div>
          <div style="font-size:0.7rem; color:var(--text-muted);">Tiempo Total Ciclo</div>
          <div style="font-size:1.1rem; font-weight:800; font-family:var(--font-mono); color:#10b981;">
            ${pallet.totalDwellTime ? formatDuration(pallet.totalDwellTime) : 'En Proceso'}
          </div>
        </div>
        <div>
          <div style="font-size:0.7rem; color:var(--text-muted);">Movimientos Internos</div>
          <div style="font-size:1.1rem; font-weight:800; font-family:var(--font-mono); color:#38bdf8;">
            ${pallet.movementsCount || (isCrossDock ? 2 : 5)}
          </div>
        </div>
        <div>
          <div style="font-size:0.7rem; color:var(--text-muted);">Camión Origen / Despacho</div>
          <div style="font-size:0.8rem; font-weight:700; font-family:var(--font-mono); color:white;">
            ${pallet.inboundTruckId || 'IN-01'} → ${pallet.outboundTruckId || 'Pendiente'}
          </div>
        </div>
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
