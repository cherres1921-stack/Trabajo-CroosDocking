# Simulador de Cross Docking Parcial - CEDI LogiSur S.A.C. (Arequipa)

> **Trabajo Final - Curso: Centros de Distribución**  
> Aplicación web interactiva desarrollada para simular y demostrar el impacto operativo del **Cross Docking Parcial** en un Centro de Distribución de consumo masivo con distribución hacia Tacna, Cusco y Puno.

---

## 🌟 Características Principales

1. **Plano 2D Interactivo y Animado del CEDI (Canvas & SVG)**:
   - Visualización de las 7 zonas operativas:
     1. **Recepción (Inbound):** 4 muelles con camiones proveedores descargando.
     2. **Control de Calidad y Clasificación:** Identificación por SKU y asignación según rotación.
     3. **Bahías Cross Dock:** Zonas dedicadas para Tacna, Cusco y Puno.
     4. **Almacenamiento Convencional:** Racks multinivel con pasillos A, B, C y D.
     5. **Picking Convencional:** Extracción y preparación de pedidos.
     6. **Consolidación:** Agrupación y emplayado por destino secundario.
     7. **Despacho (Outbound):** 4 muelles con camiones cargando hacia provincias.
   - Tránsito visual animado de pallets y montacargas en tiempo real.
   - Clic directo en cualquier pallet del plano para abrir su **ficha de trazabilidad y tiempos de permanencia**.

2. **Panel de Parámetros y Supuestos Configurables**:
   - Ajuste interactivo de demanda diaria (100 - 800 pallets/día).
   - Porcentaje de Cross Docking (10% - 90%).
   - Distribución personalizada de pallets a Tacna, Cusco y Puno.
   - Capacidad de camiones de despacho (10 - 35 pallets).
   - Presets preconfigurados: *Escenario Base LogiSur*, *Optimización Alta (60% CD)* y *Pico de Campaña*.

3. **Dashboard de KPIs en Tiempo Real**:
   - Pallets recibidos, en Cross Dock, almacenados en racks y despachados.
   - Tasa de cumplimiento de despachos (%).
   - Lead time promedio de Cross Dock vs Almacenamiento tradicional.
   - Porcentaje de ocupación de almacenamiento (base 2,800 posiciones).
   - Barra de control de integridad matemática estricta: `Pallets CD + Pallets Almacén = Pallets Recibidos`.

4. **Módulo de Comparación de Escenarios (Escenario 1 vs Escenario 2)**:
   - **Escenario 1 (Tradicional):** Recepción → Almacenamiento en Racks → Picking → Consolidación → Despacho.
   - **Escenario 2 (Cross Docking Parcial):** Recepción → Clasificación → Bahía Cross Dock → Consolidación → Despacho.
   - Tabla comparativa de tiempos de ciclo, movimientos de manipulación, ocupación de espacio y eficiencia global (+26.8% de ganancia de productividad).

5. **Herramientas de Exportación y Análisis**:
   - Descarga de registro completo de pallets a formato **CSV**.
   - Descarga del reporte de matriz comparativa a formato **CSV**.
   - Buscador y filtrado interactivo por SKU, ID y destino.
   - Registro en tiempo real de alertas operativas y saturación.

---

## 🚀 Cómo Ejecutar la Aplicación

La aplicación ha sido construida con tecnología web moderna estándar (HTML5, CSS3, ES6 JavaScript Modules) y es **100% autocontenida**, por lo que **no requiere instalación previa de Node.js, Python ni servidores externos**.

### Opción 1: Abrir Directamente en el Navegador
1. Haz doble clic en el archivo `index.html` ubicado en la raíz del proyecto.
2. O arrastra `index.html` a cualquier navegador web moderno (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).

---

## 📁 Estructura del Proyecto

```text
├── index.html                    # Punto de entrada principal
├── README.md                     # Guía de usuario y ejecución
├── simulation_logic.md           # Documento académico y formulación matemática
└── src/
    ├── app.js                    # Coordinador principal de la aplicación
    ├── styles/
    │   └── main.css              # Sistema de diseño, temas y animaciones
    ├── data/
    │   └── sampleData.js         # Catálogo de SKUs, destinos, proveedores y supuestos
    ├── simulation/
    │   ├── SimulationEngine.js   # Motor de simulación de eventos discretos
    │   ├── CrossDockRules.js     # Reglas de negocio y clasificación de pallets
    │   ├── TruckManager.js       # Gestión de muelles y flotas Inbound/Outbound
    │   ├── KpiCalculator.js      # Métricas y validaciones matemáticas en tiempo real
    │   └── TraditionalEngine.js  # Motor de comparación para el Escenario 1
    ├── components/
    │   ├── Header.js             # Encabezado, reloj simulado y accesos rápidos
    │   ├── Controls.js           # Botones Play, Pausa, Reset y multiplicador de velocidad
    │   ├── ConfigPanel.js        # Panel interactivo de parámetros y supuestos
    │   ├── CediLayout.js         # Renderizado 2D en Canvas con animación de flujo
    │   ├── KpiDashboard.js       # Tarjetas de indicadores en tiempo real
    │   ├── PalletInspector.js    # Modal de inspección y trazabilidad por pallet
    │   ├── ChartsView.js         # Gráficos de flujo acumulado y destinos
    │   ├── ComparisonModal.js    # Modal comparativo Tradicional vs Cross Dock
    │   └── AlertsLog.js          # Registro histórico de alertas y eventos
    └── utils/
        ├── exportCsv.js          # Exportador a hojas de cálculo CSV
        └── formatter.js          # Formateadores de tiempo, números y estados
```

---

## 🎓 Supuestos Académicos

Los valores numéricos base (450 pallets/día, 40% Cross Dock, 180 pallets CD, 60 pallets a Tacna, 65 a Cusco, 55 a Puno) corresponden a **supuestos configurables** diseñados para modelar y comprobar la teoría de optimización de Centros de Distribución. Todos los parámetros pueden ajustarse libremente desde el panel lateral.
