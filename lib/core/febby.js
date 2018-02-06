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
const fs = require('fs');
const path = require('path');
/**
 * Febby - Configuration based NodeJs Framework With Swagger Document Generation.
 *
 * REST with custom Route support and Method specific Middleware configuration
 * Automatically generates swagger documentation 
 *
 * table.table.table-striped.table-bordered
*	thead
*		tr
*			th Branch
*			th Build Status
*			th Coverage
*			th Npm
*			th Dependencies
*	tbody
*		tr
*			td Master
*			td
*				a(href='https://travis-ci.org/febbyjs/febby')
*					img(src='https://travis-ci.org/febbyjs/febby.svg?branch=master', alt='Build Status')
*			td
*				a(href='https://coveralls.io/github/febbyjs/febby?branch=master')
*					img(src='https://coveralls.io/repos/github/febbyjs/febby/badge.svg?branch=master', alt='Coverage Status')
*			td
*				a(href='https://badge.fury.io/js/febby')
*					img(src='https://badge.fury.io/js/febby.svg?branch=master', alt='npm version')
*			td
*				a(href='https://david-dm.org/febbyjs/febby')
*	    			img(src='https://david-dm.org/febbyjs/febby/status.svg?branch=master', alt='dependencies Status')

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
        if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = 'development';
        }
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
        let pack;
        if (fs.existsSync(path.join(process.env.PWD, 'package.json')))
            pack = require(path.join(process.env.PWD, 'package.json'));
        this.vanku = new Vanku(this, pack);
        this.vanku.getConnection().then(db => {
            this.db = db;
            console.log('connection established with database');
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
     *  // REST Path for models
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
     *         crud: false, // false enables user to define specific method , default value is true makes crud enable on the modal
     *         middlewares: [ ValidateUser ], //  will run for all enabled methods. array may contain list of functions
     *         get: [], // get value array represents middleware function
     *         post: [ hasPermission ],
     *         put: []
     *     },
     *      // it is mongoose schema,
     *      // by default createdAt , updatedAt keys of type Date is enabled to each and every model
     *      // date and time of document creation and update are automatically done  
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
     * //For Every Route Handler will have following arguments
     * //models contain all database collection modals 
     * let loginHandler = (request, response, next, models) => { 
     *      let username = request.body.username
     *      let password = request.body.password
     *      // will handle user login logic here
     *      models.users.findOne({'username':username},{}).
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
     *          },
     *          'get': {
     *              'middlewares': [],
     *              'handler': (req,res,next,models)=>{
     *                  res.json({'data':'hello world'});
     *              }
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
     * @private 
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
