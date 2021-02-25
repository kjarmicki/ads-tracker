'use strict';

/*
 * This module sets up Express routes for events.
 *
 * It's given a router and is responsible for setting its own routes within it. Decision where to mount this
 * router left to the rest of the application.
 * It's using events repository directly, but if there were more repositories or sufficiently complex logic
 * I'd consider using an indirection layer in the form of service that would be able to hide the details of the operations.
 */

const {asyncHandler} = require('../common/express');
const {ValidationError} = require('../common/errors');

module.exports = function createEventsRoutes(router, createEvent, eventsRepository, DateTime) {
  function validateAndParseDay(dayPayload) {
    if (!dayPayload) {
      throw new ValidationError('day query parameter is required');
    }
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dayPayload)) {
      throw new ValidationError('day is expected to be in YYYY-MM-DD format');
    }
    const day = DateTime.fromISO(dayPayload, {zone: 'utc'});
    if (!day.isValid) {
      throw new ValidationError('day is not valid');
    }
    return day;
  }

  async function postEvent(req, res) {
    const eventPayload = {...req.body};
    const event = createEvent(eventPayload);
    await eventsRepository.saveEvent(event);
    return res.status(201).json(event);
  }

  async function getReport(req, res) {
    const day = validateAndParseDay(req.query.day);
    const report = await eventsRepository.getReport({day});
    return res.status(200)
      // I'm wrapping the report into an object instead of returning it directly as a list
      // because I anticipate future evolution of the endpoint (extra fields, format changes etc.)
      .json({report});
  }

  router.post('/', asyncHandler(postEvent));
  router.get('/report', asyncHandler(getReport));

  return router;
};
