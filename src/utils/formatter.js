/**
 * formatter.js
 * Funciones de formateo para tiempo, números, monedas y porcentajes
 */

/**
 * Formatea minutos simulados a formato de reloj HH:MM AM/PM
 * @param {number} simulatedMinutes - Minutos desde el inicio (e.g. 0 = 06:00 AM)
 * @param {number} startHour - Hora inicial (default 6 AM)
 * @returns {string} e.g. "08:35 AM"
 */
export function formatSimulatedTime(simulatedMinutes, startHour = 6) {
  const totalMinutes = (startHour * 60) + Math.floor(simulatedMinutes);
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  
  const paddedMins = mins < 10 ? `0${mins}` : mins;
  const paddedHours = hours12 < 10 ? `0${hours12}` : hours12;
  
  return `${paddedHours}:${paddedMins} ${period}`;
}

/**
 * Formatea duración en minutos a formato legible (e.g. "2h 45m" o "35m")
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (isNaN(minutes) || minutes === null || minutes === undefined) return '0 min';
  const totalMins = Math.max(0, Math.round(minutes));
  if (totalMins < 60) {
    return `${totalMins} min`;
  }
  const hours = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

/**
 * Formatea porcentaje con decimales
 * @param {number} value - Valor (0 - 100 o 0 - 1)
 * @param {number} decimals - Cantidad de decimales (default 1)
 * @param {boolean} isDecimalFraction - true si el valor está en rango 0.0 - 1.0
 */
export function formatPercentage(value, decimals = 1, isDecimalFraction = false) {
  if (isNaN(value) || value === null || value === undefined) return '0.0%';
  const num = isDecimalFraction ? value * 100 : value;
  return `${num.toFixed(decimals)}%`;
}

/**
 * Formatea números con separador de miles
 * @param {number} value
 */
export function formatNumber(value) {
  if (isNaN(value) || value === null || value === undefined) return '0';
  return Math.round(value).toLocaleString('es-PE');
}

/**
 * Formateo de etiquetas de estado
 */
export function formatStateLabel(state) {
  const labels = {
    RECEIVED: 'Recibido',
    CHECKING: 'Control Calidad',
    CLASSIFIED: 'Clasificado',
    CROSS_DOCK: 'En Cross Dock',
    STORAGE: 'Almacenado (Racks)',
    PICKING: 'En Picking',
    CONSOLIDATION: 'Consolidación',
    LOADING: 'Cargando',
    DISPATCHED: 'Despachado'
  };
  return labels[state] || state;
}

/**
 * Retorna la clase CSS de color para cada estado
 */
export function getStateColorClass(state) {
  const classes = {
    RECEIVED: 'status-received',
    CHECKING: 'status-checking',
    CLASSIFIED: 'status-classified',
    CROSS_DOCK: 'status-crossdock',
    STORAGE: 'status-storage',
    PICKING: 'status-picking',
    CONSOLIDATION: 'status-consolidation',
    LOADING: 'status-loading',
    DISPATCHED: 'status-dispatched'
  };
  return classes[state] || 'status-default';
}
