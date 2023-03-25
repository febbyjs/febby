# Febby

Node.js HTTP framework built to create production ready rest endpoints on [mongodb](https://www.mongodb.com) collections with minimal developer effort.
[Redis](https://redis.io) cache introduced to reduce latency and database calls to improve performace by far.
Whole Febby is build on top of proven [express.js](https://expressjs.com/) framework.

## Install

```
npm install febby --save
```

## Docs

febby provides some of the coolest features out of the box, like projection, querying and pagination on mongodb collections.

- API Documentation: https://febbyjs.github.io/febby
- Usage [projection, querying and pagination](https://github.com/febbyjs/febby/tree/master/Helper.md)

## Example

[Febby example app](https://github.com/febbyjs/febby/tree/master/example)

## Febby App Configuration

Provide base configuration to create febby instance.

```js
const { Febby } = require("febby");

const config = {
  port: 3000,
  db: {
    url: "mongodb://localhost:27017/test",
  },
  appBaseUrl: "/hello",
  redis: {
    port: 6379,
    host: "0.0.0.0",
  },
  serviceName: "febbyapp", // used to create redis keys
};
const febby = new Febby(config);
```

## Create a router

```js
const febby = new Febby(config);
const api = febby.router("/api"); // api router
```

## Register a model on febby

Register database model on febby.

```js
const febby = new Febby(config);
const users = febby.model("users", {
  // user model
  display_name: {
    type: String,
  },
  first_name: {
    type: String,
  },
});
```

## Register a middleware on febby

```js
const api = febby.router("/api"); // api router

function logActionOnUserCrud(req, res, next) {
  console.log(`${req.method}:${req.url}`);
  next();
}
// register middleware on main router
febby.middleware(logActionOnUserCrud);

// register middleware on given router
febby.middleware(logActionOnUserCrud, api);
```

## Register CRUD ops on given model

generate create,read,update,delete rest http api endpoints on user model.

```js
const users = febby.model("users", {
  display_name: {
    type: String,
  },
  first_name: {
    type: String,
  },
});

febby.crud(
  "/users",
  {
    crud: true,
  },
  users,
  api
);
```

define only get http endpoint on given users

```js
febby.crud(
  "/users",
  {
    crud: false,
    get: [], // [middleware function]
  },
  users,
  api
);
```

## Register a route on febby

Register an http route.

```js
febby.route({
  router: api,
  path: "/",
  method: "get",
  handler: (req, res) => {
    const message = "welcome to febby.!";
    res.json({
      message,
    });
  },
});
```

## Bootstrap febby app

Bootstrap will be the last step of the app.

```js
febby.bootstrap(() => {
  console.log(`Server started on port : ${config.port}`);
});
```

# Build Status

| Branch | Status                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| Master | [![Build Status](https://travis-ci.org/febbyjs/febby.svg?branch=master)](https://travis-ci.org/febbyjs/febby) |

## Dependencies

- Node.js v4+
- MongoDB v3+
- Npm v6+
- Redis (Optional)

## Licence

MIT

## Free software, hell ya.
