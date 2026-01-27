/* src/utils/otel.ts */
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { ZoneContextManager } from '@opentelemetry/context-zone';

const startOtel = () => {
    if (typeof window === 'undefined') return; // Don't run on server side

    console.log("📡 Initializing Frontend Telemetry...");

    // Send traces to Collector via HTTP (Port 4318)
    const exporter = new OTLPTraceExporter({
        url: 'http://localhost:4318/v1/traces',
    });

    const provider = new WebTracerProvider({
        resource: resourceFromAttributes({
            [SEMRESATTRS_SERVICE_NAME]: 'mission-control-ui',
        }),
        spanProcessors: [
            new SimpleSpanProcessor(exporter),
        ],
    });

    provider.register({
        // Important for async operations in browser
        contextManager: new ZoneContextManager(),
    });

    // Instrument 'fetch' automatically to inject headers
    registerInstrumentations({
        instrumentations: [
            new FetchInstrumentation({
                propagateTraceHeaderCorsUrls: [
                    /.+/g, // Propagate to all URLs (including localhost:8080)
                ],
            }),
        ],
    });
};

export default startOtel;