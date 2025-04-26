// set the CORALOGIX_URL environmental variable if your team URL different than <team>.coralogix.com
// process.env.CORALOGIX_URL = 'https://ingress.Cluster URL/api/v1/logs';
var Coralogix = require("coralogix-logger");

interface LoggerOptions {
  applicationName?: string;
  privateKey?: string;
  subsystemName?: string;
  category?: string;
}

/**
 * Creates and returns a shared logger instance
 * @param {Object} options - Logger configuration options
 * @param {string} options.applicationName - Name of the application
 * @param {string} options.privateKey - Private key for Coralogix
 * @param {string} options.subsystemName - Name of the subsystem
 * @param {string} options.category - Category for the logger (default: "Default Category")
 * @returns {Object} - Configured logger instance
 */
export function createSharedLogger({
  applicationName = "fastci-github-action",
  privateKey = "your-private-key",
  subsystemName = "[repo]/[workflow]",
  category = "CI"
}: LoggerOptions = {}) {
  // global config for application name, private key, subsystem name 
  const config = new Coralogix.LoggerConfig({
    applicationName,
    privateKey,
    subsystemName,
  });

  Coralogix.CoralogixLogger.configure(config);

  // create a new logger with category 
  const logger = new Coralogix.CoralogixLogger(category);
  
  // Add helper methods for common log levels
  return {
    log: (text: string, className: string = "className", methodName: string = "methodName") => {
      const log = new Coralogix.Log({
        severity: Coralogix.Severity.info,
        className,
        methodName,
        text
      });
      logger.addLog(log);
    },
    info: (text: string, className: string = "className", methodName: string = "methodName") => {
      const log = new Coralogix.Log({
        severity: Coralogix.Severity.info,
        className,
        methodName,
        text
      });
      logger.addLog(log);
    },
    debug: (text: string, className: string = "className", methodName: string = "methodName") => {
      const log = new Coralogix.Log({
        severity: Coralogix.Severity.debug,
        className,
        methodName,
        text
      });
      logger.addLog(log);
    },
    warning: (text: string, className: string = "className", methodName: string = "methodName") => {
      const log = new Coralogix.Log({
        severity: Coralogix.Severity.warning,
        className,
        methodName,
        text
      });
      logger.addLog(log);
    },
    error: (text: string, className: string = "className", methodName: string = "methodName") => {
      const log = new Coralogix.Log({
        severity: Coralogix.Severity.error,
        className,
        methodName,
        text
      });
      logger.addLog(log);
    },
    addLog: (log: any) => {
      logger.addLog(log);
    }
  };
}

// Example usage:
// const logger = createSharedLogger({
//   applicationName: "my-app",
//   privateKey: process.env.CORALOGIX_PRIVATE_KEY,
//   subsystemName: "my-subsystem",
//   category: "My Category"
// });
// 
// logger.info("This is an info message");
// logger.error("This is an error message");