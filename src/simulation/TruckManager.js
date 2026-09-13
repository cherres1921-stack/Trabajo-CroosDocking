/**
 * TruckManager.js
 * Gestión de camiones entrantes (Inbound) y salientes (Outbound)
 * Control de muelles, asignación de cargas y validación de capacidades.
 */

import { SUPPLIERS, DESTINATIONS } from '../data/sampleData.js';

export class TruckManager {
  constructor(config) {
    this.config = config;
    this.inboundTrucks = [];
    this.outboundTrucks = [];
    this.inboundDocks = [
      { id: 1, name: 'Muelle REC-01', truck: null, status: 'LIBRE' },
      { id: 2, name: 'Muelle REC-02', truck: null, status: 'LIBRE' },
      { id: 3, name: 'Muelle REC-03', truck: null, status: 'LIBRE' },
      { id: 4, name: 'Muelle REC-04', truck: null, status: 'LIBRE' }
    ];
    this.dispatchDocks = [
      { id: 1, name: 'Muelle DESP-01 (Tacna)', targetDestination: 'tacna', truck: null, status: 'LIBRE' },
      { id: 2, name: 'Muelle DESP-02 (Cusco)', targetDestination: 'cusco', truck: null, status: 'LIBRE' },
      { id: 3, name: 'Muelle DESP-03 (Puno)', targetDestination: 'puno', truck: null, status: 'LIBRE' },
      { id: 4, name: 'Muelle DESP-04 (Mixto)', targetDestination: 'all', truck: null, status: 'LIBRE' }
    ];
  }

  /**
   * Inicializa la flota de camiones de entrada distribuyendo los pallets
   * @param {Array<Object>} pallets
   */
  generateInboundSchedule(pallets) {
    this.inboundTrucks = [];
    const truckCapacity = Number(this.config.truckConfig?.inboundTruckCapacity) || 25;
    const totalPallets = pallets.length;
    const totalTrucksNeeded = Math.ceil(totalPallets / truckCapacity);

    // Agrupar pallets en lotes de tamaño de camión
    let palletIndex = 0;
    const arrivalInterval = Math.floor(480 / Math.max(1, totalTrucksNeeded)); // Distribuidos en primeras 8h

    for (let i = 0; i < totalTrucksNeeded; i++) {
      const batchSize = Math.min(truckCapacity, totalPallets - palletIndex);
      const truckPallets = pallets.slice(palletIndex, palletIndex + batchSize);
      palletIndex += batchSize;

      const supplier = SUPPLIERS[i % SUPPLIERS.length];
      const hasCrossDock = truckPallets.some(p => p.type === 'CROSS_DOCK');
      const hasStorage = truckPallets.some(p => p.type === 'STORAGE');
      const productType = (hasCrossDock && hasStorage) ? 'MIXTO (Consumo Masivo)' : (hasCrossDock ? 'ALTA ROTACIÓN' : 'ALMACENAMIENTO');

      const arrivalMinute = i * arrivalInterval + Math.floor(Math.random() * 8);

      const truck = {
        id: `TRK-IN-${String(i + 1).padStart(2, '0')}`,
        type: 'INBOUND',
        plate: `V${i + 1}K-${Math.floor(100 + Math.random() * 900)}`,
        supplier: supplier,
        productType: productType,
        capacity: truckCapacity,
        palletCount: batchSize,
        pallets: truckPallets,
        arrivalMinute: arrivalMinute,
        dockAssigned: null,
        status: 'EN_RUTA', // 'EN_RUTA' -> 'EN_ESPERA' -> 'DESCARGANDO' -> 'DESCARGADO' -> 'DESPACHADO'
        unloadedCount: 0,
        startUnloadTime: null,
        finishUnloadTime: null
      };

      // Asociar ID del camión a cada pallet
      truckPallets.forEach(p => {
        p.inboundTruckId = truck.id;
      });

      this.inboundTrucks.push(truck);
    }

    return this.inboundTrucks;
  }

  /**
   * Crea o asigna camiones de salida para cada destino
   * @param {string} destination - 'tacna' | 'cusco' | 'puno'
   * @param {number} currentSimTime
   * @returns {Object} Camión disponible para cargar
   */
  getOrCreateOutboundTruck(destination, currentSimTime) {
    const truckCapacity = Number(this.config.truckConfig?.outboundTruckCapacity) || 20;

    // Buscar camión activo en muelle o espera para ese destino con espacio
    let activeTruck = this.outboundTrucks.find(t => 
      t.destination === destination && 
      t.status === 'CARGANDO' && 
      t.loadedPallets.length < truckCapacity
    );

    if (!activeTruck) {
      // Crear nuevo camión de despacho
      const truckNumber = this.outboundTrucks.length + 1;
      const destInfo = DESTINATIONS[destination] || { prefix: 'REG', name: destination, color: '#3b82f6' };
      
      activeTruck = {
        id: `TRK-OUT-${destInfo.prefix}-${String(truckNumber).padStart(2, '0')}`,
        type: 'OUTBOUND',
        destination: destination,
        destinationName: destInfo.name,
        color: destInfo.color,
        capacity: truckCapacity,
        loadedPallets: [],
        status: 'CARGANDO', // 'CARGANDO' -> 'COMPLETO' -> 'DESPACHADO'
        createdTime: currentSimTime,
        departureTime: null,
        dockAssigned: null
      };

      // Asignar muelle de despacho
      const preferredDock = this.dispatchDocks.find(d => d.targetDestination === destination && !d.truck) 
                         || this.dispatchDocks.find(d => !d.truck);
      
      if (preferredDock) {
        preferredDock.truck = activeTruck;
        activeTruck.dockAssigned = preferredDock.id;
      }

      this.outboundTrucks.push(activeTruck);
    }

    return activeTruck;
  }

  /**
   * Intenta cargar un pallet en un camión de despacho
   * @param {Object} pallet
   * @param {number} currentSimTime
   * @returns {boolean} true si se pudo cargar
   */
  loadPalletToOutbound(pallet, currentSimTime) {
    const truck = this.getOrCreateOutboundTruck(pallet.destination, currentSimTime);
    if (!truck || truck.loadedPallets.length >= truck.capacity) {
      return false;
    }

    truck.loadedPallets.push(pallet);
    pallet.outboundTruckId = truck.id;

    // Verificar si el camión ya alcanzó su capacidad máxima
    if (truck.loadedPallets.length >= truck.capacity) {
      truck.status = 'COMPLETO';
      truck.departureTime = currentSimTime;
    }

    return true;
  }

  /**
   * Obtiene todos los camiones despachados
   */
  getDispatchedTrucks() {
    return this.outboundTrucks.filter(t => t.status === 'COMPLETO' || t.status === 'DESPACHADO');
  }

  /**
   * Resetea el estado de muelles y camiones
   */
  reset() {
    this.inboundTrucks = [];
    this.outboundTrucks = [];
    this.inboundDocks.forEach(d => { d.truck = null; d.status = 'LIBRE'; });
    this.dispatchDocks.forEach(d => { d.truck = null; d.status = 'LIBRE'; });
  }
}
