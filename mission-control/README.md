# Mission Control (Frontend)

**Mission Control** is the user interface for the Mission Lifecycle Monitor. It acts as the "Glass Cockpit," rendering high-frequency telemetry and providing command and control capabilities.

## 🛠️ Architecture

*   **Tech**: Next.js 15, React 19, Tailwind CSS, Recharts.
*   **Role**: Renders 60fps telemetry animation and sends command signals.
*   **Style**: Retro-terminal aesthetic with **VT323** font and CSS animations.

## ✨ Key Features

*   **Reactive Dashboard**: 
    *   **Animated Metrics**: Smooth number interpolation for a fluid "cockpit" feel.
    *   **Live Charts**: High-performance Area Charts utilizing Recharts with optimized rendering.
    *   **Flight Events Terminal**: A scrolling, color-coded terminal window displaying real-time system logs.
*   **Interactive Controls**: Initiate launches, trigger aborts, and reset simulations.

## 🎮 Usage

1.  **Start Mission**: Click the **"INITIATE LAUNCH SEQUENCE"** button.
    *   Observe the countdown and logs in the **Terminal**.
    *   Watch the status change to `FLYING`.
    *   See telemetry visualizations (Color changes for Supersonic/Hypersonic).
    *   Monitor for potential failures!

2.  **Telemetry Analysis**:
    *   Click **"SYS_TRACES"** in the Command Sequence panel to open **Jaeger**.
    *   Click **"SYS_METRICS"** to open **Prometheus**.

## 🚀 Manual Startup

If you prefer to run the frontend manually:

```bash
cd mission-control
npm install
npm run dev
```
*The dashboard runs on `http://localhost:3000`.*
