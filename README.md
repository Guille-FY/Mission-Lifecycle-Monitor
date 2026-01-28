# Mission Lifecycle Monitor 🚀

**Mission Lifecycle Monitor** is a full-stack observability demonstration project that simulates a rocket launch mission. It integrates a retro-sci-fi "Mission Control" dashboard with a backend "Flight Computer" that generates real-time physics telemetry. The entire system is instrumented with **OpenTelemetry** to demonstrate end-to-end distributed tracing, metrics collection, and system monitoring.

![Mission Control Dashboard](./screenshot.png) *<!-- Add a screenshot here later -->*

## 🏗️ Architecture

The project consists of three main subsystems:

1.  **Mission Control (Frontend)**:
    *   A **Next.js** application acting as the command center.
    *   Displays real-time telemetry (Altitude, Speed, Fuel, Status).
    *   Provides mission controls (Launch, Abort, Reset).
    *   Styled with a retro-terminal aesthetic using **Tailwind CSS** and the **VT323** font.

2.  **Flight Computer (Backend)**:
    *   A **Node.js/Express** service acting as the rocket's On-Board Computer (OBC).
    *   Simulates physics (acceleration, fuel burn, orbital mechanics).
    *   Instrumented with **OpenTelemetry** to emit traces and metrics for every event and state change.

3.  **Ground Station (Infrastructure)**:
    *   A **Docker Compose** stack hosting the observability backend.
    *   **OpenTelemetry Collector**: Aggregates data from the Flight Computer.
    *   **Prometheus**: Stores time-series metrics (Fuel levels, Speed).
    *   **Jaeger**: Visualizes distributed traces (Launch sequence transactions).



---

## ✨ Key Features

*   **Realistic Physics Engine**: Simulates "Gravity Turn" mechanics, air resistance, and orbital velocity transitions.
*   **Real-time Telemetry**: 1Hz data updates for Altitude, Speed, and Fuel Status.
*   **Reactive Dashboard**: 
    *   **Animated Metrics**: Smooth number interpolation for a fluid "cockpit" feel.
    *   **Live Charts**: High-performance Area Charts utilizing Recharts with optimized rendering.
    *   **Flight Events Terminal**: A scrolling, color-coded terminal window displaying real-time system logs.
*   **Full Observability**: Every action is traced from the click in the browser to the backend logic.

---

## 📜 Flight Sequence & Events

The **Flight Computer** simulates a realistic launch timeline with specific events based on altitude and speed thresholds:

1.  **Start Sequence**: Countdown from T-10, Internal Guidance transition, Main Engine Start.
2.  **Ignition & Liftoff**: Launch detection and tower clearance.
3.  **Gravity Turn (T+ ~10s)**: Rocket begins pitching over to gain horizontal velocity.
4.  **Mach 1 (Sound Barrier)**: Vehicle transitions to supersonic flight (~1234 km/h).
5.  **Max Q (11 km)**: Maximum Dynamic Pressure region, where structural stress is highest.
6.  **Telemetry Handover (50 km)**: Comm link transitions from ground stations to TDRS satellite network.
7.  **MECO (Main Engine Cut-off) (75 km)**: First stage engine shutdown.
8.  **Stage Separation**: Separation of first stage and ignition of the second stage vacuum engine.
9.  **Fairing Separation (110 km)**: Protective nose cone deploy.
10. **Orbit Insertion (170 km)**: Target altitude reached, SECO (Second Engine Cut-off), and Systems Nominal.

---

## ⚠️ Failure Scenarios

This is not just a "happy path" demo. The system includes a **probabilistic failure engine** to demonstrate anomaly detection:

*   **Pad Abort (Start)**: 5% chance of Combustion Instability during the first 4 seconds of flight.
*   **Ascent Failures**: ~30% cumulative probability of critical failure during ascent (Turbopump Overheat or Hydraulic Pressure Loss).
*   **Manual Abort**: The user can trigger an emergency abort at any time, which logs a specific `WARNING` event.

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js 15, React 19, Tailwind CSS, Lucide Icons, Recharts (Custom Implementation), Auto-scrolling Terminal UI.
*   **Backend**: Node.js, Express.js.
*   **Observability**: OpenTelemetry (Node.js SDK), Docker, Prometheus, Jaeger.
*   **Automation**: PowerShell scripting.

---

## 📋 Prerequisites

Before running the mission, ensure you have the following installed:

*   **Node.js** (v20 or higher)
*   **Docker Desktop** (Running and configured)
*   **Git**

---

## 🚀 How to Run

### Method 1: The "One-Click" Launch (Windows PowerShell)

We have provided a comprehensive PowerShell script that orchestrates the entire startup sequence (Docker infrastructure -> Backend -> Frontend).

1.  Open PowerShell in the project root.
2.  Run the start script:
    ```powershell
    .\start-mission.ps1
    ```
3.  The script will:
    *   Spin up the Ground Station (Docker containers).
    *   Wait for services to warm up.
    *   Launch the Flight Computer in a new window.
    *   Launch Mission Control in a new window.
    *   Tell you when ready!

4.  **Graceful Shutdown**: Press any key in the main PowerShell window to stop the mission. The script will automatically:
    *   Find and close the Flight Computer window.
    *   Find and close the Mission Control window.
    *   Stop and remove all Docker containers.

### Method 2: Manual Start

If you prefer to run things manually or are on a non-Windows system:

1.  **Start Ground Station (Docker)**
    ```bash
    docker-compose -f ground-station/docker-compose.yaml up -d
    ```

2.  **Start Flight Computer (Backend)**
    ```bash
    # From the project root
    npm install
    # Run with OTel instrumentation
    node --require ./flight-computer/instrumentation.js flight-computer/app.js
    ```
    *The server runs on port `8080`.*

3.  **Start Mission Control (Frontend)**
    ```bash
    cd mission-control
    npm install
    ```
    *The dashboard runs on `http://localhost:3000`.*

---

## 🎮 Usage

1.  Open your browser to **[http://localhost:3000](http://localhost:3000)**.

2.  **Status**: Typically starts in `IDLE`.
3.  **Start Mission**: Click the **"INITIATE LAUNCH SEQUENCE"** button.
    *   Observe the countdown/logs in the new **Terminal**.
    *   Watch the status change to `FLYING`.
    *   See telemetry (Code color changes for Supersonic/Hypersonic).
    *   Monitor for potential failures!
4.  **Telemetry Analysis**:
    *   Click **"SYS_TRACES"** in the Command Sequence panel to open **Jaeger** and view distributed traces of your commands (Launch/Abort/Reset).
    *   Click **"SYS_METRICS"** to open **Prometheus** and analyze raw system metrics like `rocket_fuel_level` or `rocket_speed`.

## 📂 Project Structure

```
Mission-Lifecycle-Monitor/
├── flight-computer/       # Node.js Backend & Physics Engine
│   ├── app.js             # Main simulation logic & API
│   └── instrumentation.js # OpenTelemetry SDK setup
├── mission-control/       # Next.js Frontend Dashboard
│   ├── app/               # React components & Pages
│   └── components/        # Dashboard UI widgets
├── ground-station/        # Infrastructure
│   ├── docker-compose.yaml
│   └── *.yaml             # Configs for Prometheus, OTel, etc.
├── start-mission.ps1      # Orchestration Script
└── package.json           # Root dependencies
```

## License

This project is for educational and demonstration purposes.
