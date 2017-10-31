/*!
 * febby
 * Copyright(c) 2017 Vasu Vanka
 * MIT Licensed
 */
/**
 * @private
 * Load Dependency modules
 */
const express = require('express');
let http = require('http');
let Vanku = require('./vanku');
/**
 * Febby - A Configuration based NodeJs Framework on top of ExpressJs.
 * Create Production Ready REST API's in minutes.
 * 
 * Configuration based REST with custom Route support and Method specific Middleware configuration
 * 
 * @example
 * npm install febby --save
 * @example
 * const Febby = require('febby');
 * @example
 * const febby = new Febby();
 * @returns {Object} Returns Febby Object
 */
class Febby {
    /**
     * Creates Febby Object
     */
    constructor() {
        this.app = express();
    }
    /**
     * creates An Express App 
     * @example
     * // make sure you configured models and config object before calling this method
     * 
     * const Febby = require('febby');
     * 
     * const config= require('./config');
     * const models = require('./models');
     * const routes = require('./routes');
     *
     *  const febby = new Febby();
     * 
     * febby.setConfig(config);
     * febby.setModels(models);
     * febby.setRoutes(routes);
     * 
     * febby.createApp();
     */
    createApp() {
        this.vanku = new Vanku(this);
        this.vanku.getConnection().then((db) => {
            this.db = db;
            this.vanku.bindModels();
            this.createHttpServer();
        }).catch((err) => {
            throw err;
        });
    }


    /**
     * set Config Object before calling febby.createApp()
     * @param {Object} config 
     * @example
     * let config = {
     *  // Port number on which your app going to listen, default PORT number is 5678
     *  // You can set PORT via Commandline while starting app `PORT=8000 node app.js `
     *  // it will take process.env.PORT by default if not found then it will take Port from config object
     *  'port': 3000,
     *  // hostname of app 
     *  'host': '127.0.0.1',
     *  // application environment
     *  'env': 'development',
     *  // Base path for models
     *  'restBasePath': '/api/v1/model',
     *  // Route Path for user defined Routes
     *  'routeBasePath': '/api/v1/route',
     *  // MongoDB configuration
     *  'db': {
     *      // Default maximum number of records while querying , if limit doesn't pass.
     *    'limit': 30,
     *      // mongodb url
     *    'url': 'mongodb://localhost:27017/test'
     *  },
     *  // body-parser maximum body object size 
     *  'jsonParserSize': '100kb',
     * // Enabling custom 404 and 500 error Handling, by deafult value is false
     *  userDefinedErrorHandling: false
     *};
     *module.exports = config;
     * //config/index.js
     * |- config
     *          / index.js
     * 
     * @example
     * let config = require('./config');
     *  //set configuration before calling createApp method.
     * febby.setConfig(config);
     */
    setConfig(config) {
        this.config = config;
    }

    /**
     * Set Model Object
     * @param {Object} models 
     * @example
     * 
     *let hasPermission = require('./middlewares/hasPermission');
     * let ValidateUser = (req, res, models, cb) => {
     *      if(!req.query.user_id){
     *          return cb(new Error('missing user_id in query'))
     *       }
     *      return cb()
     *     }
     * // middlewares are configured in middlewares folder
     * // Remember app specific middleware functions are different and method specific middleware functions are different
     * // App specific middlewares can't be used in method specific and vice versa.
     * // method specific middleware has four arguments Request , Response, Models, Cb there is no next function, these will run route and method specific
     * // don't forget to pass empty callback once your validation run in middleware.
     * // if you didn't pass it will be in block state so careful and pass the Cb 
     * // App specific midlleware has three arguments Request , Response , Next there is no models , these will run for every request
     * |- middlewares/
     *              / hasPermission.js
     *              
     *let user = {
     *     methods: {
     *         all: true,
     *          //if all set to true CRUD Operations enabled on this Model.
     *          // if all set false then it will enable user to define which methods need to be enabled
     *         middlewares: [ ValidateUser ],
     *          // Array of functions whcih will execute before your CRUD methods , make sure midllewares config properly.
     *          //below is method name and method configuration
     *         get: {
     *             isEnabled: true,
     *              // GET method will be enabled if you made isEnabled =  true, if false then GET method is disabled on this model
     *             middlewares: []
     *              // Here Array of Functions specific to GET method , these methods will exexute before Making Database call
     *         },
     *         post: {
     *             isEnabled: true,
     *             //empty array or make sure remove the midddleware key 
     *             // if you don't want to apply
     *             middlewares: [ hasPermission ]
     *         },
     *         put: {
     *             isEnabled: true,
     *         },
     *         delete: {
     *             //if you wish to block delete method you can make isEnabled = false or just remove delete key and object
     *             isEnabled: false
     *         }
     *     },
     *      // it is mongoose schema,
     *      // we are using mongoose internally so we just use mongoose schema to validate input data
     *      // by default created_at , updated_at keys of type Date is enabled to each and every model
     *      // date and time of document creation and updations are automatically updated  
     *     schema: {
     *         username: {
     *             type: String,
     *             required: true,
     *             unique: true
     *         },
     *         firstname: {
     *             type: String
     *         },
     *         lastname: {
     *             type: String
     *         },
     *         email: {
     *             type: String,
     *             unique: true
     *         }
     *     }
     *};
     * module.exports = user;
     * // Export User Object
     * |- models/user.js
     * 
     *@example

     *const user = require('./user');
     *   module.exports = {
     *      'user': user
     * };
     * // Export all models configuration as single Object
     * |- models/index.js
     * @example
     * let models = require('./models');
     * 
     * febby.setModels(models);
     * // set models before calling febby.createApp()
     */
    setModels(models) {
        this.models = models;
    }
    /**
     * Set Routes Object
     * @param {Object} routes 
     * @example
     * 
     * For Every Route Handler will have following arguments
     *  {Request} request - Express Request Object
     *  {Response} response - Express Response Object
     *  {NextFunction} next - Express next function
     *  {Models} models - configured models     
     *  Below is just a sample example. 
     * 
     * |- routes/
     *          /handlers/
     *                  /login.js        
     * let loginHandler = (request, response, next, models) => { 
     *      let username = request.body.username
     *      let password = request.body.password
     *      // will handle user login logic here
     *      models.user.findOne({'username':username},{}).
     *          then((doc)=>{
     *          // validate the user and respond
     *          }).catch((error)=>{
     *              next(error);
     *          })
     *      };
     * 
     * module.exports = loginHandler;
     * // Export loginHandler Function
     * |- routes/handlers/user.js
     * 
     *@example
     *  const loginHandler = require('./handlers/login');
     *  let ValidateUser = require('./middlewares/validateUser');
     *  let routes =  {
     *      '/login': {
     *          'method': 'POST',
     *          'middlewares': [ ValidateUser ],
     *          'handler': loginHandler
     *      }
     *  };
     * module.exports = routes;
     * // Export all Route configuration as single Object
     * |- routes/index.js
     * @example
     * let routes = require('./routes');
     * 
     * febby.setRoutes(routes);
     * // set routes before calling febby.createApp()
     */
    setRoutes(routes) {
        this.routes = routes;
    }
    /**
     * Returns PORT
     * @returns {number} port number
     * @description - Returns App port
     */
    getPort() {
        let port = this.config.port || process.env.PORT || 5678;
        process.env.PORT = port;
        return port;
    }
    /**
     * Returns Environment of an APP
     * @returns {string} environment
     * @description - Returns App Environment
     */
    getEnv() {
        let env = this.config.env || process.env.ENV || 'development';
        process.env.ENV = env;
        return env;
    }
    /**
     * @private
     * creates HTTP server and and listen on given PORT
     */
    createHttpServer() {
        if (!this.config) {
            throw 'missing application configuration , use febby.setConfig(config)';
        }
        if (!this.models) {
            throw 'missing model configuration , use febby.setModels(models)';
        }
        if (!this.routes) {
            throw 'missing routes configuration , use febby.setRoutes(routes)';
        }
        if (!this.getPort()) {
            throw 'missing PORT configuration , use config Object to set App PORT';
        }
        http.createServer(this.app).listen(this.getPort(), this.createServerCb);
    }
    /**
     * Run user defined middlewares
     * @param {Function} middlewareFunc 
     * @description - Provides ability to run configure middleware functions .
     * Its is same as ExpressJs Middleware Processing.
     * @example 
     * Simple Logger
     * 
     * const logger = (req, res, next) => {
     *      console.info(req.method+' : '+req.url);
     *      next();
     * }
     * 
     * febby.runMiddleware(logger);
     * 
     * ** Make Sure You must pass request object to next by calling next callback
     */
    runMiddleware(middlewareFunc) {
        this.app.use(middlewareFunc);
    }
    /**
     * Callback of createHttpServer 
     * @private
     * @param {Error} err - Error 
     */
    createServerCb(err) {
        if (err)
            throw err;
    }
    /**
     * Returns Binded models 
     * @returns {Object} returns Object of models
     * @description - Returns Defined Models as an Object
     * 
     * @example
     * Getting Models of an Application , Model names are always Plural
     * 
     * let models = febby.getModels();
     * 
     * models.users.findOne({'username':'vanku'},{}).then((user)=>{
     * //Handle user logic
     * }).catch((err)=>{
     * //handle error
     * })
     * 
     * now you can use models obejct throught application
     */
    getModels() {
        return this.vanku.dbModels;
    }
    /**
     * Returns Express App 
     * @returns {Object} App Obejct
     * @description Returns Express App Object so that user can do what ever things he want 
     * @example
     * // Returns Express App Object
     * let app = febby.getApp();
     * 
     * app.use((req, res, next) => {
     *      console.info(req.method+' : '+req.url);
     *      next();
     * })
     * 
     */
    getApp() {
        return this.app;
    }
}
module.exports = Febby;
