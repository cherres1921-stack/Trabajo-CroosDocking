/**
 * app.js
 * Coordinador principal de la aplicación web LogiSur S.A.C.
 * Conecta el motor de simulación con todos los componentes visuales y eventos del usuario.
 */

import { INITIAL_CONFIG } from './data/sampleData.js';
import { SimulationEngine } from './simulation/SimulationEngine.js';
import { Header } from './components/Header.js';
import { Controls } from './components/Controls.js';
import { ConfigPanel } from './components/ConfigPanel.js';
import { CediLayout } from './components/CediLayout.js';
import { KpiDashboard } from './components/KpiDashboard.js';
import { PalletInspector } from './components/PalletInspector.js';
import { ChartsView } from './components/ChartsView.js';
import { ComparisonModal } from './components/ComparisonModal.js';
import { AlertsLog } from './components/AlertsLog.js';
import { exportPalletsToCsv, exportComparisonToCsv } from './utils/exportCsv.js';
import { formatStateLabel, getStateColorClass, formatSimulatedTime } from './utils/formatter.js';

class App {
  constructor() {
    this.engine = new SimulationEngine(INITIAL_CONFIG);
    this.initUI();
    this.bindEngineEvents();
  }

  initUI() {
    // 1. Modales
    this.palletInspector = new PalletInspector('palletModal');
    this.comparisonModal = new ComparisonModal('comparisonModal', (compData) => {
      exportComparisonToCsv(compData);
    });

    // 2. Encabezado
    this.header = new Header('headerContainer', 
      () => this.openComparisonModal(),
      () => this.exportCurrentPallets()
    );

    // 3. Controles
    this.controls = new Controls('controlsContainer', {
      onStart: () => this.engine.start(),
      onPause: () => this.engine.pause(),
      onReset: () => this.engine.initSimulation(),
      onSpeedChange: (speed) => this.engine.setSpeed(speed)
    });

    // 4. Panel de Configuración
    this.configPanel = new ConfigPanel('configContainer', this.engine.config, (newCfg) => {
      this.engine.updateConfig(newCfg);
    });

    // 5. Dashboard de KPIs
    this.kpiDashboard = new KpiDashboard('kpiContainer');

    // 6. Layout 2D Interactivo
    this.cediLayout = new CediLayout('cediCanvas', (pallet) => {
      this.palletInspector.inspectPallet(pallet);
    });

    // 7. Gráficos Analíticos
    this.chartsView = new ChartsView('chartsContainer');

    // 8. Registro de Alertas
    this.alertsLog = new AlertsLog('alertsContainer');

    // 9. Pestañas de Navegación
    this.setupTabs();

    // 10. Buscador de Pallets en la Tabla
    this.setupPalletTableSearch();
  }

  bindEngineEvents() {
    // Actualización en cada Tick de Simulación
    this.engine.onTick((tickData) => {
      this.header.updateTime(tickData.simTimeMinutes, tickData.isRunning);
      this.controls.updateState(tickData.isRunning, tickData.isPaused);
      this.kpiDashboard.update(tickData.kpis);
      this.cediLayout.updateData(tickData);
      this.chartsView.update(tickData);
      this.alertsLog.update(tickData.alerts);
      this.updatePalletsTable(tickData.pallets);
      this.updateTrucksMonitoring(tickData.trucks);
    });

    // Fin de Simulación
    this.engine.onFinish(({ comparison }) => {
      this.openComparisonModal();
    });
  }

  setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const activePane = document.getElementById(targetTab);
        if (activePane) activePane.classList.add('active');

        // Si se abre la pestaña de layout o gráficos, refrescar dimensiones
        if (targetTab === 'tab-layout' && this.cediLayout) {
          this.cediLayout.setupCanvasResize();
        }
      });
    });
  }

  setupPalletTableSearch() {
    const searchInput = document.getElementById('palletSearchInput');
    const filterSelect = document.getElementById('palletFilterSelect');

    const triggerFilter = () => {
      this.updatePalletsTable(this.engine.pallets);
    };

    if (searchInput) searchInput.addEventListener('input', triggerFilter);
    if (filterSelect) filterSelect.addEventListener('change', triggerFilter);
  }

  updatePalletsTable(pallets) {
    const tbody = document.getElementById('palletsTableBody');
    if (!tbody || !pallets) return;

    const searchTerm = (document.getElementById('palletSearchInput')?.value || '').toLowerCase();
    const filterType = document.getElementById('palletFilterSelect')?.value || 'ALL';

    const filtered = pallets.filter(p => {
      const matchSearch = p.id.toLowerCase().includes(searchTerm) || 
                          p.sku.toLowerCase().includes(searchTerm) || 
                          p.description.toLowerCase().includes(searchTerm);
      const matchType = filterType === 'ALL' || p.type === filterType || p.destination === filterType;
      return matchSearch && matchType;
    });

    tbody.innerHTML = filtered.slice(0, 100).map(p => `
      <tr data-pallet-id="${p.id}">
        <td><b style="font-family:var(--font-mono); color:#38bdf8;">${p.id}</b></td>
        <td>${p.sku}</td>
        <td>${p.description}</td>
        <td>
          <span style="font-weight:700; color:${p.type === 'CROSS_DOCK' ? '#10b981' : '#f59e0b'};">
            ${p.type === 'CROSS_DOCK' ? '⚡ Cross Dock' : '📦 Almacén'}
          </span>
        </td>
        <td>
          <span class="status-pill badge-${p.destination}">${p.destinationName || p.destination}</span>
        </td>
        <td>
          <span class="status-pill ${getStateColorClass(p.state)}">${formatStateLabel(p.state)}</span>
        </td>
        <td>${p.timestamps.received !== null ? formatSimulatedTime(p.timestamps.received) : 'En Ruta'}</td>
      </tr>
    `).join('');

    // Asignar clic en fila para inspeccionar
    tbody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', () => {
        const pId = row.getAttribute('data-pallet-id');
        const pallet = pallets.find(p => p.id === pId);
        if (pallet) this.palletInspector.inspectPallet(pallet);
      });
    });
  }

  updateTrucksMonitoring(trucksData) {
    const inboundList = document.getElementById('inboundTrucksList');
    const outboundList = document.getElementById('outboundTrucksList');
    if (!inboundList || !outboundList || !trucksData) return;

    // 1. Camiones Inbound
    inboundList.innerHTML = (trucksData.inbound || []).map(t => `
      <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(255,255,255,0.06); padding:0.75rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700; font-family:var(--font-mono); color:#38bdf8;">${t.id} • ${t.plate}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${t.supplier} (${t.productType})</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.8rem; font-weight:700;">${t.unloadedCount} / ${t.palletCount} pallets</div>
          <span class="status-pill ${t.status === 'DESCARGADO' ? 'status-dispatched' : 'status-loading'}">${t.status}</span>
        </div>
      </div>
    `).join('');

    // 2. Camiones Outbound
    outboundList.innerHTML = (trucksData.outbound || []).map(t => `
      <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(255,255,255,0.06); padding:0.75rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700; font-family:var(--font-mono); color:${t.color || '#fff'};">${t.id}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Destino: <b>${t.destinationName}</b></div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.8rem; font-weight:700;">${t.loadedPallets.length} / ${t.capacity} pallets</div>
          <span class="status-pill ${t.status === 'COMPLETO' ? 'status-dispatched' : 'status-loading'}">${t.status}</span>
        </div>
      </div>
    `).join('');
  }

  openComparisonModal() {
    const compData = this.engine.getComparison();
    this.comparisonModal.showComparison(compData);
  }

  exportCurrentPallets() {
    exportPalletsToCsv(this.engine.pallets, 'Simulacion_CEDI_LogiSur');
  }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
