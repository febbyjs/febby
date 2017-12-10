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
const http = require('http');
const Vanku = require('./vanku');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

/**
 * Febby - Configuration based NodeJs Framework.
 *
 * Configuration based REST with custom Route support and Method specific Middleware configuration
 *
 * @example
 * npm install febby --save
 * 
 * @example
 * const Febby = require('febby');
 * 
 * @example
 * const febby = new Febby();
 * 
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
     *
     *
     */
    createApp() {
        this.vanku = new Vanku(this);
        this.vanku.getConnection().then(db => {
            this.db = db;
            console.log(`connection established with database url is :: ${this.vanku.getMongoUrl()}`);
            this.vanku.bindModels();
            let isCluster = this.config.clusterMode || false;
            if (isCluster) {
                if (cluster.isMaster) {
                    console.log(`Master ${process.pid} is running`);
                    // Fork workers.
                    for (let i = 0; i < numCPUs; i++) {
                        cluster.fork();
                    }
                    cluster.on('exit', (worker, code, signal) => {
                        console.log(`worker ${worker.process.pid} died`);
                    });
                } else {
                    // Workers can share any TCP connection
                    // In this case it is an HTTP server
                    this.createHttpServer();
                    console.log(`Worker ${process.pid} started`);
                }
            } else {
                this.createHttpServer();
            }
        }).catch(err => {
            throw err;
        });
    }


    /**
     * set Config Object before calling febby.createApp()
     * @param {Object} config
     * @example
     * let config = {
     *  'port': 3000,
     *  // Application base path
     *  'basePath': '/api/v1',
     *  'restBasePath': '/model', // /api/v1/model
     *  // Route Path for user defined Routes
     *  'routeBasePath': '/route', // /api/v1/route
     *  // MongoDB configuration
     *  'db': {
     *      // mongodb url
     *    'url': 'mongodb://localhost:27017/test'
     *  },
     *  // app will run cluter mode if set true , default value is true
     *  'clusterMode': false
     * };
     *
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
     * let user = {
     *     methods: {
     *         crud: false,
     *          //if all set to true CRUD Operations enabled on this Model.
     *          // if all set false then it will enable user to define which methods need to be enabled
     *         middlewares: [ ValidateUser ],
     *          // Array of functions whcih will execute before your CRUD methods , make sure midllewares config properly.
     *          //below is method name and method middleware configuration
     *         get: [],
     *         post: [ hasPermission ],
     *         put: []
     *     },
     *      // it is mongoose schema,
     *      // we are using mongoose internally so we just use mongoose schema to validate input data
     *      // by default createdAt , updatedAt keys of type Date is enabled to each and every model
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
     * };
     *
     * let models = {
     *      'user': user
     * };
     * 
     * febby.setModels(models);
     *
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
     *  {Object} request - Express Request Object
     *  {Object} response - Express Response Object
     *  {Function} next - Express next function
     *  {Object} models - configured models
     *
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
     *  }
     * 
     *  let routes =  {
     *      '/login': {
     *          'post': {
     *              'middlewares': [],
     *              'handler': loginHandler
     *          }
     *      }
     *  };
     * 
     * febby.setRoutes(routes);
     * 
     * // set routes before calling febby.createApp()
     */
    setRoutes(routes) {
        this.routes = routes || {};
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
     * @example
     * //Simple Logger
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
        console.log('server listening @ ' + process.env.PORT);
    }

    /**
     * @returns {Object} returns Object of models
     * @description - Returns Defined Models as an Object
     *
     * @example
     * // Getting Models of an Application , Model names are always Plural
     *
     * let models = febby.getModels();
     *
     * models.users.findOne({'username':'vanku'},{}).then((user)=>{
     *  //Handle user logic
     *  }).catch((err)=>{
     *  //handle error
     * })
     *
     * //now you can use models obejct throught application
     */
    getModels() {
        return this.vanku.dbModels;
    }

    /**
     * Returns Express App
     * @returns { Object } App Obejct
     * @description Returns Express App Object
     * @example
     * // Returns Express App Object
     * let app = febby.getApp();
     *
     * app.use((req, res, next) => {
     *      console.info(req.method+' : '+req.url);
     *      next();
     * })
     */
    getApp() {
        return this.app;
    }
}

module.exports = Febby;
