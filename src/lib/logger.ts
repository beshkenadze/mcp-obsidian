import pino from "pino";

// Get environment variables
const logLevel = process.env.LOG_LEVEL || "info";
const logToStderr = process.env.LOG_TO_STDERR === "true";

// Configure additional options for enhanced debugging
const baseLoggerOptions = {
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  // Include error stack traces and more detailed error handling
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    // Serialize request objects better
    req: pino.stdSerializers.req,
    // Serialize response objects better
    res: pino.stdSerializers.res,
  },
};

// Configure the logger to use pino-pretty for console output
const logger = pino(
  baseLoggerOptions,
  pino.transport({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
      messageFormat: "{msg} {reqId} {req} {res}",
      errorLikeObjectKeys: ["err", "error"],
      errorProps: "stack",
      destination: logToStderr ? 2 : 1, // Use stderr if LOG_TO_STDERR=true
    },
  })
);

export default logger;
