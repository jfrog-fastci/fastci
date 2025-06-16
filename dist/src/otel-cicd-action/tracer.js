"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringToRecord = stringToRecord;
exports.createTracerProvider = createTracerProvider;
const grpc_js_1 = require("@grpc/grpc-js");
const api_1 = require("@opentelemetry/api");
const context_async_hooks_1 = require("@opentelemetry/context-async-hooks");
const exporter_trace_otlp_grpc_1 = require("@opentelemetry/exporter-trace-otlp-grpc");
const exporter_trace_otlp_proto_1 = require("@opentelemetry/exporter-trace-otlp-proto");
const resources_1 = require("@opentelemetry/resources");
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const OTEL_CONSOLE_ONLY = process.env["OTEL_CONSOLE_ONLY"] === "true";
const OTEL_ID_SEED = Number.parseInt(process.env["OTEL_ID_SEED"] ?? "0");
function stringToRecord(s) {
    const record = {};
    for (const pair of s.split(",")) {
        const [key, value] = pair.split(/=(.*)/s);
        if (key && value) {
            record[key.trim()] = value.trim();
        }
    }
    return record;
}
function isHttpEndpoint(endpoint) {
    return endpoint.startsWith("https://") || endpoint.startsWith("http://");
}
function createTracerProvider(endpoint, headers, attributes) {
    // Register the context manager to enable context propagation
    const contextManager = new context_async_hooks_1.AsyncHooksContextManager();
    contextManager.enable();
    api_1.context.setGlobalContextManager(contextManager);
    let exporter = new sdk_trace_base_1.ConsoleSpanExporter();
    if (!OTEL_CONSOLE_ONLY) {
        if (isHttpEndpoint(endpoint)) {
            exporter = new exporter_trace_otlp_proto_1.OTLPTraceExporter({
                url: endpoint,
                headers: stringToRecord(headers),
            });
        }
        else {
            exporter = new exporter_trace_otlp_grpc_1.OTLPTraceExporter({
                url: endpoint,
                credentials: grpc_js_1.credentials.createSsl(),
                metadata: grpc_js_1.Metadata.fromHttp2Headers(stringToRecord(headers)),
            });
        }
    }
    const provider = new sdk_trace_base_1.BasicTracerProvider({
        resource: new resources_1.Resource(attributes),
        spanProcessors: [new sdk_trace_base_1.BatchSpanProcessor(exporter)],
        ...(OTEL_ID_SEED && { idGenerator: new DeterministicIdGenerator(OTEL_ID_SEED) }),
    });
    provider.register();
    return provider;
}
// Copied from xorshift32amx here: https://github.com/bryc/code/blob/master/jshash/PRNGs.md#xorshift
function createRandomWithSeed(seed) {
    let a = seed;
    return function getRandomInt(max) {
        let t = Math.imul(a, 1597334677);
        t = (t >>> 24) | ((t >>> 8) & 65280) | ((t << 8) & 16711680) | (t << 24); // reverse byte order
        a ^= a << 13;
        a ^= a >>> 17;
        a ^= a << 5;
        const res = ((a + t) >>> 0) / 4294967296;
        return Math.floor(res * max);
    };
}
/**
 * A deterministic id generator for testing purposes.
 */
class DeterministicIdGenerator {
    constructor(seed) {
        this.characters = "0123456789abcdef";
        this.getRandomInt = createRandomWithSeed(seed);
    }
    generateTraceId() {
        return this.generateId(32);
    }
    generateSpanId() {
        return this.generateId(16);
    }
    generateId(length) {
        let id = "";
        for (let i = 0; i < length; i++) {
            id += this.characters[this.getRandomInt(this.characters.length)];
        }
        return id;
    }
}
