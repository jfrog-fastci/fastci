import { debug } from "@actions/core";

// Define interface for options
interface CoralogixLogOptions {
  subsystemName: string;
  computerName?: string;
  severity?: number;
  category?: string;
  className?: string;
  methodName?: string;
  threadId?: string;
  hiResTimestamp?: string;
}

/**
 * Send logs to Coralogix Singles API using OTEL token and endpoint
 * @param {string | object} message - The log message text or object
 * @param {CoralogixLogOptions} options - Additional options
 * @param {string} options.subsystemName - Subsystem name (required)
 * @param {string} options.computerName - Computer name (optional)
 * @param {number} options.severity - Log severity: 1-Debug, 2-Verbose, 3-Info, 4-Warn, 5-Error, 6-Critical (optional)
 * @param {string} options.category - Category field (optional)
 * @param {string} options.className - Class field (optional)
 * @param {string} options.methodName - Method field (optional)
 * @param {string} options.threadId - Thread ID field (optional)
 * @returns {Promise<any>} - Promise resolving to response or error
 */
export async function sendCoralogixLog(message: any, options: CoralogixLogOptions) {
  // Get OpenTelemetry endpoint and token from environment variables
  const otelEndpoint = process.env.FASTCI_OTEL_ENDPOINT || 'ingress.coralogix.us';
  const otelToken = process.env.FASTCI_OTEL_TOKEN;

  if (!otelToken) {
    throw new Error('FASTCI_OTEL_TOKEN environment variable is required');
  }

  // Prepare log entry
  const logEntry: any = {
    applicationName: "fastci-github-action",
    subsystemName: options.subsystemName,
    text: typeof message === 'object' ? JSON.stringify(message) : message,
    timestamp: Date.now(),
    severity: options.severity || 3, // Default to Info
  };

  // Add optional fields if present
  if (options.computerName) logEntry.computerName = options.computerName;
  if (options.category) logEntry.category = options.category;
  if (options.className) logEntry.className = options.className;
  if (options.methodName) logEntry.methodName = options.methodName;
  if (options.threadId) logEntry.threadId = options.threadId;
  if (options.hiResTimestamp) logEntry.hiResTimestamp = options.hiResTimestamp;

  try {
    // Using fetch API (available in Node.js since v18)
    debug(`Sending log to Coralogix: ${JSON.stringify(logEntry)}`);
    const response = await fetch(`https://${otelEndpoint}/logs/v1/singles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${otelToken}`
      },
      body: JSON.stringify([logEntry]) // API expects an array of log entries
    });

    if (!response.ok) {
      throw new Error(`Failed to send log: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending log to Coralogix:', error);
    throw error;
  }
}