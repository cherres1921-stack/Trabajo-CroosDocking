/**
 * SimulationEngine.js
 * Motor principal de simulación discreta basada en eventos para el CEDI LogiSur S.A.C.
 * 
 * Gestiona el reloj de simulación, la máquina de estados de cada pallet,
 * la cola de eventos, las alertas operativas y la sincronización con el UI.
 */

import { INITIAL_CONFIG, DESTINATIONS } from '../data/sampleData.js';
import { CrossDockRules } from './CrossDockRules.js';
import { TruckManager } from './TruckManager.js';
import { KpiCalculator } from './KpiCalculator.js';
import { TraditionalEngine } from './TraditionalEngine.js';

export class SimulationEngine {
  constructor(customConfig = {}) {
    this.config = JSON.parse(JSON.stringify({ ...INITIAL_CONFIG, ...customConfig }));
    this.rules = new CrossDockRules(this.config);
    this.truckManager = new TruckManager(this.config);
    this.kpiCalculator = new KpiCalculator(this.config);
    this.traditionalEngine = new TraditionalEngine(this.config);

    // Estado de la ejecución
    this.isRunning = false;
    this.isPaused = false;
    this.simTimeMinutes = 0;      // 0 = 06:00 AM
    this.timeMultiplier = 5;      // 1x, 2x, 5x, 10x, 25x
    this.timerId = null;

    // Colecciones de entidades
    this.pallets = [];
    this.alerts = [];
    this.eventsHistory = [];

    // Callbacks de suscripción para la UI
    this.listeners = {
      onTick: [],
      onAlert: [],
      onFinish: [],
      onPalletStateChange: []
    };

    // Inicializar dataset base
    this.initSimulation();
  }

  /**
   * Inicializa o reinicia la simulación con la configuración actual
   */
  initSimulation() {
    this.stop();
    this.simTimeMinutes = 0;
    this.alerts = [];
    this.eventsHistory = [];

    // Generar dataset matemáticamente consistente
    this.pallets = this.rules.generateDailyPalletDataset(this.config);
    this.truckManager.reset();
    this.truckManager.generateInboundSchedule(this.pallets);

    this.addAlert('INFO', 'Simulación inicializada con éxito.', `Programados ${this.pallets.length} pallets.`);
    this.broadcastTick();
  }

  /**
   * Actualiza la configuración y reinicia
   * @param {Object} newConfig
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.rules.updateConfig(this.config);
    this.truckManager.config = this.config;
    this.kpiCalculator.config = this.config;
    this.traditionalEngine.config = this.config;
    this.initSimulation();
  }

  /**
   * Inicia o reanuda la simulación
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastRealTimestamp = performance.now();

    const loop = (currentRealTime) => {
      if (!this.isRunning) return;

      const elapsedRealMs = currentRealTime - this.lastRealTimestamp;
      this.lastRealTimestamp = currentRealTime;

      // Convertir ms reales a minutos simulados según el multiplicador
      // Ejemplo: a 1x, 1 seg real = 0.5 min simulado; a 5x = 2.5 min/seg
      const deltaSimMinutes = (elapsedRealMs / 1000) * (0.35 * this.timeMultiplier);
      
      this.step(deltaSimMinutes);

      // Verificar si la jornada concluyó (960 min = 16 horas)
      if (this.simTimeMinutes >= this.config.simulationSchedule.durationMinutes) {
        this.finishSimulation();
        return;
      }

      this.timerId = requestAnimationFrame(loop);
    };

    this.timerId = requestAnimationFrame(loop);
  }

  /**
   * Pausa la simulación
   */
  pause() {
    this.isRunning = false;
    this.isPaused = true;
    if (this.timerId) {
      cancelAnimationFrame(this.timerId);
      this.timerId = null;
    }
    this.broadcastTick();
  }

  /**
   * Detiene y resetea la simulación
   */
  stop() {
    this.pause();
    this.isPaused = false;
  }

  /**
   * Establece el multiplicador de velocidad
   * @param {number} speed
   */
  setSpeed(speed) {
    this.timeMultiplier = Math.max(1, Math.min(50, speed));
  }

  /**
   * Ejecuta un avance discreto en el tiempo (Tick)
   * @param {number} deltaMinutes
   */
  step(deltaMinutes = 1.0) {
    this.simTimeMinutes += deltaMinutes;
    this.processInboundTrucks();
    this.processPalletTransitions();
    this.processOutboundTrucks();
    this.checkCapacityAlerts();
    this.broadcastTick();
  }

  /**
   * Procesa la llegada y descarga de camiones Inbound en los muelles de recepción
   */
  processInboundTrucks() {
    const inboundTrucks = this.truckManager.inboundTrucks;
    const docks = this.truckManager.inboundDocks;

    inboundTrucks.forEach(truck => {
      // 1. Llegada al CEDI
      if (truck.status === 'EN_RUTA' && this.simTimeMinutes >= truck.arrivalMinute) {
        truck.status = 'EN_ESPERA';
        this.addAlert('INFO', `Camión Inbound arribó`, `${truck.id} de ${truck.supplier} (${truck.palletCount} pallets).`);
      }

      // 2. Asignación a muelle libre
      if (truck.status === 'EN_ESPERA') {
        const freeDock = docks.find(d => !d.truck);
        if (freeDock) {
          freeDock.truck = truck;
          freeDock.status = 'OCUPADO';
          truck.dockAssigned = freeDock.id;
          truck.status = 'DESCARGANDO';
          truck.startUnloadTime = this.simTimeMinutes;
        }
      }

      // 3. Descarga progresiva de pallets
      if (truck.status === 'DESCARGANDO') {
        const unloadRatePerPallet = this.config.operationTimes.unloadPerPallet || 1.5;
        const timeElapsedInDock = this.simTimeMinutes - truck.startUnloadTime;
        const palletsToUnload = Math.min(truck.palletCount, Math.floor(timeElapsedInDock / unloadRatePerPallet));

        while (truck.unloadedCount < palletsToUnload) {
          const pallet = truck.pallets[truck.unloadedCount];
          if (pallet && pallet.state === 'PENDING_ARRIVAL') {
            this.transitionPalletState(pallet, 'RECEIVED', 'reception_staging');
          }
          truck.unloadedCount++;
        }

        // Camión totalmente descargado
        if (truck.unloadedCount >= truck.palletCount && truck.status !== 'DESCARGADO') {
          truck.status = 'DESCARGADO';
          truck.finishUnloadTime = this.simTimeMinutes;
          
          // Liberar muelle después de 5 min de maniobra
          const dock = docks.find(d => d.id === truck.dockAssigned);
          if (dock) {
            dock.truck = null;
            dock.status = 'LIBRE';
          }
          this.addAlert('SUCCESS', `Descarga completa`, `${truck.id} completó ${truck.palletCount} pallets descargados.`);
        }
      }
    });
  }

  /**
   * Máquina de estados principal: gestiona el tránsito de los pallets
   */
  processPalletTransitions() {
    const times = this.config.operationTimes;

    this.pallets.forEach(pallet => {
      const ts = pallet.timestamps;

      // 1. RECEIVED -> CHECKING (Control de Calidad e Identificación)
      if (pallet.state === 'RECEIVED') {
        if (this.simTimeMinutes - ts.received >= 1.0) {
          this.transitionPalletState(pallet, 'CHECKING', 'quality_control');
        }
      }

      // 2. CHECKING -> CLASSIFIED
      else if (pallet.state === 'CHECKING') {
        if (this.simTimeMinutes - ts.checking >= (times.qualityCheckPerPallet || 2.0)) {
          this.transitionPalletState(pallet, 'CLASSIFIED', 'classification_hub');
        }
      }

      // 3. CLASSIFIED -> CROSS_DOCK o STORAGE (Bifurcación estricta de Cross Docking)
      else if (pallet.state === 'CLASSIFIED') {
        if (pallet.type === 'CROSS_DOCK') {
          // REGLA CRÍTICA: Los pallets Cross Dock NUNCA entran a Racks de almacenamiento
          const destZone = `crossdock_${pallet.destination}`;
          this.transitionPalletState(pallet, 'CROSS_DOCK', destZone);
        } else {
          // Pallets de almacenamiento convencional van a Racks
          this.transitionPalletState(pallet, 'STORAGE', 'storage_racks');
        }
      }

      // 4A. CROSS_DOCK -> CONSOLIDATION (Flujo directo rápido)
      else if (pallet.state === 'CROSS_DOCK') {
        const dwellInBay = this.simTimeMinutes - ts.cross_dock;
        // Permanece un breve tiempo de espera en la bahía (~15-30 min) antes de consolidar
        if (dwellInBay >= (times.crossDockMoveTime + 15.0)) {
          this.transitionPalletState(pallet, 'CONSOLIDATION', 'consolidation_zone');
        }
      }

      // 4B. STORAGE -> PICKING (Flujo tradicional con almacenamiento previo)
      else if (pallet.state === 'STORAGE') {
        const dwellInRack = this.simTimeMinutes - ts.storage;
        // Permanece en rack hasta la ventana de picking (~180-240 min)
        if (dwellInRack >= (times.storagePutawayTime + 180.0)) {
          this.transitionPalletState(pallet, 'PICKING', 'picking_zone');
        }
      }

      // 5B. PICKING -> CONSOLIDATION
      else if (pallet.state === 'PICKING') {
        const dwellInPicking = this.simTimeMinutes - ts.picking;
        if (dwellInPicking >= (times.pickingTimePerPallet || 15.0)) {
          this.transitionPalletState(pallet, 'CONSOLIDATION', 'consolidation_zone');
        }
      }

      // 6. CONSOLIDATION -> LOADING (Asignación a camión de despacho)
      else if (pallet.state === 'CONSOLIDATION') {
        const dwellInConsolidation = this.simTimeMinutes - ts.consolidation;
        if (dwellInConsolidation >= (times.consolidationTime || 3.5)) {
          const loaded = this.truckManager.loadPalletToOutbound(pallet, this.simTimeMinutes);
          if (loaded) {
            this.transitionPalletState(pallet, 'LOADING', `dispatch_dock_${pallet.destination}`);
          }
        }
      }

      // 7. LOADING -> DISPATCHED (Carga completada en camión)
      else if (pallet.state === 'LOADING') {
        const dwellInLoading = this.simTimeMinutes - ts.loading;
        if (dwellInLoading >= (times.loadingPerPallet || 2.0)) {
          // Si el camión que lo contiene ya está en salida o completado
          const truck = this.truckManager.outboundTrucks.find(t => t.id === pallet.outboundTruckId);
          if (truck && (truck.status === 'COMPLETO' || truck.status === 'DESPACHADO')) {
            this.transitionPalletState(pallet, 'DISPATCHED', 'dispatched_road');
          }
        }
      }
    });
  }

  /**
   * Transiciona el estado de un pallet y registra los timestamps exactos
   * @param {Object} pallet
   * @param {string} newState
   * @param {string} newZone
   */
  transitionPalletState(pallet, newState, newZone) {
    pallet.state = newState;
    pallet.currentZone = newZone;
    pallet.movementsCount = (pallet.movementsCount || 0) + 1;

    const stateKey = newState.toLowerCase();
    if (pallet.timestamps[stateKey] === null || pallet.timestamps[stateKey] === undefined) {
      pallet.timestamps[stateKey] = this.simTimeMinutes;
    }

    if (newState === 'DISPATCHED' && pallet.timestamps.received !== null) {
      pallet.totalDwellTime = this.simTimeMinutes - pallet.timestamps.received;
    }

    this.broadcastPalletChange(pallet);
  }

  /**
   * Gestiona el cierre y salida de camiones Outbound hacia Tacna, Cusco y Puno
   */
  processOutboundTrucks() {
    this.truckManager.outboundTrucks.forEach(truck => {
      if (truck.status === 'CARGANDO') {
        // Despacho forzado si supera tiempo máximo de espera en andén (ej. 120 min)
        const waitTime = this.simTimeMinutes - truck.createdTime;
        if (truck.loadedPallets.length >= truck.capacity || (waitTime > 120 && truck.loadedPallets.length >= 10)) {
          truck.status = 'COMPLETO';
          truck.departureTime = this.simTimeMinutes;
          
          // Marcar pallets como despachados
          truck.loadedPallets.forEach(p => {
            if (p.state !== 'DISPATCHED') {
              this.transitionPalletState(p, 'DISPATCHED', 'dispatched_road');
            }
          });

          this.addAlert('SUCCESS', `Camión Despachado a ${truck.destinationName}`, 
            `${truck.id} partió con ${truck.loadedPallets.length}/${truck.capacity} pallets.`);
        }
      }
    });
  }

  /**
   * Supervisión continua de umbrales para emitir alertas de congestión
   */
  checkCapacityAlerts() {
    const kpis = this.getKpis();

    // 1. Alerta de saturación en Cross Dock
    if (kpis.crossDockUtilizationRate > 85.0 && !this.alerts.some(a => a.type === 'WARNING' && a.title.includes('Saturación Cross Dock') && (this.simTimeMinutes - a.time < 30))) {
      this.addAlert('WARNING', 'Saturación en Bahías Cross Dock', 
        `La ocupación alcanzó ${kpis.crossDockUtilizationRate.toFixed(1)}%. Posible cola de espera.`);
    }

    // 2. Alerta de saturación de almacenamiento convencional
    if (kpis.storageUtilizationRate > 98.0 && !this.alerts.some(a => a.type === 'DANGER' && a.title.includes('Almacenamiento Crítico'))) {
      this.addAlert('DANGER', 'Almacenamiento Crítico (>98%)', 
        `El CEDI está al borde de su capacidad máxima. Se requiere acelerar el flujo de Cross Dock.`);
    }
  }

  /**
   * Registra una alerta en el sistema
   */
  addAlert(type, title, message) {
    const alert = {
      id: `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type, // 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER'
      title,
      message,
      time: this.simTimeMinutes
    };
    this.alerts.unshift(alert);
    if (this.alerts.length > 50) this.alerts.pop();
    this.broadcastAlert(alert);
  }

  /**
   * Finaliza la jornada de simulación
   */
  finishSimulation() {
    this.pause();
    this.addAlert('SUCCESS', 'Simulación Finalizada', 'Se completó la jornada de 16 horas operativas.');
    const kpis = this.getKpis();
    const comparison = this.getComparison();
    this.listeners.onFinish.forEach(fn => fn({ kpis, comparison }));
  }

  /**
   * Obtiene los KPIs actuales calculados
   */
  getKpis() {
    return this.kpiCalculator.calculateKpis(this.pallets, this.truckManager, this.simTimeMinutes);
  }

  /**
   * Obtiene la comparativa académica Tradicional vs Cross Dock
   */
  getComparison() {
    const kpis = this.getKpis();
    return this.traditionalEngine.calculateComparison(kpis, this.config);
  }

  // --- Sistema de Suscripciones para la UI ---

  onTick(callback) {
    this.listeners.onTick.push(callback);
  }

  onAlert(callback) {
    this.listeners.onAlert.push(callback);
  }

  onFinish(callback) {
    this.listeners.onFinish.push(callback);
  }

  onPalletChange(callback) {
    this.listeners.onPalletStateChange.push(callback);
  }

  broadcastTick() {
    const data = {
      simTimeMinutes: this.simTimeMinutes,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      timeMultiplier: this.timeMultiplier,
      kpis: this.getKpis(),
      trucks: {
        inbound: this.truckManager.inboundTrucks,
        outbound: this.truckManager.outboundTrucks,
        inboundDocks: this.truckManager.inboundDocks,
        dispatchDocks: this.truckManager.dispatchDocks
      },
      pallets: this.pallets,
      alerts: this.alerts
    };
    this.listeners.onTick.forEach(fn => fn(data));
  }

  broadcastAlert(alert) {
    this.listeners.onAlert.forEach(fn => fn(alert));
  }

  broadcastPalletChange(pallet) {
    this.listeners.onPalletStateChange.forEach(fn => fn(pallet));
  }
}
