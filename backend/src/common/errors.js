'use strict';

/* 
 * This module contains common errors that are not tied to the business domain. Domain errors should be
 * defined alongside appropriate domain models.
 */

class ValidationError extends Error {
  constructor(message) {
    super(message);
  }
}

class PersistenceError extends Error {
  constructor(privateMessage, clientMessage) {
    super(privateMessage);
    this.clientMessage = clientMessage;
  }
}

module.exports = {
  ValidationError,
  PersistenceError
};
