'use strict';

/*
 * This test presents how I'd approach testing whole application as a component. Application setup and application
 * start are decoupled, so I can just require my main module here and start/stop it as needed. By default it's
 * using an in-memory MongoDB implementation so there's not much work to be done here in terms of the setup.
 */

const assert = require('assert');
const {DateTime} = require('luxon');
const getPort = require('get-port');
const supertest = require('supertest');
const createMainModule = require('../src/main');

describe('Ad tracking service', () => {
  let main, app;

  before(async () => {
    const port = await getPort();
    Object.assign(process.env, {
      PORT: port,
      LOG_LEVEL: 'error'
    });
    main = createMainModule();
    app = await main.start();
  });

  after(async () => {
    await main.stop();
  })

  it('should be able to store events and use them to compose a report', async () => {
    const day = DateTime.utc().toISODate();
    const firstEvent = {
      type: 'click',
      adName: 'some-ad',
      adPlacement: 'some-placement'
    };
    const secondEvent = {
      type: 'load',
      adName: 'another-ad',
      adPlacement: 'another-placement'
    };
    const thirdEvent = {
      type: 'load',
      adName: 'some-ad',
      adPlacement: 'some-placement'
    };

    await supertest(app).post('/events').send(firstEvent).expect(201);
    await supertest(app).post('/events').send(secondEvent).expect(201);
    await supertest(app).post('/events').send(thirdEvent).expect(201);
    await supertest(app).post('/events').send(secondEvent).expect(201);
    await supertest(app).post('/events').send(firstEvent).expect(201);

    const {body: {report}} = await supertest(app).get('/events/report').query({day}).expect(200);

    assert.deepStrictEqual(report, [
      {
        adName: 'another-ad',
        loads: 2,
        clicks: 0
      },
      {
        adName: 'some-ad',
        loads: 1,
        clicks: 2
      }
    ]);
  });
});
