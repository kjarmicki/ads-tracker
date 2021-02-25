'use strict';

/*
 * This module is responsible for MongoDB-related utilities.
 *
 * It's capable of setting up in-memory instance of MongoDB when the circumstances allow for it (no connection string
 * and not a production environment).
 */

const LOCAL_SERVER_INSTANCE_SYMBOL = Symbol('Local MongoDB server instance');

function createMongodbUtils(client, MemoryServer, logger, env) {
  function isProduction() {
    return env === 'production';
  }

  async function connect(uri) {
    return client.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  async function connectTo(localServer) {
    const uri = await localServer.getUri();
    const connectedClient = await connect(uri);
    connectedClient[LOCAL_SERVER_INSTANCE_SYMBOL] = localServer;
    return connectedClient;
  }

  async function setupLocalServer() {
    const localServer = new MemoryServer({
      autoStart: false
    });
    await localServer.start();
    logger.info(`Started local MongoDB server at ${await localServer.getUri()}`);
    return localServer;
  }

  async function getConnectedClient(uri) {
    if (!uri && isProduction()) {
      throw new Error('Production environment requires MongoDB connection URI');
    }
    if (uri) {
      return connect(uri);
    }
    return connectTo(await setupLocalServer());
  }

  return {
    getConnectedClient
  };
}

module.exports = createMongodbUtils;
module.exports.LOCAL_SERVER_INSTANCE_SYMBOL = LOCAL_SERVER_INSTANCE_SYMBOL;
