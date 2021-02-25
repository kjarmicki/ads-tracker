'use strict';

/*
 * This module is responsible for creating logger objects using Winston module.
 *
 * It depends on context in order to attach correlation id to logs. It's also capable of
 * outputting logs as a pretty-print (for local development purposes) or as a single-line JSON strings (for production).
 */

module.exports = function createWinstonLoggerFactory(winston, context) {
  const addCorrelationId = winston.format((info) => {
    const correlationId = context.getCorrelationId();
    if (!info.correlationId && correlationId) {
      info.correlationId = correlationId;
    }
    return info;
  });

  return function createLogger(level, format) {
    return winston.createLogger({
      level,
      format: winston.format.combine(
        addCorrelationId(),
        winston.format.timestamp(),
        (format === 'pretty' ? winston.format.prettyPrint() : winston.format.json())
      ),
      transports: [
        new winston.transports.Console()
      ]
    });
  };
}
