'use strict';

/*
 * This module defines event domain model.
 *
 * At the moment it serves mostly as a validation layer, but when more sophisticated logic
 * will be developed, event-specific methods should be defined here.
 * I'm exposing it as a factory because I want to be able to replace non-deterministic DateTime
 * in some contexts (like testing).
 */

const {ValidationError} = require('../common/errors');
const VALID_EVENT_TYPES = ['load', 'click'];

function validatePayload(payload) {
  if (!VALID_EVENT_TYPES.includes(payload.type)) {
    throw new ValidationError(`Event type has to be one of: ${VALID_EVENT_TYPES.join(', ')}`);
  }
  if (!payload.adName) {
    throw new ValidationError(`Event has to have adName property`);
  }
  if (!payload.adPlacement) {
    throw new ValidationError(`Event has to have adPlacement property`);
  }
}

module.exports = function createEventsFactory(DateTime) {
  return function createEvent(payload = {}) {
    validatePayload(payload);

    return {
      type: payload.type,
      adName: payload.adName,
      adPlacement: payload.adPlacement,
      timestamp: DateTime.utc()
    };
  };
};
