# Ground Station (Infrastructure)

The **Ground Station** represents the underlying infrastructure and observability stack that monitors the mission. It uses Docker Compose to orchestrate the observability tools.

## 🛠️ Architecture

*   **Tech**: Docker Compose.
*   **Observability Stack**:
    *   **OpenTelemetry Collector**: Aggregates all signals from Flight Computer and Mission Control.
    *   **Prometheus**: Stores time-series metrics (Fuel, Altitude, Speed).
    *   **Jaeger**: Visualizes distributed traces (e.g., Latency of "Launch" command).
    *   **Grafana Loki**: Aggregates structured logs for anomaly detection and event playback.

## 🔍 Observability Data Analysis

The system is fully instrumented to provide a "Glass Box" view of the mission.

### 1. 🕸️ Distributed Traces (Jaeger)
Every command (Launch, Abort, Reset) generates a unique **Trace ID** that propagates through the system.
*   **Goal**: Analyze latency and request flows.
*   **Visual**: A breakdown of how long the backend takes to process a "Start Mission" request.

### 2. 📈 System Metrics (Prometheus)
The Flight Computer emits physical telemetry at 1Hz.
*   **Goal**: Monitor trend lines and resource depletion.
*   **Key Metrics**: `rocket_altitude`, `rocket_speed`, `rocket_fuel_level`.

### 3. 📜 Event Logs (Loki)
Structured logs provide the narrative of the mission. The Mission Control dashboard consumes these via a "Live Tail" mechanism.
*   **Pipeline**: `Flight Computer (JSON)` -> `OTel Collector` -> `Loki` -> `Mission Control`.
*   **Format**: JSON-structured log lines.

## 🚀 Manual Startup

To run just the infrastructure services (useful if you are running the apps locally for development):

```bash
docker-compose -f ground-station/docker-compose.yaml up -d
```
