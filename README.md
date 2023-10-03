# Febby - A Typescript based backend Framework

Febby is a versatile a typescript based backend HTTP framework designed to streamline the development of production-ready RESTful APIs. It offers a rich set of features that make building API endpoints and managing data effortless. Whether you're working with MongoDB collections, integrating Redis caching, or utilizing the power of the OpenAPI Specification, Febby provides the tools you need to build robust and efficient APIs.

## Appendix

- [Installation](#installation)
- [Features](#features)
  - [1. MongoDB Integration](#1-mongodb-integration)
  - [2. Redis Caching](#2-redis-caching)
  - [3. Built on Express.js](#3-built-on-expressjs)
  - [4. OpenAPI Specification Support](#4-openapi-specification-support)
  - [5. Middleware Support](#5-middleware-support)
  - [6. Model Registration](#6-model-registration)
  - [7. Route Registration](#7-route-registration)
  - [8. Easy Bootstrap](#8-easy-bootstrap)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Documentation](#documentation)
- [Example](#example)
- [License](#license)



## Installation

Install febby with npm

```bash
  npm install febby -S
```
    
## Documentation

[Febby API Documentation](https://febbyjs.github.io/febby)


## Example
[Simple Febby App](https://github.com/febbyjs/febby/blob/master/example/app.js)


## Features

### 1. MongoDB Integration

Febby simplifies the process of creating REST endpoints on MongoDB collections. With minimal developer effort, you can effortlessly expose CRUD operations on your data, reducing boilerplate code.


```typescript
const { Febby } = require("febby");

const config = {
  port: 3000,
  db: {
    url: "mongodb://localhost:27017/test",
  },
  appBaseUrl: "/hello", // app base url will not be taken into consideration when app created using open-api spec
  redis: {
    port: 6379,
    host: "0.0.0.0",
  },
  loadDefaultMiddlewareOnAppCreation: true, // you can delay loading default middleware by setting up false and use built in method 'loadDefaultMiddlewares' to load on demand.
  serviceName: "febbyapp", // used to create redis keys
};
const febby = new Febby(config);
```

### 2. Redis Caching

To enhance performance and reduce latency, Febby seamlessly integrates Redis caching into your API. Cache frequently requested data and minimize database calls, resulting in faster response times.


```typescript
const { Febby } = require("febby");

const config = {
  port: 3000,
  appBaseUrl: "/hello", // app base url will not be taken into consideration when app created using open-api spec
  redis: {
    port: 6379,
    host: "0.0.0.0",
  },
  loadDefaultMiddlewareOnAppCreation: true, // you can delay loading default middleware by setting up false and use built in method 'loadDefaultMiddlewares' to load on demand.
  serviceName: "febbyapp", // used to create redis keys
};
const febby = new Febby(config);
```
### 3. Built on Express.js

Febby is built on top of the widely adopted [Express.js](https://expressjs.com/) framework, which means you can leverage the flexibility and community support that Express provides while benefiting from Febby's added features.

### 4. OpenAPI Specification Support

Febby simplifies API development with its support for the OpenAPI Specification (formerly known as Swagger). Load your OpenAPI YAML file, and Febby will automatically generate API routes, allowing you to focus on defining your API's behavior.


```typescript
const { Febby } = require("febby");

const config = {
  port: 3000
};
const febby = new Febby(config);

const middlewareList =  [
    {
        name: "middleware1",
        func: (req, res, next) => next(),
    },
    {
        name: "middleware2",
        func: (req, res, next) => next(),
    },
];

const controllerList = [
    {
        name: "updatePetController",
        func: (req, res) => res.json({ message: "hello world!" }),
    },
]

await febby
  .loadOpenAPIConfigYAML(path.join(__dirname, "open-api.yaml"), {
    middlewares: middlewareList,
    controllers: controllerList,
    openApiValidatorOptions: {
      validateApiSpec: true,
      validateRequests: false,
      validateResponses: true,
    },
  })

```

### 5. Middleware Support

Customize your API's behavior with ease by defining middleware functions. Febby lets you register middleware globally or for specific routes, providing fine-grained control over request processing.


```typescript
const api = await febby.router("/api"); // api router

function logActionOnUserCrud(req, res, next) {
  console.log(`${req.method}:${req.url}`);
  next();
}
// register middleware on main router
await febby.middleware(logActionOnUserCrud);

// register middleware on given router
await febby.middleware(logActionOnUserCrud, api);
```

### 6. Model Registration

Register your database models with Febby effortlessly. Define your models with schema information, and Febby takes care of the rest, making it easy to work with your data.

```typescript
const users = await febby.model("users", {
  display_name: {
    type: String,
  },
  first_name: {
    type: String,
  },
});
```

### 7. Route Registration

Create HTTP routes effortlessly with Febby. Define the routes and handlers, and let Febby handle the routing logic, making your code cleaner and more organized.

```typescript
const febby = new Febby(config);
const api = await febby.router("/api"); // api router

await febby.route({
  router: api,
  path: "/",
  method: "get",
  handler: (req, res) => {
    const message = "Welcome to Febby!";
    res.json({
      message,
    });
  },
});

```

### 8. Easy Bootstrap

Febby simplifies the process of starting your server. Use the `start` instead of `bootstrap`(deprecated) function to initiate your Febby app and specify a callback function to run when the server starts.

```typescript
await febby.start()
```

## Usage/Examples

```javascript
const path = require("path");
const { Febby } = require("febby");

const config = {
  port: 3000,
  db: {
    url: "mongodb://0.0.0.0:27017/test",
  },
  appBaseUrl: "/hello", // if routes are created by open-api spec then this base url will not be used
  loadDefaultMiddlewareOnAppCreation: false, // you can set false and load default middleware on demand using 'loadDefaultMiddleware'
  redis: {
    port: 6379,
    host: "0.0.0.0",
  },
};

// febby instance creation
const febby = new Febby(config);

const api = await febby.router("/api");

await febby.loadDefaultMiddleware();

const users = await febby.model("users", {
  name: {
    type: String,
  },
  firstname: {
    type: String,
  },
});

const books = await febby.model("books", {
  name: {
    type: String,
  },
  author: {
    type: String,
  },
});

const logActionOnUserCrud = (req, res, next) => {
  console.log(`${req.method}:${req.url}`);
  next();
};

await febby.middleware(logActionOnUserCrud, api);

await febby
  .loadOpenAPIConfigYAML(path.join(__dirname, "open-api.yaml"), {
    middlewares: [
      {
        name: "middleware1",
        func: (req, res, next) => next(),
      },
      {
        name: "middleware2",
        func: (req, res, next) => next(),
      },
    ],
    controllers: [
      {
        name: "updatePetController",
        func: (req, res) => res.json({ message: "hello world!" }),
      },
    ],
    openApiValidatorOptions: {
      validateApiSpec: true,
      validateRequests: false,
      validateResponses: true,
    },
  })

await febby.crud(
  "/users",
  {
    crud: true,
    middlewares: [logActionOnUserCrud],
  },
  users,
  api
);

await febby.crud(
  "/books",
  {
    crud: false,
    get: [],
    post: [],
    put: [],
    middlewares: [logActionOnUserCrud],
  },
  books,
  api
);

await febby.route({
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

await febby.start();

```


## Authors

- [@VasuVanka](https://www.github.com/vasuvanka)

## LICENSE
[License](LICENSE.md)

# Contributor Covenant Code of Conduct

## Our Pledge

In the interest of fostering an open and welcoming environment, we as contributors and maintainers pledge to making participation in our project and our community a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

## Our Standards

Examples of behavior that contributes to creating a positive environment include:

* Using welcoming and inclusive language
* Being respectful of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members

Examples of unacceptable behavior by participants include:

* The use of sexualized language or imagery and unwelcome sexual attention or advances
* Trolling, insulting/derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information, such as a physical or electronic address, without explicit permission
* Other conduct which could reasonably be considered inappropriate in a professional setting

## Our Responsibilities

Project maintainers are responsible for clarifying the standards of acceptable behavior and are expected to take appropriate and fair corrective action in response to any instances of unacceptable behavior.

Project maintainers have the right and responsibility to remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned to this Code of Conduct, or to ban temporarily or permanently any contributor for other behaviors that they deem inappropriate, threatening, offensive, or harmful.

## Scope

This Code of Conduct applies both within project spaces and in public spaces when an individual is representing the project or its community. Examples of representing a project or community include using an official project e-mail address, posting via an official social media account, or acting as an appointed representative at an online or offline event. Representation of a project may be further defined and clarified by project maintainers.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at febbyjs@gmail.com / vanka.vasu@gmail.com . The project team will review and investigate all complaints, and will respond in a way that it deems appropriate to the circumstances. The project team is obligated to maintain confidentiality with regard to the reporter of an incident. Further details of specific enforcement policies may be posted separately.

Project maintainers who do not follow or enforce the Code of Conduct in good faith may face temporary or permanent repercussions as determined by other members of the project's leadership.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage], version 1.4, available at [http://contributor-covenant.org/version/1/4][version]

[homepage]: http://contributor-covenant.org
[version]: http://contributor-covenant.org/version/1/4/
## Feedback

If you have any feedback, please reach out to us at febbyjs@gmail.com or vanka.vasu@gmail.com

