/**
 * Controls.js
 * Panel de controles de reproducción de la simulación
 * (Iniciar, Pausar, Reiniciar, Paso a Paso, Selector de Velocidad)
 */

export class Controls {
  /**
   * @param {string} containerId
   * @param {Object} callbacks - { onStart, onPause, onReset, onStep, onSpeedChange }
   */
  constructor(containerId, callbacks) {
    this.container = document.getElementById(containerId);
    this.callbacks = callbacks;
    this.currentSpeed = 5;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="card">
        <div class="card-title-bar">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Control de Simulación
          </h3>
        </div>

        <!-- Botones Principales -->
        <div class="playback-controls">
          <button class="btn btn-success" id="btnStartSim" title="Iniciar simulación">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Iniciar
          </button>
          
          <button class="btn btn-warning" id="btnPauseSim" title="Pausar simulación" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
            Pausar
          </button>

          <button class="btn btn-outline" id="btnResetSim" title="Reiniciar jornada">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reiniciar
          </button>
        </div>

        <!-- Selector de Velocidad -->
        <div class="speed-selector">
          <span>Velocidad:</span>
          <div class="speed-buttons">
            <button class="speed-btn" data-speed="1">1x</button>
            <button class="speed-btn" data-speed="2">2x</button>
            <button class="speed-btn active" data-speed="5">5x</button>
            <button class="speed-btn" data-speed="10">10x</button>
            <button class="speed-btn" data-speed="25">25x</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const btnStart = document.getElementById('btnStartSim');
    const btnPause = document.getElementById('btnPauseSim');
    const btnReset = document.getElementById('btnResetSim');

    btnStart.addEventListener('click', () => {
      if (this.callbacks.onStart) this.callbacks.onStart();
    });

    btnPause.addEventListener('click', () => {
      if (this.callbacks.onPause) this.callbacks.onPause();
    });

    btnReset.addEventListener('click', () => {
      if (this.callbacks.onReset) this.callbacks.onReset();
    });

    // Velocidades
    const speedBtns = this.container.querySelectorAll('.speed-btn');
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const speed = Number(btn.getAttribute('data-speed'));
        this.currentSpeed = speed;
        if (this.callbacks.onSpeedChange) this.callbacks.onSpeedChange(speed);
      });
    });
  }

  updateState(isRunning, isPaused) {
    const btnStart = document.getElementById('btnStartSim');
    const btnPause = document.getElementById('btnPauseSim');

    if (isRunning) {
      btnStart.disabled = true;
      btnPause.disabled = false;
      btnStart.classList.remove('btn-success');
      btnStart.classList.add('btn-outline');
    } else {
      btnStart.disabled = false;
      btnPause.disabled = true;
      btnStart.classList.add('btn-success');
      btnStart.classList.remove('btn-outline');
    }
  }
}
