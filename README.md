# Ads Tracker

Hello :)
This is my solution for the Ads Tracker task.

## How to run it?

You'll need two terminal windows.
In the first one, go to `backend` directory and run `npm i && npm test && npm start`.
In the second one, go to `webapp` directory and run `npm i && npm start`.

If all went well, you should be able to visit [http://localhost:8080](http://localhost:8080) and interact with the frontend.
By default, the backend will run at [http://localhost:4000](http://localhost:4000).

## Endpoints

Use POST `/events` for creating events. Example payload:
```json
{
  "type": "load",
  "adName": "nick-bostrom-superintelligence",
  "adPlacement": "article-lead"
}
```

Use GET `/events/report?day=YYYY-MM-DD` for getting a daily clicks and loads report

## High level architecture diagram

![Hight level architecture diagram](https://raw.githubusercontent.com/kjarmicki/ads-tracker/master/high-level-architecture.png)

## Design choices

### Pick of technologies

I've chosen MongoDB as the database because it seems to fit the use case and also I have experience using it.
I presume various track events will have different information associated with them (for example, click events for
image ads can have client's X and Y points associated with the place of the click) and a document database
seems like a good fit for this case.

I've chosen Express as the web framework because to me it represents a sweet spot between a low-level
native `http` module and invasive, do-it-all solutions like NestJS.

### Code style

I'm not using classes and `this` in objects on purpose. I consider these parts of the language dangerous and
unnecessary and I only interact with them if integration with external modules requires it. I found that object-oriented
design based on composition rather than inheritance can be easily and elegantly expressed without the need for classes.

### Code architecture

#### Dependency injection

For the most part, I'm not using `require` directly in my modules, unless the dependency could be copy-pasted into
my module and it would still make sense. Most of the modules expose creator functions that accept dependencies as arguments.
This style allows me to easily replace dependencies in various contexts (like testing) and gives me a sense of clear
boundaries regarding what should be a part of the module and what should not. I'm aware of the existence of tools like
Rewire or Proxyquire, but I see no real need for them if I just allow my modules to receive dependencies from the outside.

#### Clean architecture

Also known as the onion architecture or the hexagonal architecture. I feel that this architectural style
is enabling me to grow an application without worrying that it will eventually become a big ball of mud. A very simple
summary of this approach in the context of this application could be (order from inside to outside): events model first,
then repository, then routes, then infrastructure (Express and MongoDB). Things from the outside can use things inside,
but not the other way around (so, for example, routes can use repositories, but repositories cannot use routes).

[More on this topic here](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

#### Common modules

Everything in `backend/src/common` directory is application-agnostic and could be externalized as a separate module
to serve multiple other applications.

### Local development

In order to provide a smooth local development experience, this application will run without an external instance
of MongoDB and use in-memory implementation instead. Unless you need persistence that exceeds a lifetime of a
single application run, just `npm start` it and you're good to go.

### Configuration

This application is configured with environment variables. You're encouraged to copy `backend/src/.env.template` into
`.env` and fill in the blanks for your local setup. Don't worry about accidentally committing credentials,
this file is not version controlled.

### Possible enhancements

- Results pagination for the report
- Database indexes
