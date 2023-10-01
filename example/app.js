const path = require("path");
const { Febby } = require("../dist");

const config = {
  port: 3000,
  db: {
    url: "mongodb://0.0.0.0:27017/test",
  },
  appBaseUrl: "/hello", // if routes are created by open-api spec then this base url will not be used
  loadDefaultMiddlewareOnAppCreation: false, // you can set false and load default middleware on demand using 'loadDefaultMiddleware'
  // redis: {
  //   // optional config
  //   port: 6379,
  //   host: "0.0.0.0",
  // },
};

// febby instance creation
const febby = new Febby(config);

const api = febby.router("/api");

febby.loadDefaultMiddleware();

const users = febby.model("users", {
  name: {
    type: String,
  },
  firstname: {
    type: String,
  },
});

const books = febby.model("books", {
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

febby.middleware(logActionOnUserCrud, api);

await febby.loadOpenAPIConfigYAML(path.join(__dirname, "open-api.yaml"), {
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
});

febby.crud(
  "/users",
  {
    crud: true,
    middlewares: [logActionOnUserCrud],
  },
  users,
  api
);

febby.crud(
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

await febby.start();
