/**
 * exportCsv.js
 * Exportación de datos de simulación y métricas comparativas a formato CSV descargable
 */

import { formatDuration, formatSimulatedTime } from './formatter.js';

/**
 * Convierte un arreglo de objetos a string CSV
 * @param {Array<Object>} rows
 * @param {Array<string>} headers
 * @returns {string}
 */
function arrayToCsv(rows, headers) {
  const headerLine = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map(row => {
    return headers.map(field => {
      const val = row[field] !== undefined && row[field] !== null ? String(row[field]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Dispara la descarga de un archivo de texto/CSV en el navegador
 * @param {string} content
 * @param {string} filename
 */
function triggerDownload(content, filename) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta el registro completo de pallets procesados
 * @param {Array<Object>} pallets
 * @param {string} scenarioName
 */
export function exportPalletsToCsv(pallets, scenarioName = 'Simulacion_LogiSur') {
  if (!pallets || pallets.length === 0) {
    alert('No hay datos de pallets para exportar. Inicia la simulación primero.');
    return;
  }

  const exportData = pallets.map(p => ({
    'ID Pallet': p.id,
    'SKU': p.sku,
    'Descripción': p.description,
    'Categoría': p.category,
    'Tipo': p.type === 'CROSS_DOCK' ? 'Cross Dock' : 'Almacenamiento Convencional',
    'Destino': p.destinationName || p.destination,
    'Prioridad': p.priority,
    'Proveedor': p.supplier,
    'Estado Final': p.state,
    'Camión Origen': p.inboundTruckId || 'N/A',
    'Camión Despacho': p.outboundTruckId || 'N/A',
    'Hora Llegada': formatSimulatedTime(p.timestamps.received),
    'Hora Despacho': p.timestamps.dispatched ? formatSimulatedTime(p.timestamps.dispatched) : 'Pendiente',
    'Tiempo Total (min)': p.totalDwellTime ? Math.round(p.totalDwellTime) : 'N/A',
    'Tiempo Total Legible': p.totalDwellTime ? formatDuration(p.totalDwellTime) : 'En Proceso',
    'Movimientos Internos': p.movementsCount || (p.type === 'CROSS_DOCK' ? 2 : 5)
  }));

  const headers = [
    'ID Pallet', 'SKU', 'Descripción', 'Categoría', 'Tipo', 'Destino',
    'Prioridad', 'Proveedor', 'Estado Final', 'Camión Origen', 'Camión Despacho',
    'Hora Llegada', 'Hora Despacho', 'Tiempo Total (min)', 'Tiempo Total Legible', 'Movimientos Internos'
  ];

  const csv = arrayToCsv(exportData, headers);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  triggerDownload(csv, `LogiSur_${scenarioName}_Pallets_${timestamp}.csv`);
}

/**
 * Exporta el resumen comparativo entre Escenario Tradicional y Cross Docking
 * @param {Object} comparisonData
 */
export function exportComparisonToCsv(comparisonData) {
  if (!comparisonData) return;

  const rows = [
    {
      'Métrica': 'Pallets Totales Recibidos',
      'Escenario 1 (Tradicional)': comparisonData.traditional.totalReceived,
      'Escenario 2 (Cross Docking Parcial)': comparisonData.crossDock.totalReceived,
      'Diferencia / Impacto': 'Misma demanda'
    },
    {
      'Métrica': 'Pallets en Flujo Cross Dock',
      'Escenario 1 (Tradicional)': 0,
      'Escenario 2 (Cross Docking Parcial)': comparisonData.crossDock.crossDockCount,
      'Diferencia / Impacto': `+${comparisonData.crossDock.crossDockPercentage}% en flujo directo`
    },
    {
      'Métrica': 'Pallets Almacenados en Racks',
      'Escenario 1 (Tradicional)': comparisonData.traditional.storageCount,
      'Escenario 2 (Cross Docking Parcial)': comparisonData.crossDock.storageCount,
      'Diferencia / Impacto': `-${comparisonData.storageReduction}% pallets a racks`
    },
    {
      'Métrica': 'Tiempo Promedio de Ciclo CEDI',
      'Escenario 1 (Tradicional)': formatDuration(comparisonData.traditional.avgCycleTime),
      'Escenario 2 (Cross Docking Parcial)': formatDuration(comparisonData.crossDock.avgCycleTime),
      'Diferencia / Impacto': `-${comparisonData.timeReductionPercentage}% tiempo de ciclo`
    },
    {
      'Métrica': 'Tiempo Promedio Flujo Cross Dock',
      'Escenario 1 (Tradicional)': 'N/A (No existe)',
      'Escenario 2 (Cross Docking Parcial)': formatDuration(comparisonData.crossDock.avgCrossDockTime),
      'Diferencia / Impacto': 'Despacho en menos de 2.5 horas'
    },
    {
      'Métrica': 'Movimientos Internos Totales',
      'Escenario 1 (Tradicional)': comparisonData.traditional.totalMovements,
      'Escenario 2 (Cross Docking Parcial)': comparisonData.crossDock.totalMovements,
      'Diferencia / Impacto': `-${comparisonData.movementsReduction}% movimientos innecesarios`
    },
    {
      'Métrica': 'Ocupación de Posiciones de Almacén',
      'Escenario 1 (Tradicional)': `${comparisonData.traditional.storageOccupancyRate}%`,
      'Escenario 2 (Cross Docking Parcial)': `${comparisonData.crossDock.storageOccupancyRate}%`,
      'Diferencia / Impacto': 'Liberación de posiciones críticas'
    },
    {
      'Métrica': 'Tasa de Cumplimiento de Despacho',
      'Escenario 1 (Tradicional)': `${comparisonData.traditional.fulfillmentRate}%`,
      'Escenario 2 (Cross Docking Parcial)': `${comparisonData.crossDock.fulfillmentRate}%`,
      'Diferencia / Impacto': `+${(comparisonData.crossDock.fulfillmentRate - comparisonData.traditional.fulfillmentRate).toFixed(1)}% cumplimiento`
    },
    {
      'Métrica': 'Eficiencia Operacional Global',
      'Escenario 1 (Tradicional)': `${comparisonData.traditional.operationalEfficiency}%`,
      'Escenario 2 (Cross Docking Parcial)': `${comparisonData.crossDock.operationalEfficiency}%`,
      'Diferencia / Impacto': `+${(comparisonData.crossDock.operationalEfficiency - comparisonData.traditional.operationalEfficiency).toFixed(1)}% incremento`
    }
  ];

  const headers = ['Métrica', 'Escenario 1 (Tradicional)', 'Escenario 2 (Cross Docking Parcial)', 'Diferencia / Impacto'];
  const csv = arrayToCsv(rows, headers);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  triggerDownload(csv, `LogiSur_Comparacion_Tradicional_vs_CrossDock_${timestamp}.csv`);
}
