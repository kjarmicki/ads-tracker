'use strict';

/*
 * This module is responsible for keeping the context data of an asynchronous operation (most commonly a request).
 *
 * I wanted to include it because it reflects part of my decision-making. AyncLocalStorage comes from the experimental
 * async_hooks API. I tend to avoid experimental APIs for business-critical logic, but for utilities like logging
 * I'm willing to give them a try.
 */

module.exports = function createContext(AsyncLocalStorage, nextCorrelationId) {
  const storage = new AsyncLocalStorage();

  function getStore() {
    return storage.getStore() || {};
  }

  function getCorrelationId() {
    return getStore().correlationId;
  }

  function run(callback) {
    return storage.run({
      correlationId: nextCorrelationId()
    }, callback);
  }

  return {
    getCorrelationId,
    run
  };
}