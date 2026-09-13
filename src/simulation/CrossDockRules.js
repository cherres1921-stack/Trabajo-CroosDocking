/**
 * CrossDockRules.js
 * Reglas de negocio para la clasificación automática de pallets,
 * asignación de destinos y control estricto de no-almacenamiento para Cross Docking.
 */

import { SKU_CATALOG, DESTINATIONS } from '../data/sampleData.js';

export class CrossDockRules {
  /**
   * @param {Object} config - Configuración activa
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Actualiza la configuración de reglas
   * @param {Object} newConfig
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Evalúa y clasifica un pallet entrante.
   * Regla de Negocio:
   * - Si es de alta rotación y cumple la cuota configurable de Cross Docking => tipo 'CROSS_DOCK'
   * - Si excede la cuota o es de rotación media/baja => tipo 'STORAGE'
   * @param {Object} pallet
   * @param {number} currentCrossDockAssigned - Cantidad ya asignada a CD
   * @param {number} targetCrossDockCount - Meta total de pallets CD
   * @returns {Object} Clasificación y destino
   */
  classifyPallet(pallet, currentCrossDockAssigned, targetCrossDockCount) {
    const skuInfo = SKU_CATALOG.find(s => s.sku === pallet.sku);
    const isHighRotation = skuInfo && skuInfo.rotation === 'ALTA';
    
    let assignedType = 'STORAGE';
    
    // Si es candidato de alta rotación y no hemos superado el objetivo de Cross Dock
    if (isHighRotation && currentCrossDockAssigned < targetCrossDockCount) {
      assignedType = 'CROSS_DOCK';
    } else if (pallet.forceCrossDock && currentCrossDockAssigned < targetCrossDockCount) {
      assignedType = 'CROSS_DOCK';
    }

    return {
      type: assignedType,
      isCrossDock: assignedType === 'CROSS_DOCK',
      targetZone: assignedType === 'CROSS_DOCK' ? `crossdock_${pallet.destination}` : 'storage_racks'
    };
  }

  /**
   * Determina si la bahía de Cross Dock de un destino tiene capacidad
   * @param {string} destination - 'tacna' | 'cusco' | 'puno'
   * @param {number} currentBayCount - Pallets actuales en la bahía
   * @returns {boolean}
   */
  hasCrossDockCapacity(destination, currentBayCount) {
    const maxCapacity = this.config.capacities?.crossDockBayCapacity?.[destination] || 80;
    return currentBayCount < maxCapacity;
  }

  /**
   * Genera el conjunto de pallets para la jornada simulada respetando estrictamente
   * la suma matemática: Pallets Cross Dock + Pallets Almacenamiento = Pallets Totales.
   * Y la partición por destino (Tacna + Cusco + Puno = Pallets Cross Dock).
   * @param {Object} customConfig
   * @returns {Array<Object>}
   */
  generateDailyPalletDataset(customConfig = null) {
    const cfg = customConfig || this.config;
    const totalPallets = Number(cfg.dailyPallets) || 450;
    const crossDockPct = Number(cfg.crossDockPercentage) || 40;
    
    // Cálculo exacto de pallets
    const targetCrossDock = Math.round(totalPallets * (crossDockPct / 100));
    const targetStorage = totalPallets - targetCrossDock;

    // Distribución a destinos de Cross Dock
    const destShares = cfg.destinationShares || { tacna: 60, cusco: 65, puno: 55 };
    const rawSum = (Number(destShares.tacna) || 0) + (Number(destShares.cusco) || 0) + (Number(destShares.puno) || 0);
    
    // Normalizar para que la suma por destinos coincida EXACTAMENTE con targetCrossDock
    let tacnaCount = Math.round((Number(destShares.tacna) / (rawSum || 1)) * targetCrossDock);
    let cuscoCount = Math.round((Number(destShares.cusco) / (rawSum || 1)) * targetCrossDock);
    let punoCount = targetCrossDock - (tacnaCount + cuscoCount);

    if (punoCount < 0) {
      punoCount = 0;
      tacnaCount = targetCrossDock - cuscoCount;
    }

    const highRotationSkus = SKU_CATALOG.filter(s => s.rotation === 'ALTA');
    const storageSkus = SKU_CATALOG.filter(s => s.rotation !== 'ALTA');

    const pallets = [];
    let palletSeq = 1;

    // 1. Generar Pallets de Cross Docking (Tacna, Cusco, Puno)
    const destinationsQueue = [
      ...Array(tacnaCount).fill('tacna'),
      ...Array(cuscoCount).fill('cusco'),
      ...Array(punoCount).fill('puno')
    ];

    // Mezclar orden para realismo en la llegada
    destinationsQueue.sort(() => Math.random() - 0.5);

    for (let i = 0; i < targetCrossDock; i++) {
      const destKey = destinationsQueue[i] || 'tacna';
      const destObj = DESTINATIONS[destKey];
      const skuObj = highRotationSkus[i % highRotationSkus.length];
      
      pallets.push({
        id: `PLT-${String(palletSeq++).padStart(4, '0')}`,
        sku: skuObj.sku,
        description: skuObj.description,
        category: skuObj.category,
        supplier: skuObj.supplier,
        type: 'CROSS_DOCK',
        destination: destKey,
        destinationName: destObj.name,
        destinationColor: destObj.color,
        priority: (i % 5 === 0) ? 'ALTA' : 'NORMAL',
        weightKg: skuObj.unitWeightKg,
        state: 'PENDING_ARRIVAL',
        currentZone: 'INBOUND_TRANSIT',
        // Tiempos registrados por etapa (en minutos simulados)
        timestamps: {
          received: null,
          checking: null,
          classified: null,
          cross_dock: null,
          storage: null,
          picking: null,
          consolidation: null,
          loading: null,
          dispatched: null
        },
        movementsCount: 0,
        totalDwellTime: 0
      });
    }

    // 2. Generar Pallets de Almacenamiento Convencional
    const allDestKeys = ['tacna', 'cusco', 'puno'];
    for (let i = 0; i < targetStorage; i++) {
      const destKey = allDestKeys[i % allDestKeys.length];
      const destObj = DESTINATIONS[destKey];
      const skuObj = storageSkus[i % storageSkus.length];

      pallets.push({
        id: `PLT-${String(palletSeq++).padStart(4, '0')}`,
        sku: skuObj.sku,
        description: skuObj.description,
        category: skuObj.category,
        supplier: skuObj.supplier,
        type: 'STORAGE',
        destination: destKey,
        destinationName: destObj.name,
        destinationColor: destObj.color,
        priority: 'NORMAL',
        weightKg: skuObj.unitWeightKg,
        state: 'PENDING_ARRIVAL',
        currentZone: 'INBOUND_TRANSIT',
        timestamps: {
          received: null,
          checking: null,
          classified: null,
          cross_dock: null,
          storage: null,
          picking: null,
          consolidation: null,
          loading: null,
          dispatched: null
        },
        movementsCount: 0,
        totalDwellTime: 0
      });
    }

    // Mezclar aleatoriamente el conjunto para simular orden realista de descarga
    return pallets.sort(() => Math.random() - 0.5);
  }
}
