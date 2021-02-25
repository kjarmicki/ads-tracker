'use strict';

/*
 * If I'm testing a module with a "heavy" dependency (large API surface area) I usually spin up the
 * minimal version of the dependency rather than try to mock everything myself. Ideally this is possible
 * to do in memory, but sometimes using scripted Docker for this sort of thing seems appropriate too.
 * 
 * Here I already have mongodb-memory-server installed for the purpose of local development, so I'll use that.
 */

const assert = require('assert');
const {DateTime} = require('luxon');
const {MongoClient} = require('mongodb');
const {MongoMemoryServer} = require('mongodb-memory-server');
const createEventsMongodbRepository = require('./mongodb-repository');

describe('Events MongoDB respository', () => {
  let server, client, eventsCollection, repository;

  before(async () => {
    server = new MongoMemoryServer({
      autoStart: false
    });
    await server.start();
    client = await MongoClient.connect(await server.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  beforeEach(async () => {
    eventsCollection = client.db('events').collection('events-' + Math.random());
    repository = createEventsMongodbRepository(eventsCollection);
  });

  after(async () => {
    await client.close();
    await server.stop();
  });

  it('should save an event', async () => {
    const event = {
      type: 'click',
      adName: 'some-ad',
      adPlacement: 'some-placement',
      timestamp: DateTime.fromISO('2020-02-24', {zone: 'utc'})
    };

    await repository.saveEvent(event);

    const databaseContents = await eventsCollection.find({}).toArray();
    assert.strictEqual(databaseContents.length, 1);
    delete databaseContents[0]._id;
    assert.deepStrictEqual(databaseContents[0], {
      type: 'click',
      adName: 'some-ad',
      adPlacement: 'some-placement',
      timestamp: new Date('2020-02-24T00:00:00.000Z')
    });
  });

  it('should throw an error when event saving fails', async () => {
    const event = {
      type: 'click',
      adName: 'some-ad',
      adPlacement: 'some-placement',
      timestamp: DateTime.fromISO('2020-02-24', {zone: 'utc'})
    };
    const failsafe = 'The operation have succeeded when it should have failed';

    eventsCollection.insertOne = async () => {
      throw new Error('Kaboom!');
    }

    try {
      await repository.saveEvent(event);
      throw new Error(failsafe);
    } catch (error) {
      if (error.message === failsafe) {
        throw error;
      }
      assert.strictEqual(error.clientMessage, 'Error while saving an event');
      assert.strictEqual(error.message, 'Kaboom!');
    }
  });

  it('should generate empty loads and clicks report for a day when there are no events', async () => {
    const day = DateTime.fromISO('2020-02-24', {zone: 'utc'});
    const report = await repository.getReport({day});
    assert.deepStrictEqual(report, []);
  });

  it('should generate loads and clicks report for a day when there are events', async () => {
    const day = DateTime.fromISO('2020-02-24', {zone: 'utc'});
    const eventADayBefore = {
      type: 'click',
      adName: 'some-ad',
      adPlacement: 'some-placement',
      timestamp: day.minus({days: 1}).toJSDate()
    };
    const firstEvent = {
      type: 'click',
      adName: 'some-ad',
      adPlacement: 'some-placement',
      timestamp: day.toJSDate()
    };
    const secondEvent = {
      type: 'load',
      adName: 'another-ad',
      adPlacement: 'another-placement',
      timestamp: day.toJSDate()
    };
    const thirdEvent = {
      type: 'load',
      adName: 'some-ad',
      adPlacement: 'some-placement',
      timestamp: day.toJSDate()
    };
    const eventADayAfter = {
      type: 'click',
      adName: 'some-ad',
      adPlacement: 'some-placement',
      timestamp: day.plus({days: 1}).toJSDate()
    };

    await eventsCollection.insertMany([eventADayBefore, firstEvent, secondEvent, thirdEvent, eventADayAfter]);

    const report = await repository.getReport({day});
    assert.deepStrictEqual(report, [
      {
        adName: 'another-ad',
        loads: 1,
        clicks: 0
      },
      {
        adName: 'some-ad',
        loads: 1,
        clicks: 1
      }
    ])
  });
});
