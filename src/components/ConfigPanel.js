/**
 * ConfigPanel.js
 * Panel interactivo para la parametrización de supuestos de simulación
 * Permite modificar demanda diaria, % Cross Dock, distribución por destino,
 * tiempos operativos y capacidades de camiones.
 */

import { PRESETS } from '../data/sampleData.js';

export class ConfigPanel {
  /**
   * @param {string} containerId
   * @param {Object} initialConfig
   * @param {Function} onConfigChange - Callback al aplicar cambios
   */
  constructor(containerId, initialConfig, onConfigChange) {
    this.container = document.getElementById(containerId);
    this.config = JSON.parse(JSON.stringify(initialConfig));
    this.onConfigChange = onConfigChange;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="card">
        <div class="card-title-bar">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Parámetros y Supuestos
          </h3>
          <button class="btn btn-outline btn-icon" id="btnResetDefaults" title="Restablecer Valores Base">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            </svg>
          </button>
        </div>

        <!-- Selector de Presets Académicos -->
        <div class="form-group">
          <label>Escenario Preconfigurado</label>
          <select id="presetSelect" class="range-slider" style="background:#0f172a; height:34px; padding:0 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); color:white; width:100%;">
            ${PRESETS.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>

        <!-- 1. Demanda Total Diaria -->
        <div class="form-group">
          <label>
            <span>Pallets Diarios Recibidos:</span>
            <span class="val-display" id="valDailyPallets">${this.config.dailyPallets}</span>
          </label>
          <input type="range" id="inputDailyPallets" class="range-slider" min="100" max="800" step="10" value="${this.config.dailyPallets}">
        </div>

        <!-- 2. Porcentaje de Cross Docking -->
        <div class="form-group">
          <label>
            <span>% Cross Docking (Alta Rotación):</span>
            <span class="val-display" id="valCrossDockPct">${this.config.crossDockPercentage}%</span>
          </label>
          <input type="range" id="inputCrossDockPct" class="range-slider" min="10" max="90" step="5" value="${this.config.crossDockPercentage}">
          <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-dim); margin-top:3px;">
            <span>CD: <b style="color:#10b981;" id="calcCdCount">180</b> plts</span>
            <span>Almacén: <b style="color:#f59e0b;" id="calcStorageCount">270</b> plts</span>
          </div>
        </div>

        <!-- 3. Distribución por Destino Cross Dock -->
        <div class="form-group">
          <label>Distribución a Provincias (Pallets)</label>
          <div class="destination-inputs-grid">
            <div class="dest-input-card tacna">
              <span class="dest-name">Tacna</span>
              <input type="number" id="inputTacna" min="1" max="300" value="${this.config.destinationShares.tacna}">
            </div>
            <div class="dest-input-card cusco">
              <span class="dest-name">Cusco</span>
              <input type="number" id="inputCusco" min="1" max="300" value="${this.config.destinationShares.cusco}">
            </div>
            <div class="dest-input-card puno">
              <span class="dest-name">Puno</span>
              <input type="number" id="inputPuno" min="1" max="300" value="${this.config.destinationShares.puno}">
            </div>
          </div>
        </div>

        <!-- 4. Capacidad de Camiones -->
        <div class="form-group">
          <label>
            <span>Capacidad Camión Despacho:</span>
            <span class="val-display" id="valTruckCap">${this.config.truckConfig.outboundTruckCapacity} plts</span>
          </label>
          <input type="range" id="inputTruckCap" class="range-slider" min="10" max="35" step="1" value="${this.config.truckConfig.outboundTruckCapacity}">
        </div>

        <!-- 5. Tiempos Operativos (Acordeón de Configuración Avanzada) -->
        <details style="margin-top:0.75rem; font-size:0.775rem;">
          <summary style="cursor:pointer; color:var(--text-muted); font-weight:600; padding:4px 0;">
            ⚙️ Tiempos Operativos Estándar
          </summary>
          <div style="padding-top:0.6rem; display:flex; flex-direction:column; gap:0.5rem;">
            <div style="display:flex; justify-content:space-between;">
              <span>Descarga por pallet:</span>
              <span>1.5 min</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Control e Identificación:</span>
              <span>2.0 min</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Consolidación por pallet:</span>
              <span>3.5 min</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Carga por pallet:</span>
              <span>2.0 min</span>
            </div>
          </div>
        </details>

        <!-- Botón Aplicar -->
        <div style="margin-top:1rem;">
          <button class="btn btn-primary" id="btnApplyConfig" style="width:100%;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Aplicar Parámetros
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateCalculatedCounts();
  }

  bindEvents() {
    const inputDaily = document.getElementById('inputDailyPallets');
    const inputCdPct = document.getElementById('inputCrossDockPct');
    const inputTacna = document.getElementById('inputTacna');
    const inputCusco = document.getElementById('inputCusco');
    const inputPuno = document.getElementById('inputPuno');
    const inputTruckCap = document.getElementById('inputTruckCap');
    const presetSelect = document.getElementById('presetSelect');
    const btnApply = document.getElementById('btnApplyConfig');
    const btnReset = document.getElementById('btnResetDefaults');

    inputDaily.addEventListener('input', (e) => {
      document.getElementById('valDailyPallets').textContent = e.target.value;
      this.updateCalculatedCounts();
    });

    inputCdPct.addEventListener('input', (e) => {
      document.getElementById('valCrossDockPct').textContent = `${e.target.value}%`;
      this.updateCalculatedCounts();
    });

    inputTruckCap.addEventListener('input', (e) => {
      document.getElementById('valTruckCap').textContent = `${e.target.value} plts`;
    });

    presetSelect.addEventListener('change', (e) => {
      const selectedPreset = PRESETS.find(p => p.id === e.target.value);
      if (selectedPreset) {
        this.loadPreset(selectedPreset.config);
      }
    });

    btnApply.addEventListener('click', () => {
      const newConfig = {
        dailyPallets: Number(inputDaily.value),
        crossDockPercentage: Number(inputCdPct.value),
        storagePercentage: 100 - Number(inputCdPct.value),
        destinationShares: {
          tacna: Number(inputTacna.value) || 60,
          cusco: Number(inputCusco.value) || 65,
          puno: Number(inputPuno.value) || 55
        },
        truckConfig: {
          ...this.config.truckConfig,
          outboundTruckCapacity: Number(inputTruckCap.value)
        }
      };
      this.config = { ...this.config, ...newConfig };
      if (this.onConfigChange) this.onConfigChange(newConfig);
    });

    btnReset.addEventListener('click', () => {
      const basePreset = PRESETS.find(p => p.id === 'base');
      if (basePreset) this.loadPreset(basePreset.config);
    });
  }

  loadPreset(presetConfig) {
    document.getElementById('inputDailyPallets').value = presetConfig.dailyPallets;
    document.getElementById('valDailyPallets').textContent = presetConfig.dailyPallets;

    document.getElementById('inputCrossDockPct').value = presetConfig.crossDockPercentage;
    document.getElementById('valCrossDockPct').textContent = `${presetConfig.crossDockPercentage}%`;

    document.getElementById('inputTacna').value = presetConfig.destinationShares.tacna;
    document.getElementById('inputCusco').value = presetConfig.destinationShares.cusco;
    document.getElementById('inputPuno').value = presetConfig.destinationShares.puno;

    if (presetConfig.outboundTruckCapacity) {
      document.getElementById('inputTruckCap').value = presetConfig.outboundTruckCapacity;
      document.getElementById('valTruckCap').textContent = `${presetConfig.outboundTruckCapacity} plts`;
    }

    this.updateCalculatedCounts();
  }

  updateCalculatedCounts() {
    const daily = Number(document.getElementById('inputDailyPallets').value) || 450;
    const cdPct = Number(document.getElementById('inputCrossDockPct').value) || 40;
    const cdCount = Math.round(daily * (cdPct / 100));
    const storageCount = daily - cdCount;

    const elCd = document.getElementById('calcCdCount');
    const elStorage = document.getElementById('calcStorageCount');
    if (elCd) elCd.textContent = cdCount;
    if (elStorage) elStorage.textContent = storageCount;
  }
}
