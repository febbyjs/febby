# Febby

Microservice framework to build application services using Node.js and MongoDB.

## Install

```
npm install febby --save
```
# Build Status

|Branch     |Status     |
|-----------|-----------|
| Master    |[![Build Status](https://travis-ci.org/febbyjs/febby.svg?branch=master)](https://travis-ci.org/febbyjs/febby)|

## Docs

* API Documentation: https://febbyjs.github.io/febby

## Examples

Sample project using febby to create crud on two collections

```js
const {
  Febby
} = require('febby');

const config = {
  port: 3000,
  db: {
    url: 'mongodb://localhost:27017/test'
  },
  appBaseUrl: '/hello'
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

const books = febby.model('books', {
  name: {
    type: String
  },
  author: {
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

febby.crud('/books', {
  crud: false,
  get:[],
  post:[],
  middlewares: [logActionOnUserCrud]
}, books, api);

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
  console.log(`Server started on port : ${config.port}`)
});
```
Creates CRUD routes on `hello/api/[users | books]`.

## Dependencies
To build this project you must have:
* Node
* Npm
* MongoDB

## Testing
* `npm test`: runs the full suite of tests

## Licence 
MIT

## Free software, hell ya.