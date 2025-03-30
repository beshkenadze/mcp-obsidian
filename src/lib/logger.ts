import path from "path";
import pino from "pino";

// Get environment variables
const logLevel = process.env.LOG_LEVEL || "info";
const logToConsole = process.env.LOG_TO_CONSOLE !== "false";

// File destination configuration
const fileDestination = pino.destination({
  dest: path.join(process.cwd(), "logs/mcp-server.log"),
  mkdir: true,
});

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

// Configure the logger
const logger = logToConsole
  ? pino(
      baseLoggerOptions,
      pino.multistream([
        { stream: fileDestination },
        {
          stream: pino.transport({
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
              messageFormat: "{msg} {reqId} {req} {res}",
              errorLikeObjectKeys: ["err", "error"],
              errorProps: "stack",
            },
          }),
        },
      ])
    )
  : pino(baseLoggerOptions, fileDestination);

export default logger;
