const { Febby } = require("../dist");

const config = {
  port: 3000,
  db: {
    url: "mongodb://0.0.0.0:27017/test",
  },
  appBaseUrl: "/hello",
  redis: {
    // optional config
    port: 6379,
    host: "0.0.0.0",
  },
};
const febby = new Febby(config);

const api = febby.router("/api");

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

febby.bootstrap(() => {
  console.log(`Server started on port : ${config.port}`);
});
