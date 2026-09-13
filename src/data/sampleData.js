/**
 * sampleData.js
 * Configuración base, catálogo de productos y supuestos iniciales
 * para la simulación de Cross Docking Parcial - CEDI LogiSur S.A.C. (Arequipa)
 *
 * NOTA ACADÉMICA:
 * Los valores aquí presentados corresponden a SUPUESTOS CONFIGURABLES
 * utilizados para demostrar el modelo de optimización logística.
 */

export const INITIAL_CONFIG = {
  // Parámetros de demanda y flujo diario (Supuestos Base)
  dailyPallets: 450,           // Pallets totales recibidos por día
  crossDockPercentage: 40,     // 40% destinado a Cross Docking (180 pallets)
  storagePercentage: 60,       // 60% destinado a Almacenamiento (270 pallets)

  // Distribución de pallets Cross Dock por destino secundario
  destinationShares: {
    tacna: 60,                 // 60 pallets (~33.3% del Cross Dock)
    cusco: 65,                 // 65 pallets (~36.1% del Cross Dock)
    puno: 55                   // 55 pallets (~30.6% del Cross Dock)
  },

  // Capacidades físicas del CEDI Arequipa
  capacities: {
    totalStoragePositions: 2800, // Capacidad total en posiciones de pallets
    initialStorageOccupancy: 0.95, // 95% de ocupación previa en el caso base
    currentOccupiedPositions: 2660, // 95% de 2800
    receptionDockCount: 4,       // Muelles de recepción (Inbound)
    dispatchDockCount: 4,        // Muelles de despacho (Outbound)
    crossDockBayCapacity: {
      tacna: 80,                 // Capacidad máx. en bahía temporal Tacna
      cusco: 80,                 // Capacidad máx. en bahía temporal Cusco
      puno: 80                   // Capacidad máx. en bahía temporal Puno
    },
    qualityControlCapacity: 24,  // Capacidad de zona de clasificación/control
    consolidationCapacity: 60,   // Capacidad en zona de consolidación
    receptionStagingCapacity: 40 // Capacidad de playa de recepción
  },

  // Flota y características de camiones
  truckConfig: {
    inboundTruckCapacity: 25,    // Pallets por camión de proveedor entrante (~18 camiones para 450 pallets)
    outboundTruckCapacity: 20,   // Pallets por camión hacia provincias (Tacna, Cusco, Puno)
    inboundFleetSize: 18,        // Cantidad de camiones entrantes programados
    outboundFleetSize: 12,       // Cantidad de camiones de despacho disponibles
    dispatchPolicy: 'FULL_OR_WINDOW' // Sale al llenarse o por ventana horaria máxima
  },

  // Tiempos operativos estándar (en minutos simulados)
  operationTimes: {
    unloadPerPallet: 1.5,        // Tiempo de descarga por pallet (min)
    qualityCheckPerPallet: 2.0,  // Tiempo de inspección y clasificación por pallet (min)
    crossDockMoveTime: 3.0,      // Traslado directo a bahía Cross Dock (min)
    storagePutawayTime: 12.0,    // Traslado y ubicación en racks elevados (min)
    pickingTimePerPallet: 15.0,  // Tiempo de picking / extracción de racks (min)
    consolidationTime: 3.5,      // Tiempo de consolidación y emplayado por pallet (min)
    loadingPerPallet: 2.0        // Tiempo de carga en camión saliente (min)
  },

  // Turno de trabajo y horarios
  simulationSchedule: {
    startHour: 6,                // 06:00 AM inicio de operaciones
    endHour: 22,                 // 22:00 PM fin de jornada de recepción/despacho
    durationMinutes: 960,        // 16 horas operativas (960 min)
    timeMultiplier: 5            // Multiplicador inicial de velocidad
  }
};

/**
 * Catálogo de SKUs de consumo masivo para LogiSur S.A.C.
 * Los productos de alta rotación (Categoría A) tienen regla preferente de Cross Docking.
 */
export const SKU_CATALOG = [
  // ALTA ROTACIÓN (Candidatos a Cross Docking - Alimentos y bebidas de consumo diario)
  {
    sku: 'SKU-BEB-101',
    description: 'Bebida Gaseosa 3L (Pack x4)',
    category: 'BEBIDAS',
    supplier: 'Embotelladora Andina',
    rotation: 'ALTA',
    defaultType: 'CROSS_DOCK',
    unitWeightKg: 750,
    tempControl: false
  },
  {
    sku: 'SKU-LAC-102',
    description: 'Leche Evaporada 400g (Caja x48)',
    category: 'LACTEOS',
    supplier: 'Lácteos del Sur S.A.',
    rotation: 'ALTA',
    defaultType: 'CROSS_DOCK',
    unitWeightKg: 820,
    tempControl: false
  },
  {
    sku: 'SKU-ARR-103',
    description: 'Arroz Superior 50kg (Sacos)',
    category: 'GRANOS',
    supplier: 'Molino Arequipeño',
    rotation: 'ALTA',
    defaultType: 'CROSS_DOCK',
    unitWeightKg: 1000,
    tempControl: false
  },
  {
    sku: 'SKU-ACE-104',
    description: 'Aceite Vegetal 1L (Caja x12)',
    category: 'ABARROTES',
    supplier: 'Aceites del Pacífico',
    rotation: 'ALTA',
    defaultType: 'CROSS_DOCK',
    unitWeightKg: 680,
    tempControl: false
  },
  {
    sku: 'SKU-AZU-105',
    description: 'Azúcar Rubia Doméstica 50kg',
    category: 'ABARROTES',
    supplier: 'Agroindustrial Chucarapi',
    rotation: 'ALTA',
    defaultType: 'CROSS_DOCK',
    unitWeightKg: 1000,
    tempControl: false
  },
  {
    sku: 'SKU-FID-106',
    description: 'Fideos Spaghetti 500g (Caja x20)',
    category: 'ABARROTES',
    supplier: 'Pastas del Valle',
    rotation: 'ALTA',
    defaultType: 'CROSS_DOCK',
    unitWeightKg: 550,
    tempControl: false
  },

  // ROTACIÓN MEDIA Y BAJA (Destinados a Almacenamiento en Racks Convencionales)
  {
    sku: 'SKU-LIM-201',
    description: 'Detergente Polvo 4.5kg (Sacos)',
    category: 'LIMPIEZA',
    supplier: 'Química Industrial Sur',
    rotation: 'MEDIA',
    defaultType: 'STORAGE',
    unitWeightKg: 600,
    tempControl: false
  },
  {
    sku: 'SKU-HIG-202',
    description: 'Papel Higiénico Doble Hoja (Fardo)',
    category: 'CUIDADO PERSONAL',
    supplier: 'Papelera Nacional',
    rotation: 'MEDIA',
    defaultType: 'STORAGE',
    unitWeightKg: 320,
    tempControl: false
  },
  {
    sku: 'SKU-CON-203',
    description: 'Conservas de Atún 170g (Caja x48)',
    category: 'CONSERVAS',
    supplier: 'Pesquera del Sur',
    rotation: 'MEDIA',
    defaultType: 'STORAGE',
    unitWeightKg: 580,
    tempControl: false
  },
  {
    sku: 'SKU-GAL-204',
    description: 'Galletas Surtidas Display x24',
    category: 'SNACKS',
    supplier: 'Golosinas Peruanas',
    rotation: 'BAJA',
    defaultType: 'STORAGE',
    unitWeightKg: 400,
    tempControl: false
  },
  {
    sku: 'SKU-ESP-205',
    description: 'Especias y Condimentos Surtidos',
    category: 'ABARROTES',
    supplier: 'Sabor Andino',
    rotation: 'BAJA',
    defaultType: 'STORAGE',
    unitWeightKg: 280,
    tempControl: false
  },
  {
    sku: 'SKU-JAB-206',
    description: 'Jabón de Tocador 120g (Caja x72)',
    category: 'CUIDADO PERSONAL',
    supplier: 'Química Industrial Sur',
    rotation: 'BAJA',
    defaultType: 'STORAGE',
    unitWeightKg: 450,
    tempControl: false
  }
];

/**
 * Destinos secundarios de la red logística de LogiSur
 */
export const DESTINATIONS = {
  tacna: {
    id: 'tacna',
    name: 'Tacna (Sucursal Sur)',
    distanceKm: 370,
    transitHours: 6.5,
    color: '#06b6d4', // Cyan
    badgeClass: 'badge-tacna',
    prefix: 'TAC'
  },
  cusco: {
    id: 'cusco',
    name: 'Cusco (CEDI Regional)',
    distanceKm: 480,
    transitHours: 9.0,
    color: '#8b5cf6', // Purple
    badgeClass: 'badge-cusco',
    prefix: 'CUS'
  },
  puno: {
    id: 'puno',
    name: 'Puno (Almacén Frontera)',
    distanceKm: 295,
    transitHours: 5.5,
    color: '#f59e0b', // Amber
    badgeClass: 'badge-puno',
    prefix: 'PUN'
  }
};

/**
 * Proveedores principales asociados a los camiones inbound
 */
export const SUPPLIERS = [
  'Embotelladora Andina S.A.',
  'Lácteos del Sur S.A.C.',
  'Molino Arequipeño Central',
  'Aceites del Pacífico',
  'Agroindustrial Chucarapi',
  'Química Industrial Sur',
  'Papelera Nacional del Perú',
  'Pesquera & Alimentos Marinos'
];

/**
 * Presets preconfigurados para demostraciones académicas
 */
export const PRESETS = [
  {
    id: 'base',
    name: 'Escenario Base LogiSur (Trabajo Final)',
    description: '450 pallets/día, 40% Cross Docking (180 pallets: Tacna 60, Cusco 65, Puno 55) y 60% Almacenamiento (270 pallets).',
    config: {
      dailyPallets: 450,
      crossDockPercentage: 40,
      destinationShares: { tacna: 60, cusco: 65, puno: 55 },
      inboundTruckCapacity: 25,
      outboundTruckCapacity: 20
    }
  },
  {
    id: 'high_crossdock',
    name: 'Optimización Alta (60% Cross Dock)',
    description: 'Mayor absorción en flujo directo para reducir drásticamente la saturación del CEDI al 95%.',
    config: {
      dailyPallets: 450,
      crossDockPercentage: 60,
      destinationShares: { tacna: 90, cusco: 100, puno: 80 },
      inboundTruckCapacity: 25,
      outboundTruckCapacity: 20
    }
  },
  {
    id: 'peak_season',
    name: 'Pico de Campaña (600 pallets)',
    description: 'Aumento de demanda a 600 pallets/día para estresar la capacidad de muelles y verificar congestión.',
    config: {
      dailyPallets: 600,
      crossDockPercentage: 45,
      destinationShares: { tacna: 90, cusco: 100, puno: 80 },
      inboundTruckCapacity: 25,
      outboundTruckCapacity: 22
    }
  }
];
