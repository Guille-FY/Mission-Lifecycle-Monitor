/* app.js */
const express = require('express');
const cors = require('cors');
const { metrics, trace, context } = require('@opentelemetry/api');

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. METRICS CONFIGURATION (Physics Simulation) ---
const meter = metrics.getMeter('rocket-physics');

// Observable Gauges for telemetry data
const fuelGauge = meter.createObservableGauge('rocket_fuel_level', { description: 'Remaining fuel percentage' });
const altGauge = meter.createObservableGauge('rocket_altitude', { description: 'Current altitude in meters' });
const speedGauge = meter.createObservableGauge('rocket_speed', { description: 'Current speed in km/h' });

// Internal Rocket State
let state = {
    status: 'IDLE', // States: IDLE, COUNTDOWN, FLYING, ABORT
    fuel: 100,
    altitude: 0,
    speed: 0,
    countdown: 180, // Default 3 minutes
};

// Callbacks for OTel to fetch values during export cycle
fuelGauge.addCallback((result) => result.observe(state.fuel));
altGauge.addCallback((result) => result.observe(state.altitude));
speedGauge.addCallback((result) => result.observe(state.speed));

// --- 2. SIMULATION LOOP (Physics Engine) ---
// Runs every 1000ms to update physics and handle state transitions
setInterval(() => {
    // Countdown Logic
    if (state.status === 'COUNTDOWN') {
        state.countdown--;
        console.log(`⏱️ T-Minus: ${state.countdown}s`);

        if (state.countdown <= 0) {
            state.status = 'FLYING';
            state.launch_time = Date.now();
            console.log("🚀 IGNITION! LIFTOFF!");
        }
    }

    // Flight Logic (Simulated Physics)
    if (state.status === 'FLYING') {
        // Update Mission Time
        if (state.launch_time) {
            state.mission_time = Date.now() - state.launch_time;
        }
        // Burn fuel
        if (state.fuel > 0) state.fuel -= 0.5;

        // Increase speed and altitude
        state.speed += 50 + (Math.random() * 10); // Acceleration + noise
        state.altitude += (state.speed / 3.6); // Convert km/h to m/s for altitude gain

        // Simulate Critical Events (Logs)
        if (Math.random() > 0.95) {
            console.log("⚠️ High vibration detected in Engine 2");
        }
    }
}, 1000);

// --- 3. COMMAND & CONTROL ENDPOINTS ---

/**
 * Endpoint: /start
 * Trigger: Initiates the launch sequence.
 */
app.post('/start', (req, res) => {
    // Create a manual span to track this critical command
    const span = trace.getTracer('mission-control').startSpan('mission.launch');

    if (state.status === 'IDLE') {
        state.status = 'COUNTDOWN';
        state.countdown = 5; // Shortened to 10s for testing (Production: 180s)

        span.addEvent('Sequence Initiated');
        res.json({ message: "Sequence started", status: state.status });
    } else {
        span.recordException(new Error('Rocket not in IDLE state'));
        span.setStatus({ code: 2, message: 'Error' }); // OTel Error Code
        res.status(400).json({ error: "Cannot start, rocket is busy", currentStatus: state.status });
    }

    span.end();
});

/**
 * Endpoint: /telemetry
 * Trigger: Polled by Frontend to visualize status.
 */
app.get('/telemetry', (req, res) => {
    res.json(state);
});

/**
 * Endpoint: /abort
 * Trigger: Emergency stop.
 */
app.post('/abort', (req, res) => {
    const span = trace.getTracer('mission-control').startSpan('mission.abort');
    state.status = 'ABORT';
    state.speed = 0;
    console.log("🚨 MISSION ABORTED");

    span.addEvent('Mission Aborted');
    span.end();

    res.json({ message: "Aborted" });
});

/**
 * Endpoint: /reset
 * Trigger: Reset simulation to initial state.
 */
app.post('/reset', (req, res) => {
    const span = trace.getTracer('mission-control').startSpan('mission.reset');
    state = { status: 'IDLE', fuel: 100, altitude: 0, speed: 0, countdown: 180 };
    console.log("🔄 System Reset");

    span.addEvent('System Reset');
    span.end();

    res.json({ message: "Reset OK" });
});

app.listen(8080, () => {
    console.log('🛸 Flight Computer listening on port 8080');
});