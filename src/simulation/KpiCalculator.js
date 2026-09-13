/**
 * KpiCalculator.js
 * Cálculo de KPIs, métricas de rendimiento y validaciones matemáticas en tiempo real
 */

export class KpiCalculator {
  /**
   * @param {Object} config
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Calcula el conjunto completo de KPIs a partir del estado actual de pallets y camiones
   * @param {Array<Object>} allPallets - Conjunto total de pallets programados
   * @param {Object} truckManager - Instancia del TruckManager
   * @param {number} currentSimMinutes - Minuto actual de la simulación
   * @returns {Object} Resumen completo de KPIs
   */
  calculateKpis(allPallets, truckManager, currentSimMinutes) {
    if (!allPallets || allPallets.length === 0) {
      return this.getEmptyKpis();
    }

    const totalScheduled = allPallets.length;
    
    // Filtros por estado
    const receivedPallets = allPallets.filter(p => p.timestamps.received !== null);
    const totalReceived = receivedPallets.length;

    const crossDockPallets = receivedPallets.filter(p => p.type === 'CROSS_DOCK');
    const storagePallets = receivedPallets.filter(p => p.type === 'STORAGE');

    const totalCrossDock = crossDockPallets.length;
    const totalStorage = storagePallets.length;

    const dispatchedPallets = receivedPallets.filter(p => p.state === 'DISPATCHED');
    const totalDispatched = dispatchedPallets.length;

    const dispatchedCrossDock = crossDockPallets.filter(p => p.state === 'DISPATCHED');
    const dispatchedStorage = storagePallets.filter(p => p.state === 'DISPATCHED');

    // Pallets activos en el CEDI (recibidos pero no despachados)
    const pendingPallets = totalReceived - totalDispatched;

    // Pallets clasificados por zona actual
    const inChecking = receivedPallets.filter(p => p.state === 'CHECKING' || p.state === 'CLASSIFIED').length;
    const inCrossDockBays = receivedPallets.filter(p => p.state === 'CROSS_DOCK').length;
    const inStorageRacks = receivedPallets.filter(p => p.state === 'STORAGE').length;
    const inPicking = receivedPallets.filter(p => p.state === 'PICKING').length;
    const inConsolidation = receivedPallets.filter(p => p.state === 'CONSOLIDATION').length;
    const inLoading = receivedPallets.filter(p => p.state === 'LOADING').length;

    // Pallets por destino despachados / en proceso
    const byDestination = {
      tacna: {
        total: receivedPallets.filter(p => p.destination === 'tacna').length,
        crossDock: crossDockPallets.filter(p => p.destination === 'tacna').length,
        dispatched: dispatchedPallets.filter(p => p.destination === 'tacna').length
      },
      cusco: {
        total: receivedPallets.filter(p => p.destination === 'cusco').length,
        crossDock: crossDockPallets.filter(p => p.destination === 'cusco').length,
        dispatched: dispatchedPallets.filter(p => p.destination === 'cusco').length
      },
      puno: {
        total: receivedPallets.filter(p => p.destination === 'puno').length,
        crossDock: crossDockPallets.filter(p => p.destination === 'puno').length,
        dispatched: dispatchedPallets.filter(p => p.destination === 'puno').length
      }
    };

    // Cálculos de Tiempos Promedio (Dwell Times en minutos)
    const calcAvgTime = (palletList) => {
      const finished = palletList.filter(p => p.timestamps.dispatched !== null && p.timestamps.received !== null);
      if (finished.length === 0) return 0;
      const sum = finished.reduce((acc, p) => acc + (p.timestamps.dispatched - p.timestamps.received), 0);
      return sum / finished.length;
    };

    const avgDwellTimeCrossDock = calcAvgTime(crossDockPallets);
    const avgDwellTimeStorage = calcAvgTime(storagePallets);
    const avgDwellTimeTotal = calcAvgTime(dispatchedPallets);

    // Tiempo promedio de permanencia en Cross Dock antes de consolidación
    const crossDockWaitTimes = crossDockPallets
      .filter(p => p.timestamps.consolidation !== null && p.timestamps.cross_dock !== null)
      .map(p => p.timestamps.consolidation - p.timestamps.cross_dock);
    const avgCrossDockStageTime = crossDockWaitTimes.length > 0 
      ? crossDockWaitTimes.reduce((a, b) => a + b, 0) / crossDockWaitTimes.length 
      : 0;

    // Utilización de Capacidad
    // 1. Capacidad de Almacenamiento (Racks): Base 2800 posiciones. Base ocupada 95% = 2660.
    const totalStoragePositions = this.config.capacities?.totalStoragePositions || 2800;
    const baseOccupied = this.config.capacities?.currentOccupiedPositions || 2660;
    // Solo los pallets de tipo STORAGE ocupan nuevas posiciones
    const newStorageOccupied = inStorageRacks;
    const totalPositionsOccupied = Math.min(totalStoragePositions, baseOccupied + newStorageOccupied);
    const storageUtilizationRate = (totalPositionsOccupied / totalStoragePositions) * 100;

    // 2. Capacidad de Bahías Cross Dock (Capacidad total = suma de bahías)
    const bayCapacities = this.config.capacities?.crossDockBayCapacity || { tacna: 80, cusco: 80, puno: 80 };
    const totalCrossDockBayCapacity = bayCapacities.tacna + bayCapacities.cusco + bayCapacities.puno;
    const crossDockUtilizationRate = (inCrossDockBays / Math.max(1, totalCrossDockBayCapacity)) * 100;

    // Métricas de Camiones
    const inboundTrucks = truckManager?.inboundTrucks || [];
    const outboundTrucks = truckManager?.outboundTrucks || [];
    const inboundProcessed = inboundTrucks.filter(t => t.status === 'DESCARGADO' || t.status === 'DESPACHADO').length;
    const outboundDispatched = outboundTrucks.filter(t => t.status === 'COMPLETO' || t.status === 'DESPACHADO').length;
    const totalTrucksUsed = inboundProcessed + outboundDispatched;

    // Tasa de cumplimiento de despacho
    const fulfillmentRate = totalScheduled > 0 ? (totalDispatched / totalScheduled) * 100 : 0;
    const crossDockFulfillmentRate = totalCrossDock > 0 ? (dispatchedCrossDock.length / totalCrossDock) * 100 : 0;

    // Movimientos internos estimados (Cross Dock = 2 movimientos; Almacenamiento = 5 movimientos)
    const crossDockMovements = crossDockPallets.length * 2;
    const storageMovements = storagePallets.length * 5;
    const totalInternalMovements = crossDockMovements + storageMovements;

    // Validaciones Matemáticas de Integridad
    const mathIntegrity = {
      isSumConsistent: (totalCrossDock + totalStorage) === totalReceived,
      receivedEqualsScheduled: totalReceived === totalScheduled,
      crossDockStoredZero: crossDockPallets.filter(p => p.state === 'STORAGE').length === 0,
      totalReceived,
      totalCrossDock,
      totalStorage,
      totalDispatched,
      pendingPallets
    };

    return {
      totalScheduled,
      totalReceived,
      totalCrossDock,
      totalStorage,
      crossDockPercentage: totalReceived > 0 ? (totalCrossDock / totalReceived) * 100 : 0,
      storagePercentage: totalReceived > 0 ? (totalStorage / totalReceived) * 100 : 0,
      totalDispatched,
      pendingPallets,
      dispatchedCrossDock: dispatchedCrossDock.length,
      dispatchedStorage: dispatchedStorage.length,
      
      // Zonas
      inChecking,
      inCrossDockBays,
      inStorageRacks,
      inPicking,
      inConsolidation,
      inLoading,

      // Destinos
      byDestination,

      // Tiempos
      avgDwellTimeCrossDock,
      avgDwellTimeStorage,
      avgDwellTimeTotal,
      avgCrossDockStageTime,

      // Utilizaciones
      storageUtilizationRate,
      totalPositionsOccupied,
      totalStoragePositions,
      crossDockUtilizationRate,
      inCrossDockBays,
      totalCrossDockBayCapacity,

      // Camiones
      totalInboundTrucks: inboundTrucks.length,
      totalOutboundTrucks: outboundTrucks.length,
      inboundProcessed,
      outboundDispatched,
      totalTrucksUsed,

      // Eficiencia
      fulfillmentRate,
      crossDockFulfillmentRate,
      totalInternalMovements,
      crossDockMovements,
      storageMovements,

      // Integridad
      mathIntegrity
    };
  }

  getEmptyKpis() {
    return {
      totalScheduled: 0,
      totalReceived: 0,
      totalCrossDock: 0,
      totalStorage: 0,
      crossDockPercentage: 0,
      storagePercentage: 0,
      totalDispatched: 0,
      pendingPallets: 0,
      dispatchedCrossDock: 0,
      dispatchedStorage: 0,
      inChecking: 0,
      inCrossDockBays: 0,
      inStorageRacks: 0,
      inPicking: 0,
      inConsolidation: 0,
      inLoading: 0,
      byDestination: {
        tacna: { total: 0, crossDock: 0, dispatched: 0 },
        cusco: { total: 0, crossDock: 0, dispatched: 0 },
        puno: { total: 0, crossDock: 0, dispatched: 0 }
      },
      avgDwellTimeCrossDock: 0,
      avgDwellTimeStorage: 0,
      avgDwellTimeTotal: 0,
      avgCrossDockStageTime: 0,
      storageUtilizationRate: 95.0,
      totalPositionsOccupied: 2660,
      totalStoragePositions: 2800,
      crossDockUtilizationRate: 0,
      inCrossDockBays: 0,
      totalCrossDockBayCapacity: 240,
      totalInboundTrucks: 0,
      totalOutboundTrucks: 0,
      inboundProcessed: 0,
      outboundDispatched: 0,
      totalTrucksUsed: 0,
      fulfillmentRate: 0,
      crossDockFulfillmentRate: 0,
      totalInternalMovements: 0,
      crossDockMovements: 0,
      storageMovements: 0,
      mathIntegrity: {
        isSumConsistent: true,
        receivedEqualsScheduled: false,
        crossDockStoredZero: true
      }
    };
  }
}
