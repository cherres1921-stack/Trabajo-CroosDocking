/**
 * CediLayout.js
 * Renderizador visual 2D en Canvas interactivo del CEDI LogiSur S.A.C. (Arequipa)
 *
 * Muestra las 7 zonas operativas del layout:
 * 1. RECEPCIÓN (Muelles Inbound 1-4)
 * 2. CONTROL DE CALIDAD Y CLASIFICACIÓN
 * 3. CROSS DOCK (Bahías Tacna, Cusco, Puno)
 * 4. ALMACENAMIENTO CONVENCIONAL (Racks multinivel)
 * 5. PICKING
 * 6. CONSOLIDACIÓN
 * 7. DESPACHO (Muelles Outbound 1-4)
 *
 * Incluye circulación de montacargas, pasos peatonales, flujo animado de pallets y camiones.
 */

export class CediLayout {
  /**
   * @param {string} canvasId
   * @param {Function} onPalletClick - Callback al hacer clic en un pallet
   */
  constructor(canvasId, onPalletClick) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.onPalletClick = onPalletClick;
    
    // Coordenadas base del layout (normalizadas a 1200x600)
    this.baseWidth = 1200;
    this.baseHeight = 600;

    // Estado local para animación
    this.pallets = [];
    this.trucks = { inbound: [], outbound: [], inboundDocks: [], dispatchDocks: [] };
    this.kpis = null;
    this.animatedPallets = []; // Pallets con posición interpolada (x, y)
    this.forklifts = [
      { id: 'FL-01', x: 280, y: 150, targetX: 450, targetY: 150, speed: 1.5, carrying: null },
      { id: 'FL-02', x: 450, y: 380, targetX: 720, targetY: 380, speed: 1.2, carrying: null },
      { id: 'FL-03', x: 750, y: 180, targetX: 1000, targetY: 180, speed: 1.8, carrying: null }
    ];

    this.zonesDef = this.defineZones();
    this.setupCanvasResize();
    this.bindInteractions();
    this.startRenderLoop();
  }

  setupCanvasResize() {
    const resize = () => {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height || 520;
    };
    window.addEventListener('resize', resize);
    resize();
  }

  defineZones() {
    return {
      // 1. Recepción (Inbound)
      reception: {
        id: 'reception',
        name: '1. RECEPCIÓN (INBOUND)',
        x: 30, y: 30, w: 180, h: 540,
        color: 'rgba(6, 182, 212, 0.08)',
        borderColor: '#06b6d4',
        type: 'dock'
      },
      // 2. Control de Calidad y Clasificación
      quality: {
        id: 'quality',
        name: '2. CONTROL & CLASIFICACIÓN',
        x: 240, y: 160, w: 160, h: 280,
        color: 'rgba(56, 189, 248, 0.08)',
        borderColor: '#38bdf8',
        type: 'process'
      },
      // 3. Bahías Cross Dock (Tacna, Cusco, Puno)
      crossdock_tacna: {
        id: 'crossdock_tacna',
        name: '3A. CROSS DOCK TACNA',
        x: 440, y: 30, w: 220, h: 100,
        color: 'rgba(6, 182, 212, 0.12)',
        borderColor: '#06b6d4',
        dest: 'tacna',
        type: 'crossdock'
      },
      crossdock_cusco: {
        id: 'crossdock_cusco',
        name: '3B. CROSS DOCK CUSCO',
        x: 440, y: 145, w: 220, h: 100,
        color: 'rgba(139, 92, 246, 0.12)',
        borderColor: '#8b5cf6',
        dest: 'cusco',
        type: 'crossdock'
      },
      crossdock_puno: {
        id: 'crossdock_puno',
        name: '3C. CROSS DOCK PUNO',
        x: 440, y: 260, w: 220, h: 100,
        color: 'rgba(245, 158, 11, 0.12)',
        borderColor: '#f59e0b',
        dest: 'puno',
        type: 'crossdock'
      },
      // 4. Almacenamiento Convencional (Racks)
      storage: {
        id: 'storage',
        name: '4. ALMACÉN RACKS (2,800 POS.)',
        x: 440, y: 385, w: 220, h: 185,
        color: 'rgba(249, 115, 22, 0.08)',
        borderColor: '#f97316',
        type: 'storage'
      },
      // 5. Picking
      picking: {
        id: 'picking',
        name: '5. PICKING CONVENCIONAL',
        x: 700, y: 385, w: 140, h: 185,
        color: 'rgba(236, 72, 153, 0.08)',
        borderColor: '#ec4899',
        type: 'picking'
      },
      // 6. Consolidación
      consolidation: {
        id: 'consolidation',
        name: '6. CONSOLIDACIÓN',
        x: 700, y: 30, w: 140, h: 330,
        color: 'rgba(168, 85, 247, 0.1)',
        borderColor: '#a855f7',
        type: 'consolidation'
      },
      // 7. Despacho (Outbound)
      dispatch: {
        id: 'dispatch',
        name: '7. DESPACHO (OUTBOUND)',
        x: 880, y: 30, w: 290, h: 540,
        color: 'rgba(34, 197, 94, 0.08)',
        borderColor: '#22c55e',
        type: 'dock'
      }
    };
  }

  updateData(tickData) {
    this.pallets = tickData.pallets || [];
    this.trucks = tickData.trucks || this.trucks;
    this.kpis = tickData.kpis;
    this.syncAnimatedPallets();
  }

  /**
   * Sincroniza y calcula las posiciones espaciales de los pallets según su estado actual
   */
  syncAnimatedPallets() {
    const activePallets = this.pallets.filter(p => p.state !== 'PENDING_ARRIVAL');

    // Mapear cada pallet a sus coordenadas en el plano 1200x600
    this.animatedPallets = activePallets.slice(0, 150).map((p, idx) => {
      const targetPos = this.getCoordinatesForState(p, idx);
      return {
        ...p,
        targetX: targetPos.x,
        targetY: targetPos.y,
        currentX: p.x || targetPos.x,
        currentY: p.y || targetPos.y
      };
    });
  }

  getCoordinatesForState(pallet, index) {
    const state = pallet.state;
    const dest = pallet.destination;

    switch (state) {
      case 'RECEIVED':
        return { x: 120 + (index % 3) * 16, y: 100 + ((index * 12) % 400) };
      case 'CHECKING':
      case 'CLASSIFIED':
        return { x: 270 + (index % 4) * 22, y: 220 + ((index * 14) % 180) };
      case 'CROSS_DOCK':
        if (dest === 'tacna') return { x: 470 + (index % 6) * 24, y: 65 + ((index * 12) % 45) };
        if (dest === 'cusco') return { x: 470 + (index % 6) * 24, y: 180 + ((index * 12) % 45) };
        return { x: 470 + (index % 6) * 24, y: 295 + ((index * 12) % 45) };
      case 'STORAGE':
        return { x: 470 + (index % 6) * 26, y: 430 + ((index * 14) % 110) };
      case 'PICKING':
        return { x: 730 + (index % 3) * 25, y: 430 + ((index * 14) % 110) };
      case 'CONSOLIDATION':
        return { x: 730 + (index % 3) * 25, y: 80 + ((index * 14) % 230) };
      case 'LOADING':
        if (dest === 'tacna') return { x: 940 + (index % 3) * 16, y: 90 + ((index * 10) % 60) };
        if (dest === 'cusco') return { x: 940 + (index % 3) * 16, y: 230 + ((index * 10) % 60) };
        return { x: 940 + (index % 3) * 16, y: 370 + ((index * 10) % 60) };
      case 'DISPATCHED':
        return { x: 1100 + (index % 2) * 18, y: 120 + ((index * 20) % 360) };
      default:
        return { x: 50, y: 50 };
    }
  }

  startRenderLoop() {
    const loop = () => {
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Escala proporcional
    const scaleX = width / this.baseWidth;
    const scaleY = height / this.baseHeight;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.scale(scaleX, scaleY);

    // 1. Dibujar Cuadrícula y Vías de Circulación
    this.drawCirculationPathways(ctx);

    // 2. Dibujar Zonas Operativas del Layout
    this.drawZones(ctx);

    // 3. Dibujar Muelles y Camiones
    this.drawDocksAndTrucks(ctx);

    // 4. Dibujar Montacargas
    this.drawForklifts(ctx);

    // 5. Dibujar Pallets Animados
    this.drawPallets(ctx);

    ctx.restore();
  }

  drawCirculationPathways(ctx) {
    // Vías de montacargas (líneas amarillas segmentadas)
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.25)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);

    // Vía principal Inbound -> Clasificación
    ctx.beginPath();
    ctx.moveTo(210, 270);
    ctx.lineTo(240, 270);
    ctx.stroke();

    // Vía Clasificación -> Bahías Cross Dock & Almacén
    ctx.beginPath();
    ctx.moveTo(400, 200);
    ctx.lineTo(440, 80);
    ctx.moveTo(400, 270);
    ctx.lineTo(440, 195);
    ctx.moveTo(400, 340);
    ctx.lineTo(440, 310);
    ctx.moveTo(400, 420);
    ctx.lineTo(440, 470);
    ctx.stroke();

    // Vía Cross Dock -> Consolidación (Flujo Verde Directo)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(660, 80);
    ctx.lineTo(700, 80);
    ctx.moveTo(660, 195);
    ctx.lineTo(700, 195);
    ctx.moveTo(660, 310);
    ctx.lineTo(700, 310);
    ctx.stroke();

    // Vía Almacén -> Picking -> Consolidación
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
    ctx.beginPath();
    ctx.moveTo(660, 475);
    ctx.lineTo(700, 475);
    ctx.moveTo(770, 385);
    ctx.lineTo(770, 360);
    ctx.stroke();

    // Vía Consolidación -> Muelles Despacho
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
    ctx.beginPath();
    ctx.moveTo(840, 195);
    ctx.lineTo(880, 195);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  drawZones(ctx) {
    const kpis = this.kpis;

    Object.values(this.zonesDef).forEach(zone => {
      // Fondo de Zona
      ctx.fillStyle = zone.color;
      ctx.strokeStyle = zone.borderColor;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(zone.x, zone.y, zone.w, zone.h, 8);
      ctx.fill();
      ctx.stroke();

      // Encabezado de la Zona
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
      ctx.fillText(zone.name, zone.x + 10, zone.y + 18);

      // Subtítulo / Indicador de Capacidad
      ctx.font = '10px JetBrains Mono, monospace';
      if (zone.type === 'crossdock' && kpis) {
        const destKey = zone.dest;
        const destStats = kpis.byDestination?.[destKey];
        ctx.fillStyle = zone.borderColor;
        ctx.fillText(`Pallets: ${destStats?.crossDock || 0} | Cap: 80`, zone.x + 10, zone.y + 32);
      } else if (zone.type === 'storage' && kpis) {
        ctx.fillStyle = '#f97316';
        ctx.fillText(`Ocupación: ${kpis.storageUtilizationRate?.toFixed(1)}%`, zone.x + 10, zone.y + 32);
      } else if (zone.type === 'consolidation' && kpis) {
        ctx.fillStyle = '#a855f7';
        ctx.fillText(`En cola: ${kpis.inConsolidation || 0}`, zone.x + 10, zone.y + 32);
      }
    });

    // Dibujar estructura interna de Racks de Almacenamiento (Pasillos A, B, C)
    const storage = this.zonesDef.storage;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let r = 0; r < 4; r++) {
      const ry = storage.y + 45 + r * 32;
      ctx.strokeRect(storage.x + 15, ry, storage.w - 30, 20);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '9px monospace';
      ctx.fillText(`RACK 0${r + 1}`, storage.x + 20, ry + 14);
    }
  }

  drawDocksAndTrucks(ctx) {
    // 1. Muelles Inbound (Izquierda)
    const inboundDocks = this.trucks.inboundDocks || [];
    for (let i = 0; i < 4; i++) {
      const y = 60 + i * 125;
      const dock = inboundDocks[i];
      const isOccupied = dock && dock.truck;

      ctx.fillStyle = isOccupied ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = isOccupied ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(40, y, 70, 95);
      ctx.fillRect(40, y, 70, 95);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(`REC-0${i + 1}`, 45, y + 15);

      if (isOccupied) {
        // Dibujar Camión Inbound
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(45, y + 25, 60, 60);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('CAMIÓN IN', 48, y + 45);
        ctx.font = '8px monospace';
        ctx.fillText(`${dock.truck.unloadedCount}/${dock.truck.palletCount}`, 48, y + 60);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '9px sans-serif';
        ctx.fillText('LIBRE', 55, y + 55);
      }
    }

    // 2. Muelles Outbound (Derecha)
    const dispatchDocks = this.trucks.dispatchDocks || [];
    const destLabels = ['TACNA', 'CUSCO', 'PUNO', 'MIXTO'];
    for (let i = 0; i < 4; i++) {
      const y = 60 + i * 125;
      const dock = dispatchDocks[i];
      const isOccupied = dock && dock.truck;

      ctx.fillStyle = isOccupied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = isOccupied ? '#22c55e' : 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(960, y, 100, 95);
      ctx.fillRect(960, y, 100, 95);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(`DESP-0${i + 1} (${destLabels[i]})`, 965, y + 15);

      if (isOccupied) {
        // Dibujar Camión Outbound
        const truck = dock.truck;
        ctx.fillStyle = truck.color || '#10b981';
        ctx.fillRect(965, y + 25, 90, 60);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(truck.id, 970, y + 42);
        ctx.font = '8px monospace';
        ctx.fillText(`Carga: ${truck.loadedPallets.length}/${truck.capacity}`, 970, y + 58);
        ctx.fillText(`Dest: ${destLabels[i]}`, 970, y + 72);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '9px sans-serif';
        ctx.fillText('ESPERA', 990, y + 55);
      }
    }
  }

  drawForklifts(ctx) {
    this.forklifts.forEach(fl => {
      // Movimiento suave oscilatorio
      fl.x += (fl.targetX - fl.x) * 0.02 * fl.speed;
      fl.y += (fl.targetY - fl.y) * 0.02 * fl.speed;

      if (Math.abs(fl.targetX - fl.x) < 5) {
        // Invertir objetivo
        const tempX = fl.x;
        fl.x = fl.targetX;
        fl.targetX = tempX > 500 ? 300 : 750;
      }

      // Dibujar Montacargas
      ctx.fillStyle = '#eab308';
      ctx.fillRect(fl.x - 8, fl.y - 8, 16, 16);
      ctx.fillStyle = '#000000';
      ctx.fillRect(fl.x - 4, fl.y - 4, 8, 8);

      // Horquillas
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fl.x + 8, fl.y - 4);
      ctx.lineTo(fl.x + 14, fl.y - 4);
      ctx.moveTo(fl.x + 8, fl.y + 4);
      ctx.lineTo(fl.x + 14, fl.y + 4);
      ctx.stroke();
    });
  }

  drawPallets(ctx) {
    this.animatedPallets.forEach(p => {
      // Interpolación hacia coordenadas destino
      p.currentX += (p.targetX - p.currentX) * 0.12;
      p.currentY += (p.targetY - p.currentY) * 0.12;

      // Color del pallet según tipo y destino
      const isCrossDock = p.type === 'CROSS_DOCK';
      ctx.fillStyle = isCrossDock ? '#10b981' : '#f59e0b';
      
      // Dibujar Pallet como rectángulo con borde
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.fillRect(p.currentX - 6, p.currentY - 6, 12, 12);
      ctx.strokeRect(p.currentX - 6, p.currentY - 6, 12, 12);

      // Marca visual interna
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText(isCrossDock ? 'CD' : 'AL', p.currentX - 5, p.currentY + 3);
    });
  }

  bindInteractions() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / this.canvas.width;
      const scaleY = this.baseHeight / this.canvas.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Buscar si se hizo clic en un pallet
      const clickedPallet = this.animatedPallets.find(p => {
        return Math.hypot(p.currentX - clickX, p.currentY - clickY) < 15;
      });

      if (clickedPallet && this.onPalletClick) {
        this.onPalletClick(clickedPallet);
      }
    });
  }
}
