[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

# Mission Lifecycle Monitor 🚀

**Mission Lifecycle Monitor** is a full-stack observability showcase project that simulates a complex rocket launch mission.

Designed to demonstrate **Operational Intelligence**, it integrates a retro-sci-fi "Glass Cockpit" dashboard with a physics-driven backend. The entire distributed system is instrumented with **OpenTelemetry**, providing deep insights through real-time distributed tracing, metrics collection, and structured logging.

![Mission Control Dashboard](docs/assets/screenshot.png)

## 🌐 Live Demo

You can access the hosted **Mission Control** dashboard directly here:
**[https://mission-lifecycle-monitor.guillermofy.com/](https://mission-lifecycle-monitor.guillermofy.com/)**

*   **View Only**: Observe the flight computer simulation in real-time.
*   **Note**: For full access to the observability stack (Jaeger traces, Prometheus metrics, Loki logs), please use the local Docker deployment.

## 🏗️ Architecture Overview

The project is designed as a modular distributed system. For detailed documentation on each component, please visit their respective folders:

1.  **[Mission Control (Frontend)](./mission-control/README.md)**: The "Glass Cockpit" dashboard built with Next.js and Tailwind CSS.
2.  **[Flight Computer (Backend)](./flight-computer/README.md)**: The physics engine and simulation logic built with Node.js.
3.  **[Ground Station (Infrastructure)](./ground-station/README.md)**: The Observability Stack (Prometheus, Jaeger, Loki, OTel Collector).

---

## 🚀 How to Run

### Method 1: Docker Quickstart (Recommended) 🐳

The easiest way to run the mission. Requires **only Docker Desktop**.

1.  Run everything:
    ```bash
    docker-compose up --build
    ```
2.  Access Mission Control at **[http://localhost:3000](http://localhost:3000)**.

### Method 2: Developer Mode (Hybrid)

Run infrastructure in Docker but keep apps local for development.

*   **Windows (PowerShell)**:
    ```powershell
    .\start-mission.ps1
    ```
*   **Linux/Mac (Bash)**:
    ```bash
    chmod +x start-mission.sh
    ./start-mission.sh
    ```

---

## 📂 Project Structure

```
Mission-Lifecycle-Monitor/
├── flight-computer/       # Backend (Node.js) & Physics Engine logic
├── mission-control/       # Frontend (Next.js) & Dashboard UI
├── ground-station/        # Observability Configs (Prometheus, Loki, etc.)
├── docs/                  # Documentation assets
├── docker-compose.yml     # Docker Root Compose (Runs everything)
└── package.json           # Root dependencies
```

## License

Distrubuted under the MIT License. See `LICENSE` for more information.

---

> Built with 💻 and 🚀 by Guillermo Fuentes Yago as a demonstration of Modern Observability Engineering.
