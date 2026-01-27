/* instrumentation.js */
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-grpc');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const { SEMRESATTRS_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

// 1. Define Service Identity
// This name will appear in Jaeger and Prometheus as the source of data.
const resource = resourceFromAttributes({
    [SEMRESATTRS_SERVICE_NAME]: 'miura-flight-computer',
});

// 2. SDK Configuration
const sdk = new NodeSDK({
    resource: resource,

    // Trace Exporter: Sends spans to OTel Collector via gRPC
    traceExporter: new OTLPTraceExporter({
        url: 'http://localhost:4317',
    }),

    // Metric Reader: Sends metrics to OTel Collector via gRPC
    // Export interval set to 1000ms for real-time demo purposes
    metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
            url: 'http://localhost:4317',
        }),
        exportIntervalMillis: 1000,
    }),

    // Enable auto-instrumentation for standard libraries (Express, HTTP, etc.)
    instrumentations: [getNodeAutoInstrumentations()],
});

// 3. Start the SDK
sdk.start();

console.log('📡 OpenTelemetry initialized. Telemetry system ready.');

// Graceful shutdown to ensure all pending telemetry is flushed
process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('Tracing terminated'))
        .catch((error) => console.log('Error terminating tracing', error))
        .finally(() => process.exit(0));
});