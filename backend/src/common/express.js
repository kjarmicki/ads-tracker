'use strict';

/*
 * This module contains Express-specific utilities and middleware.
 */

const {ValidationError} = require('./errors');

// so I can use async/await route handlers and don't have to deal with next() for error handling
function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      return await handler(req, res);
    } catch (error) {
      return next(error);
    }
  };
}

// this middleware uses context to initialize correlation id of the request
// and logs the beginning and the end of the exchange
function createExchangeLoggingMiddleware(context, logger) {
  return (req, res, next) => {
    context.run(() => {
      logger.info(`Request ${req.method} at ${req.url}`);
      res.on('finish', () => {
        logger.info(`Response ${res.statusCode} for ${req.method} at ${req.url}`);
      });
      next();
    });
  };
}

function isProduction(env) {
  return env === 'production';
}

// I don't want to soil my generic errors with HTTP-specific status codes, so here I'm connecting the two
// I'm also making sure that my private errors and stack traces are not exposed in production
function formatHttpErrorOutput(error, env) {
  if (error instanceof ValidationError) {
    return {
      statusCode: 400,
      message: error.message,
    ...(isProduction(env) ? {} : {stack: error.stack})
    };
  }
  return {
    statusCode: 500,
    message: (isProduction(env)) ? (error.clientMessage || 'Internal server error') : error.message,
    ...(isProduction(env) ? {} : {stack: error.stack})
  };
}

function formatLogErrorOutput(error) {
  if (error instanceof ValidationError) {
    return {
      method: 'warn',
      message: `${error.message} ${error.stack}`
    }
  }
  return {
    method: 'error',
    message: `${error.message} ${error.stack}`
  };
}

function createErrorHandlingMiddleware(logger, env) {
  return (error, req, res, next) => {
    const logErrorOutput = formatLogErrorOutput(error);
    logger[logErrorOutput.method](logErrorOutput.message);

    const httpErrorOutput = formatHttpErrorOutput(error, env);
    if (res.headersSent) {
      return next(httpErrorOutput);
    }
    const {statusCode, ...details} = httpErrorOutput;
    res.status(statusCode).json(details);
  };
}

module.exports = {
  asyncHandler,
  createExchangeLoggingMiddleware,
  createErrorHandlingMiddleware
};
