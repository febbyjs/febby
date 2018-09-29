'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const mongoose = require('mongoose');
const debug = require('debug')('febby:Febby');

const {
  Router
} = express;

const {
  validateRouter,
  register,
  get,
  put,
  post,
  del
} = require('./router');

const {
  buildConfig,
  onError,
  validateFn,
  buildCrudConfig
} = require('./helper');

/** 
 * Febby
 * @class
 * @example
 * const config = {
 *   port: 3000,
 *   hostname: 'abc.xyz',
 *   db: {
 *          url: 'mongodb://localhost/test'
 *       },
 *   bodyParser: {},
 *   cors: {},
 *   helmet: {},
 *   version: 'v1'
 * };
 * 
 * const Febby = require('febby');
 * const febby = new Febby(config);
 * febby.bootstrap();
 */
class Febby {
  /**
   * 
   * by default body - parser, helmet, cors with empty config are included.
   * to override default configuration of above specified middlewares just specify config objects with valid keys in config object.
   * @param {Object} config - Represents basic app setup.
   * @param {string} config.port - Represents port.
   * @param {string} config.hostname - Represents hostname.
   * @param {string} config.version - Represents app version, default to v1.
   * @param {Object} config.bodyParser - Represents body-parser config options.
   * @param {Object} config.helmet - Represents helmet config options.
   * @param {Object} config.cors - Represents cors config options.
   * @param {Object} config.db - Represents database configuration object.
   * @param {string} config.db.url - Represents database url to connect.
   * @param {Object} config.db.options - Represents  mongoose connect Options object.
   * @Returns {Object} - Returns config object
   * @example
   * {
   *   port: 3000,
   *   hostname: 'abc.xyz',
   *   db: {
   *          url: 'mongodb://localhost/test'
   *       },
   *   bodyParser: {},
   *   cors: {},
   *   helmet: {},
   *   version: 'v1'
   * }
   */
  constructor(config = {}) {
    if (Febby.prototype.exist) {
      return Febby.prototype.exist;
    }
    this.config = buildConfig(config);
    this.app = express();
    this._init();
    Febby.prototype.exist = this;
  }
  /**
   * @private 
   * init purpose
   */
  _init() {
    if (Object.keys(this.config.db || {}).length > 0) {
      const {
        url,
        options
      } = this.config.db;
      if (url) {
        this.connection(url, options || {});
      }
    }
    this.app.use(bodyParser.urlencoded({
      extended: false
    }));
    this.app.use(bodyParser.json(this.config.bodyParser || {}));
    this.app.use(helmet(this.config.helmet || {}));
    this.app.use(cors(this.config.cors || {}));
  }
  /**
   * Register Route
   * @param {Object} routeConfig - the route object used to create route configuration.
   * @example 
   *
   *  const febby = new Febby(config);
   *  // create router
   *  const api = febby.router('/api');
   * 
   *  febby.route({
   *      router: api,
   *      method: 'get',
   *      path: '/',
   *      middlewares: [],
   *      handler: (req, res, next) => {
   *          // do business 
   *      }
   *  });
   * 
   *  febby.bootstrap(()=>{
   *      console.log('app started');
   *  })
   */
  route(routeConfig) {
    const route = routeConfig || {};
    let mlwrs = [];
    const middleware = route.middleware;
    if (middleware && validateFn(middleware)) {
      mlwrs.push(middleware);
    }
    const middlewares = route.middlewares;
    if (route.middlewares && Array.isArray(route.middlewares)) {
      mlwrs = middlewares.map(fn => validateFn(fn));
    }
    register(route.router || this.app, route.method, route.path || '/', mlwrs || [], route.handler);
  }
  /**
   * Register Route list
   * @param {Array} routes - list of route objects
   * @example 
   *
   *  const febby = new Febby(config);
   *  // create router
   *  const api = febby.router('/api');
   *  const routes = [
   *      {
   *          router: api,
   *          method: 'get',
   *          path: '/',
   *          middlewares: [],
   *          handler: (req, res, next) => {
   *              // do business 
   *          }
   *       },
   *      {
   *          router: api,
   *          method: 'get',
   *          path: '/echo',
   *          middlewares: [],
   *          handler: (req, res, next) => {
   *              res.json({echo:req.url});
   *          }
   *       }
   *      ];
   * febby.routes(routes);
   * 
   *  febby.bootstrap(()=>{
   *      console.log('app started');
   *  })
   */
  routes(routes) {
    routes = routes || [];
    if (!Array.isArray(routes)) {
      throw `${routes} is not a valid list of routes`;
    }
    routes.forEach(route => this.route(route));
  }
  /**
   * Register middleware.
   * @param {Function} middleware - Represents middleware function.
   * @param {Object} router - Represents Express Router object by default it is app router object.
   * @example 
   *
   *  const febby = new Febby(config);
   *  // create router
   *  const api = febby.router('/api');
   *  const fn = (req,res,next)=>{
   *      // some logic or validation
   *      next();
   *  }
   *  const fn2 = (req,res,next)=>{
   *      // some validation logic
   *      next();
   *  }
   *  // middleware runs on api router
   *  febby.middleware(fn,api);
   * 
   *  // middleware runs on app router
   *  febby.middleware(fn);
   */
  middleware(middleware, router) {
    router = router || this.app;
    const r = validateRouter(router);
    r.use(validateFn(middleware));
  }
  /**
   * Register Middlewares.
   * @param {Object[]} middlewares - Represents list of middlewares.
   * @param {Object} router - Represents Express Router Object, default to app router.
   * @example 
   *
   *  const febby = new Febby(config);
   *  // create router
   *  const api = febby.router('/api');
   *  const fn = (req,res,next)=>{
   *      // some logic or validation
   *      next();
   *  }
   *  const fn2 = (req,res,next)=>{
   *      // some validation logic
   *      next();
   *  }
   *  // middleware list runs on api router and router is optional
   *  febby.middlewares([fn,fn2],api);
   * 
   */
  middlewares(middlewares, router) {
    middlewares = middlewares || [];
    router = router || this.app;
    if (!Array.isArray(middlewares)) {
      throw `"${middlewares}" is not a list of middleware functions`;
    }
    middlewares.forEach(fn => this.middleware(validateFn(fn), router));
  }
  /**
   * Register a Router.
   * @param {string} url - Represents url.
   * @param {Object} router - Represents Express Router object, default to app router object.
   * @param {Object} options - Represents Express Router config options.
   * @Returns {Object} - Returns Express Router Object.
   * @example 
   *
   *  const febby = new Febby(config);
   *  // create router
   *  const api = febby.router('/api'); // path =  /api
   *  // users subroute mounted on /api
   *  const userApi = febby.router('/users',api); //  path = /api/users
   * 
   *  const fn = (req,res,next)=>{
   *      // some logic or validation
   *      next();
   *  }
   *  const fn2 = (req,res,next)=>{
   *      // some validation logic
   *      next();
   *  }
   *  // this middleware list runs on api router
   *  febby.middlewares([fn, fn2], userApi);
   * 
   *  // this middleware runs on app router
   *  febby.middleware(fn);
   * 
   *  febby.route({
   *      router: userApi,
   *      method: 'get',
   *      path: '/',
   *      middlewares: [],
   *      handler: (req, res, next) => {
   *          // do business 
   *      }
   *  });
   * 
   *  febby.bootstrap(()=>{
   *      console.log('app started');
   *  })
   */
  router(url, router, options) {
    url = url || '/';
    router = router || this.app;
    options = options || {};
    const r = Router(options);
    router.use(url, r);
    return r;
  }
  /**
   * Establish Connection between app and database.
   * @param {string} url - Represents database url.
   * @param {Object} options - Represents mongoose connect optional object.
   * @example 
   * const config = {
   *   port: 3000,
   *   hostname: 'abc.xyz',
   *   bodyParser: {},
   *   cors: {},
   *   helmet: {},
   *   version: 'v1'
   * }
   *  const febby = new Febby(config);
   *  // create router
   *  const api = febby.router('/api');
   *  const fn = (req,res,next)=>{
   *      // some logic or validation
   *      next();
   *  }
   *  const fn2 = async (req,res,next)=>{
   *      const db = febby.model(); // Returns db models object
   *      const users = await db.user.find({});
   *      // some validation logic on users
   *      next();
   *  }
   *  // this middleware runs on api router
   *  febby.middleware(fn,api);
   * 
   *  // this middleware runs on app router
   *  febby.middleware(fn);
   * 
   *  // if db config specified then febby will try to connect to database automatically
   *  // to make database connection externally then use febby.connection
   * 
   *  const options = {
   *      useNewUrlParser: true,
   *      // other mongoose options
   *  }
   *  const url = 'mongodb://localhost:27017/test';
   *  febby.connection(url, options)
   * 
   *  febby.route({
   *      router: api,
   *      method: 'get',
   *      path: '/:id',
   *      middlewares: [],
   *      handler: async (req, res, next) => {
   *          const user = febby.Model('user'); // get registered model by name
   *          const info = await user.findById(req.params.id);
   *          res.status(200).send(info);
   *      }
   *  });
   * 
   * // start the app 
   *  febby.bootstrap(()=>{
   *      console.log('app started');
   *  })
   */
  async connection(url, options) {
    options = options || {};
    options.useNewUrlParser = true;
    try {
      await mongoose.connect(url, options);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Creates CRUD on given route object with specific config.
   * @param {string} path - Represents url path.
   * @param {Object} config - Represents CRUD configuration.
   * @param {Object} model - Represents Model config object.
   * @param {Object} router - Represents Express Router object. it is optional.
   * @example 
   *
   *  const febby = new Febby(config);
   *  // create router
   *  const api = febby.router('/api');
   *  const bookApi = febby.router('/books',api);
   *  const bookCrudConfig = {
   *    crud: true,
   *    middlewares:[]
   *  };
   *  const bookSchema = {
   *    name: { type: String },
   *    author:{ type: Number }
   *  };
   *  const bookModel = febby.model('books',bookSchema);
   *  // creates POST method on book api
   *  // if model already registered then use febby.model('books') to get model object
   * febby.crud('/', bookCrudConfig, bookModel, bookApi);
   * 
   */
  crud(path, config, model, router) {
    if (!config) {
      throw 'CRUD config shoud not be undefined';
    }
    if (config && typeof config !== 'object') {
      throw 'CRUD config should be object with specific properties.like { crud: true, middlewares:[]}';
    }
    if (!model) {
      throw 'model should be defined.use febby.model("modelName",modelSchemaObject) to register a model';
    }
    if (model && typeof model !== 'function') {
      throw 'model should be defined.like febby.model("modelName",modelSchemaObject)';
    }
    if (router && typeof router !== 'function') {
      throw 'Router should be express router object';
    }
    router = router || this.app;
    model = model || {};
    path = path || '/';
    if (path && typeof path !== 'string') {
      throw 'Path should be type of string.usage febby.crud("/user",{...},userModel,apiRouter)';
    }
    const co = buildCrudConfig(config);
    if (co.crud) {
      get(path, co, router, model);
      post(path, co, router, model);
      put(path, co, router, model);
      del(path, co, router, model);
    }
    if (co.get) {
      get(path, co, router, model);
    }
    if (co.put) {
      put(path, co, router, model);
    }
    if (co.del) {
      del(path, co, router, model);
    }
    if (co.post) {
      post(path, co, router, model);
    }
  }
  /**
   * Returns models object.
   * @return {Object} - Returns mongoose models object.
   * @example 
   *
   *  const febby = new Febby(config);
   *  // create router
   *  const api = febby.router('/api');
   *  const fn = (req,res,next)=>{
   *      // some logic or validation
   *      next();
   *  }
   *  const fn2 = async (req,res,next)=>{
   *      const db = febby.model(); // Returns db models object
   *      const users = await db.user.find({});
   *      // some validation logic on users
   *      next();
   *  }
   *  // this middleware runs on api router
   *  febby.middleware(fn,api);
   * 
   *  // this middleware runs on app router
   *  febby.middleware(fn);
   * 
   *  febby.route({
   *      router: api,
   *      method: 'get',
   *      path: '/',
   *      middlewares: [],
   *      handler: (req, res, next) => {
   *          // do business 
   *      }
   *  });
   * 
   *  febby.bootstrap(()=>{
   *      console.log('app started');
   *  })
   */
  models() {
    return mongoose.models;
  }
  /**
   * Rigister and Returns model object.
   * @param {string} name - Represents name of model.
   * @param {Object} schema - Represents mongoose schema object. 
   * @Returns {Object|undefined} - Returns model object if exist, if not undefined.
   * @example 
   *
   *  const febby = new Febby(config);
   *  // create router
   *  const api = febby.router('/api');
   *  const fn = (req,res,next)=>{
   *      // some logic or validation
   *      next();
   *  }
   *  const fn2 = async (req,res,next)=>{
   *      const db = febby.model(); // Returns db models object
   *      const users = await db.user.find({});
   *      // some validation logic on users
   *      next();
   *  }
   *  // this middleware runs on api router
   *  febby.middleware(fn,api);
   * 
   *  // this middleware runs on app router
   *  febby.middleware(fn);
   * 
   *  febby.route({
   *      router: api,
   *      method: 'get',
   *      path: '/:id',
   *      middlewares: [],
   *      handler: async (req, res, next) => {
   *          const user = febby.Model('user'); // get registered model by name
   *          const info = await user.findById(req.params.id);
   *          res.status(200).send(info);
   *      }
   *  });
   * 
   *  febby.bootstrap(()=>{
   *      console.log('app started');
   *  })
   */
  model(name, schema) {
    if (!name) {
      throw `model name should to be ${typeof name}.example usage febby.model('users') or febby.model('users',{...}).`;
    }
    if (name && typeof name !== 'string') {
      throw 'model name should to be type string.example usage febby.model("users") or febby.model("users",{...}).';
    }
    if (schema && typeof schema !== 'object') {
      throw 'To register a model use schema.to get model just use febby.model("users") , to register use febby.model("users",UserSchemaObject).';
    }
    if (schema) {
      try {
        mongoose.model(name, schema);
      } catch (err) {
        if (mongoose.models[name]) {
          return mongoose.models[name];
        } else {
          throw err;
        }
      }
    }
    return mongoose.models[name];
  }
  /**
   * bootstrap the application.
   * @param {Function} fn - Represents callback function which will called after app start up. 
   * @description if database "db" object specified in config then febby will try to connect database on bootstarp.
   * @example 
   *
   *  const febby = new Febby(config);
   *  // create router
   *  const api = febby.router('/api');
   *  const fn = (req,res,next)=>{
   *      // some logic or validation
   *      next();
   *  }
   *  const fn2 = async (req,res,next)=>{
   *      const db = febby.model(); // Returns db models object
   *      const users = await db.user.find({});
   *      // some validation logic on users
   *      next();
   *  }
   *  // this middleware runs on api router
   *  febby.middleware(fn,api);
   * 
   *  // this middleware runs on app router
   *  febby.middleware(fn);
   * 
   *  febby.route({
   *      router: api,
   *      method: 'get',
   *      path: '/:id',
   *      middlewares: [],
   *      handler: async (req, res, next) => {
   *          const user = febby.Model('user'); // get registered model by name
   *          const info = await user.findById(req.params.id);
   *          res.status(200).send(info);
   *      }
   *  });
   * 
   * // start the app 
   *  febby.bootstrap(()=>{
   *      console.log('app started');
   *  })
   */
  bootstrap(fn) {
    const server = http.createServer(this.app);
    this.server = server;
    this.app.set('port', this.config.port);
    if (fn) {
      fn = validateFn(fn);
    }
    server.listen(this.config.port, function () {
      debug(`Server started on PORT ${server.address()}`);
      if (fn) {
        fn();
      }
    });
    server.on('listening', () => {
      const addr = server.address();
      const bind = typeof addr === 'string' ?
        'pipe ' + addr :
        'port ' + addr.port;
      debug('Listening on ' + bind);
    });
  }
  /**
   * Get Express App object
   * @Returns {Object} - Returns Express app object
   * @example
   * febby.shutdown();
   */
  expressApp() {
    return this.app;
  }
  /**
   * Shutdown app
   * @example 
   * febby.shutdown();
   */
  shutdown() {
    this.server.close();
  }
  /**
   * Close database connections
   * @example 
   * febby.closeConnection();
   */
  closeConnection() {
    mongoose.connection.close();
  }
}

module.exports = Febby;
