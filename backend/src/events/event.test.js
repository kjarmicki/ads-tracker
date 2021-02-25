'use strict';

/*
 * This test presents how I test time-dependent modules. I treat time providers and timers (Date, setTimeout, etc.)
 * as just another module dependencies and inject them rather than requiring them directly in the module.
 * That way I can replace real implementations with my own mocks easily.
 */

const assert = require('assert');
const {DateTime} = require('luxon');
const createEventsFactory = require('./event');

describe('Event creator', () => {
  it('should decorate an event with the current timestamp', () => {
    const fixedDate = DateTime.fromISO('2020-02-24', {zone: 'utc'});
    const fakeDateTime = {
      utc() {
        return fixedDate;
      }
    };
    const createEvent = createEventsFactory(fakeDateTime);

    const event = createEvent({
      type: 'click',
      adName: 'some-ad',
      adPlacement: 'some-placement'
    });

    assert.deepStrictEqual(event, {
      type: 'click',
      adName: 'some-ad',
      adPlacement: 'some-placement',
      timestamp: fixedDate
    });
  });
});
