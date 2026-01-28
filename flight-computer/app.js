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
    status: 'IDLE', // States: IDLE, COUNTDOWN, FLYING, ABORT, ORBIT
    fuel: 100,
    altitude: 0,
    speed: 0,
    countdown: 180, // Default 3 minutes
    events: [], // Log events
    flags: {
        maxQ: false,
        meco: false,
        stageSep: false,
        mach1: false,
        gravityTurn: false,
        fairingSep: false,
        handover: false
    }
};

// Helper to add log
const addLog = (message, type = 'INFO') => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    state.events.push(logEntry);
    // Keep last 50 events
    if (state.events.length > 50) state.events.shift();
    console.log(`[${type}] ${message}`);
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

        if (state.countdown === 60) addLog("T-Minus 1 minute");
        if (state.countdown === 10) addLog("Guidance is internal");
        if (state.countdown === 6) addLog("Main Engine Start Sequence");

        // Console log for debug, but we rely on state.events for frontend
        console.log(`⏱️ T-Minus: ${state.countdown}s`);

        if (state.countdown <= 0) {
            state.status = 'FLYING';
            state.launch_time = Date.now();
            addLog("IGNITION! LIFTOFF! We have a liftoff.", "SUCCESS");
            addLog("Tower cleared", "INFO");
        }
    }

    // Flight Logic (Simulated Physics)
    if (state.status === 'FLYING') {
        // Update Mission Time
        if (state.launch_time) {
            state.mission_time = Date.now() - state.launch_time;
        }

        // --- PHASE 1: ASCENT ---
        // Burn fuel to gain speed
        if (state.fuel > 0) {
            state.fuel -= 0.7; // ~142 seconds of burn time
            state.speed += 210 + (Math.random() * 30); // Higher Install Thrust

            // Failure 3: Ignitor/Combustion Instability (Early Ascent only: T+0 to T+4s)
            if (state.mission_time < 4000 && Math.random() < 0.05) { // 5% chance relative high risk at start
                state.status = 'ABORT';
                addLog("CRITICAL: Combustion Instability Detected", "ERROR");
                addLog("AUTOMATIC PAD ABORT TRIGGERED", "ERROR");
            }

        } else {
            state.speed -= 50; // Drag
            if (state.status === 'FLYING' && state.altitude < 160000) {
                addLog("PROPELLANT DEPLETED BEFORE ORBIT INJECTION", "WARNING");
                // Depending on altitude, this might be a failure, but let's just warn for now
            }
        }

        // Increase altitude based on speed (km/h -> m/s)
        state.altitude += (state.speed / 3.6) * 0.35;

        // --- REALISTIC EVENTS ---

        // 1. Gravity Turn Initiation (Altitude > 1km)
        if (state.altitude > 1000 && !state.flags.gravityTurn) {
            state.flags.gravityTurn = true;
            addLog("Gravity Turn Maneuver Started", "INFO");
        }

        // 2. Mach 1 (Sound Barrier) - Approx 1234 km/h
        if (state.speed > 1234 && !state.flags.mach1) {
            state.flags.mach1 = true;
            addLog("Vehicle is Supersonic (Mach 1)", "INFO");
        }

        // 3. Max Q (Maximum Dynamic Pressure) - typically around 10-15km often
        if (state.altitude > 11000 && !state.flags.maxQ) {
            state.flags.maxQ = true;
            addLog("MAX Q reached (Maximum Dynamic Pressure)", "INFO");
            // Add some stress vibration here conceptually
        }

        if (state.altitude > 14000 && state.flags.maxQ && state.altitude < 15000) {
            // Just a confirmation passing it
        }

        // 4. Telemetry Handover (Ground to Satellite) - ~50km
        if (state.altitude > 50000 && !state.flags.handover) {
            state.flags.handover = true;
            addLog("Telemetry Handover to Data Relay Satellites", "INFO");
        }

        // 5. Fairing Separation - ~110km 
        if (state.altitude > 110000 && !state.flags.fairingSep) {
            state.flags.fairingSep = true;
            addLog("Fairing Separation Confirmed", "SUCCESS");
        }

        // 2. Main Engine Cutoff (MECO) & Stage 1 Separation - Approx 70-80km
        if (state.altitude > 75000 && !state.flags.meco) {
            state.flags.meco = true;
            addLog("MECO (Main Engine Cutoff) Confirmed", "INFO");

            setTimeout(() => {
                if (state.status === 'ABORT') return;
                state.flags.stageSep = true;
                addLog("Stage 1 Separation Confirmed", "SUCCESS");
                addLog("Stage 2 Engine Ignition", "INFO");
            }, 2000); // Simulate delay
        }


        // --- FAILURE PROBABILITIES ---
        // Checking periodically. ~0.3% chance per tick creates approx 30% cumulative failure rate over ascent
        if (state.mission_time > 5000 && !state.flags.meco) {
            // Failure 1: Turbopump (0.15% per tick)
            if (Math.random() < 0.0015) {
                state.status = 'ABORT';
                addLog("CRITICAL: Turbopump Exhaust Temp High", "ERROR");
                addLog("AUTOMATIC ABORT SEQUENCE INITIATED", "ERROR");
            }
            // Failure 2: Hydraulics (0.15% per tick)
            else if (Math.random() < 0.0015) {
                state.status = 'ABORT';
                addLog("CRITICAL: Hydraulic Pressure Loss in Actuators", "ERROR");
                addLog("AUTOMATIC ABORT SEQUENCE INITIATED", "ERROR");
            }
        }


        // --- PHASE 2: ORBIT INJECTION ---
        // Target Orbit Altitude: 170km (170,000m)
        if (state.altitude >= 170000) {
            state.status = 'ORBIT';
            state.speed = 27600; // Orbital Velocity (km/h)
            state.altitude = 170000;
            addLog("Orbit Insertion Complete", "SUCCESS");
            addLog("SECO (Second Engine Cutoff)", "INFO");
            addLog("Systems Nominal", "SUCCESS");
        }

        // Simulate Critical Events (Logs)
        if (Math.random() > 0.99) {
            addLog("Telemetry Check: Signal Nominal", "INFO");
        }
    }

    // --- PHASE 3: ORBIT STABILIZATION ---
    if (state.status === 'ORBIT') {
        if (state.launch_time) {
            state.mission_time = Date.now() - state.launch_time;
        }

        // Micro-adjustments to simulate orbital mechanics
        state.speed = 27600 + (Math.random() * 50 - 25);
        state.altitude = 170000 + (Math.random() * 200 - 100);
        state.fuel = Math.max(state.fuel, 0); // Ensure non-negative
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
    addLog("MANUAL ABORT COMMAND RECEIVED", "WARNING");
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
    state = {
        status: 'IDLE',
        fuel: 100,
        altitude: 0,
        speed: 0,
        countdown: 180,
        events: [],
        flags: {
            maxQ: false,
            meco: false,
            stageSep: false,
            mach1: false,
            gravityTurn: false,
            fairingSep: false,
            handover: false
        }
    };
    addLog("System Reset", "INFO");
    console.log("🔄 System Reset");

    span.addEvent('System Reset');
    span.end();

    res.json({ message: "Reset OK" });
});

app.listen(8080, () => {
    console.log('🛸 Flight Computer listening on port 8080');
});