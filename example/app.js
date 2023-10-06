const path = require("path");
// const { Febby } = require("febby");
const { Febby } = require("../dist");

const config = {
  port: 3000,
  db: {
    url: "mongodb://0.0.0.0:27017/test",
  },
  appBaseUrl: "/hello", // if routes are created by open-api spec then this base url will not be used
  loadDefaultMiddlewareOnAppCreation: false, // you can set false and load default middleware on demand using 'loadDefaultMiddleware'
  redis: {
    // optional config
    port: 6379,
    host: "0.0.0.0",
  },
};
// febby instance creation
const febby = new Febby(config);

(async () => {
  const api = await febby.router("/api");

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

  await febby.loadDefaultMiddlewares();

  const controllers = [
    {
      name: "updatePetController",
      func: (req, res) => res.json({ message: "hello world!" }),
    },
  ];

  const middlewares = [
    {
      name: "middleware1",
      func: (req, res, next) => next(),
    },
    {
      name: "middleware2",
      func: (req, res, next) => next(),
    },
  ];

  // option 1

  await febby.loadOpenAPIConfigYAML(path.join(__dirname, "open-api.yaml"), {
    middlewares: path.join(__dirname, "middlewares"),
    controllers: path.join(__dirname, "controllers"),
    openApiValidatorOptions: {
      validateApiSpec: true,
      validateRequests: false,
      validateResponses: true,
    },
  });

  // option 2

  await febby.loadOpenAPIConfigYAML(path.join(__dirname, "open-api.yaml"), {
    middlewares,
    controllers,
    openApiValidatorOptions: {
      validateApiSpec: true,
      validateRequests: false,
      validateResponses: true,
    },
  });

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
      crud: true,
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
  console.log("server started");
})();
