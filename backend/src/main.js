'use strict';

/*
 * This is the main module of the application. Its purpose is to wire everything together and expose
 * an object that allows start and stop the application.
 */

require('dotenv').config();
const {AsyncLocalStorage} = require('async_hooks');
const express = require('express');
const cors = require('cors');
const winston = require('winston');
const {DateTime} = require('luxon');
const mongodbClient = require('mongodb');
const {MongoMemoryServer} = optional('mongodb-memory-server');
const createEventsRoutes = require('./events/routes');
const createEventsMongodbRepository = require('./events/mongodb-repository');
const createEventsFactory = require('./events/event');
const createContext = require('./common/context');
const createWinstonLoggerFactory = require('./common/winston');
const {
  createExchangeLoggingMiddleware,
  createErrorHandlingMiddleware
} = require('./common/express');
const createMongodbUtils = require('./common/mongodb');

function optional(moduleName) {
  try {
    return require(moduleName);
  } catch {
    return {};
  }
}

module.exports = function createMainModule() {
  const configuration = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 4000,
    logLevel: process.env.LOG_LEVEL || 'info',
    logFormat: process.env.LOG_FORMAT || 'pretty',
    mongodbUri: process.env.MONGODB_URI
  };

  const context = createContext(AsyncLocalStorage, nextCorrelationId);
  const createLogger = createWinstonLoggerFactory(winston, context);
  const logger = createLogger(configuration.logLevel, configuration.logFormat);
  const mongodbUtils = createMongodbUtils(mongodbClient, MongoMemoryServer, logger, configuration.env);
  const createEvent = createEventsFactory(DateTime);
  const mongodbLocalServerInstanceSymbol = createMongodbUtils.LOCAL_SERVER_INSTANCE_SYMBOL;
  let appServer, mongodbConnectedClient, mongodbLocalServer;

  function nextCorrelationId() {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString()
  }

  async function safely(asyncOperation) {
    try {
      await asyncOperation();
    } catch (error) {
      logger.warn(error.message);
    }
  }

  async function start() {
    const app = await setupApp();
    const {port} = configuration;
    await new Promise((resolve, reject) => {
      appServer = app.listen(port, (err) => err ? reject(err) : resolve());
    });
    logger.info(`Ads tracking backend started on port ${port}`);
    return app;
  }

  async function stop() {
    await safely(() => appServer.close());
    await safely(() => mongodbConnectedClient.close());
    await safely(() => mongodbLocalServer.stop());
  }

  async function setupApp() {
    const app = express();
    app.use(express.json());
    app.use(cors());
    app.use(createExchangeLoggingMiddleware(context, logger));

    mongodbConnectedClient = await mongodbUtils.getConnectedClient(configuration.mongodbUri);
    mongodbLocalServer = mongodbConnectedClient[mongodbLocalServerInstanceSymbol];

    const eventsRepository = setupEventsRepository(mongodbConnectedClient);
    app.use('/events', await setupEventsRoutes(eventsRepository));

    app.use(createErrorHandlingMiddleware(logger, configuration.env));
    return app;
  }

  function setupEventsRepository(connectedClient) {
    const collection = connectedClient.db('events').collection('events');
    const repository = createEventsMongodbRepository(collection);
    return repository;
  }

  async function setupEventsRoutes(eventsRepository) {
    const router = express.Router();
    const routes = createEventsRoutes(router, createEvent, eventsRepository, DateTime);
    return routes;
  }

  return {
    start,
    stop
  };
}
