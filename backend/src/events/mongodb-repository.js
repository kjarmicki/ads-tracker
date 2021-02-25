'use strict';

/*
 * This module serves as a data persistence for events, implemented with MongoDB as a backing store.
 *
 * There's a bit of back-and-forth with date conversions, because we're using Luxon to represent our dates
 * within the domain model, but MongoDB uses ISODate natively (which is automatically mapped to and from JS Date).
 * I want the database to operate on its native types but I don't want these types to leak into the rest of the 
 * application, so this module is solely responsible for its date conversions.
 */

const {ValidationError, PersistenceError} = require('../common/errors');

module.exports = function createEventsMongodbRepository(eventsCollection) {
  function handleError(databaseError, clientMessage) {
      const error = new PersistenceError(databaseError.message, clientMessage);
      error.stack = databaseError.stack;
      throw error;
  }

  function validateReportCriteria(criteria) {
    if (!criteria) {
      throw new ValidationError('Report criteria are required');
    }
    if (!criteria.day) {
      throw new ValidationError('Report criteria must contain a day');
    }
  }

  function buildReportQuery(criteria) {
    const {day} = criteria;
    const nextDay = day.plus({days: 1});
    return {
      timestamp: {
        $gte: day.toJSDate(),
        $lt: nextDay.toJSDate()
      }
    };
  }

  function serializeEvent(event) {
    return {
      ...event,
      timestamp: event.timestamp.toJSDate()
    }
  }

  function aggregateSumByField(name, value) {
    return {
      $sum: {
        $cond: {
          if: { $eq: ['$' + name, value] },
          then: 1,
          else: 0
        }
      }
    };
  }

  async function saveEvent(event) {
    try {
      await eventsCollection.insertOne(serializeEvent(event));
    } catch (error) {
      handleError(error, 'Error while saving an event');
    }
  }
  async function getReport(criteria) {
    validateReportCriteria(criteria);

    try {
      return await eventsCollection.aggregate([
        {
          $match: buildReportQuery(criteria)
        },
        {
          $group: {
            _id: '$adName',
            loads: aggregateSumByField('type', 'load'),
            clicks: aggregateSumByField('type', 'click')
          },
        },
        {
          $project: {
            _id: 0,
            adName: '$_id',
            loads: 1,
            clicks: 1
          }
        },
        {
          $sort: {
            'adName': 1
          }
        }
      ]).toArray();
    } catch (error) {
      handleError(error, 'Error while getting events report');
    }
  }

  return {
    saveEvent,
    getReport
  };
};
