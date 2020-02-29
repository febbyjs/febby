# Febby

Microservice framework built for Node.js with MongoDB to build application services.

## Install

```
npm install febby
```
# Build Status

|Branch     |Status     |
|-----------|-----------|
| Master    |[![Build Status](https://travis-ci.org/febbyjs/febby.svg?branch=master)](https://travis-ci.org/febbyjs/febby)|

## Docs

* API Documentation: https://febbyjs.github.io/febby

## Examples

The example projects and some of the documentation has fallen behind, so the following is a quick sample of what a project utilizing SakuraApi looks like. Updated documentation and a getting started guide is coming.

```js
const {
  Febby
} = require('febby');

const config = {
  port: 3000,
  db: {
    url: 'mongodb://localhost:27017/test'
  },
  appBaseUrl: '/hello-world'
}
const febby = new Febby(config);

const api = febby.router('/api');

const users = febby.model('users', {
  name: {
    type: String
  },
  firstname: {
    type: String
  }
});


const logActionOnUserCrud = (req, res, next) => {
  console.log(`${req.method}:${req.url}`);
  next()
}
febby.middleware(logActionOnUserCrud, api);


febby.crud('/users', {
  crud: true,
  middlewares: [logActionOnUserCrud]
}, users, api);

febby.route({
  router: api,
  path: '/',
  method: 'get',
  handler: (req, res) => {
    const message = 'welcome to febby.!';
    res.json({
      message
    })
  }
})

febby.bootstrap(() => {
  console.log(`Server started`)
});
```
Creates CRUD routes on `hello-world/api/users/`.

## Dependencies
To build this project you must have:
* Node
* MongoDB

## Testing
* `npm test`: runs the full suite of tests
