/*!
 * febby
 * Copyright(c) 2017 Vasu Vanka
 * MIT Licensed
 */
/**
 * @private
 * loading dependency modules
 */
const _ = require('lodash');
const mongoose = require('mongoose');
const express = require('express');
const pluralize = require('pluralize');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const Connection = require('../db/connection');
const ProcessRoute = require('./route');
const Query = require('../db/query');
const Validators = require('./validators');
const Cerror = require('./errors');
const restRouter = express.Router();
const customRouter = express.Router();
const baseRouter = express.Router();
/**
 * @private
 * setting up mongoose promises as native promises
 */
mongoose.Promise = global.Promise;

/**
 * @private
 * Class Represents Vanku which handles all core things of routes and models
 */
class Vanku {
    /**
     * @private
     * Creates Vanku class object
     * @param {Object} febby - febby class object
     */
    constructor(febby) {
        this.febby = febby;
        this.app = febby.app;
        this.dbModels = {};
        this.models = {};
        this.routes = {};
        // this.swagJson = {
        //     'swagger': ' 2.0',
        //     'info': {
        //         'description': pack.description || '',
        //         'version': pack.version || '0.0.0',
        //         'title': pack.name || '',
        //         'contact': {
        //             'email': pack.author || ''
        //         },
        //         'license': {
        //             'name': pack.license || ''
        //         }
        //     },
        //     'host': this.febby.config.host || '0.0.0.0',
        //     'basePath': this.febby.config.basePath || '/',
        //     'tags': [],
        //     'schemes': ['http'],
        //     'paths': {},
        //     'securityDefinitions': {},
        //     'definitions': {},
        //     'externalDocs': {}
        // };
    }

    /**
     * to get mongodb url
     * @returns {string} - retruns mongodb url or null
     */
    getMongoUrl() {
        let dbUrl = 'mongodb://localhost:27017/test';
        if (!this.febby.config.db) {
            return dbUrl;
        }
        if (this.febby.config.db) {
            return this.febby.config.db.url || dbUrl;
        } else {
            return dbUrl;
        }
    }

    /**
     * Creates connection and returned as promise
     * @returns {Promise.<Object|Error>} mongodb db object if connection established,
     * or an error if rejected.
     */
    getConnection() {
        let connection = new Connection(mongoose);
        let url = this.getMongoUrl();
        if (!url) {
            throw 'missing db object in config,please make sure you are following proper configuration';
        }
        return new Promise((resolve, reject) => {
            connection.createConnection(url)
                .then((db) => {
                    this.db = db;
                    resolve(db);
                }).catch((exception) => {
                    reject(exception);
                });
        });
    }

    /**
     * Binds schema to models and load routes,models,middlewares and custom routes
     */
    bindModels() {
        if (!this.db) {
            throw 'no db connection created ,please try to restart app';
        }
        for (let model in this.febby.models) {
            let pModel = pluralize(model).toString().toLowerCase();
            this.febby.models[pModel] = this.febby.models[model];
            if (!this.febby.models[model].schema) {
                throw `Schema for ${model} is missing , make sure you configured it properly`;
            }
            this.febby.models[model].schema['createdAt'] = {
                type: Date,
                default: Date.now()
            };
            this.febby.models[model].schema['updatedAt'] = {
                type: Date
            };
            mongoose.model(pModel, this.febby.models[model].schema);
            this.dbModels[pModel] = new Query(pModel);
            delete this.febby.models[model];
            this.constructRestMethods(pModel, this.febby.models[pModel]);
        }
        this.constructRouteMethods();
        this.loadDefaultMiddlewares();
        this.loadRoutes();
        this.loadCustomRoutes();
        this.loadRestRoutes();
        this.handle404();

    }

    /**
     * Loads default required middlewares
     */
    loadDefaultMiddlewares() {
        let limit = this.febby.config.jsonParserSize || '100kb';
        this.app.use(bodyParser.json({
            'limit': limit
        }));
        this.app.use(bodyParser.urlencoded({
            extended: false
        }));
        this.app.use(cors());
        this.app.use(compression());
        this.app.use(helmet());
    }

    /**
     * Load and create route object to handle REST APIs
     */
    loadRoutes() {
        this.error = new Cerror();
        this.route = new ProcessRoute(this);
        let url = this.febby.config.basePath || '/';
        this.app.use(url, baseRouter);
    }

    /**
     * Load REST Routes and handlers
     */
    loadRestRoutes() {
        let url = this.febby.config.restBasePath || '/api',
            self = this;
        baseRouter.use(url, restRouter);
        restRouter.use(Validators.requestValidator);
        restRouter.param('model', (req, res, next, model) => {
            req.pModel = pluralize(model).toLowerCase();
            if (!self.models[req.pModel][req.method.toLowerCase()]) {
                return next(this.error.get404());
            }
            this.processMiddlewares(req, res, (err) => {
                if (err)
                    return next(err);
                next();
            }, self.models[req.pModel][req.method.toLowerCase()]);
        });
        restRouter.all('/:model', (req, res, next) => {
            this.route.processRestMethods(req, req.pModel, (err, result) => {
                if (err)
                    return next(err);
                res.json(result);
            });
        });
        restRouter.param('id', Validators.validateObjectId);
        restRouter.all('/:model/:id', (req, res, next) => {
            this.route.processRestMethods(req, req.pModel, (err, result) => {
                if (err)
                    return next(err);
                res.json(result);
            });
        });
    }

    /**
     * Load Custom route handlers to process custom defined routes
     */
    loadCustomRoutes() {
        let self = this,
            url = this.febby.config.routeBasePath || '/';
        baseRouter.use(url, customRouter);
        customRouter.use((req, res, next) => {
            let rPath = req.path.toLowerCase();
            let m = req.method.toLowerCase();
            if (!self.routes[rPath]) {
                return next(this.error.get404());
            }
            if (!self.routes[rPath][m]) {
                return next(this.error.get404());
            }
            this.processMiddlewares(req, res, (err) => {
                if (err)
                    return next(err);
                self.routes[rPath][m]['handler'](req, res, next, this.dbModels);
            }, self.routes[rPath][m]['middlewares']);
        });
    }

    /**
     *
     * @param {Request} req - express request object
     * @param {Response} res - express response object
     * @param {NextFunction} next - express next function
     * @param {Object} methodConfig - method configuration to handle middlewares
     * @description processes all specified middlewares before database call.
     */
    processMiddlewares(req, res, next, middlewares) {
        if (middlewares.length == 0) {
            return next();
        }
        let processFuncs = _(middlewares);
        const loop = (self, err) => {
            let status = processFuncs.next();
            if (status.done || err) {
                return next(err);
            }
            status.value.call(self, req, res, (err) => {
                status = processFuncs.next();
                loop(self, err);
            }, self.dbModels);
        };
        loop(this, null);
    }
    /**
     * Handle application level 404
     */
    handle404() {
        // catch 404 and forward to error handler
        this.app.use((req, res, next) => {
            next(this.error.get404());
        });
        // error handler
        this.app.use((err, req, res, next) => {
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};

            // render the error page
            res.status(err.status || 500);
            res.json({
                'success': false,
                'data': {},
                'errors': [err.message.toUpperCase()]
            });
        });
    }
    /**
     * Construct REST modal object 
     * @param {String} name -name of the modal
     * @param {Object} model -configuration of that object
     */
    constructRestMethods(name, model) {
        model.methods = model.methods || {
            'crud': true,
            'middlewares': []
        };
        for (let method in model.methods) {
            let data = model.methods[method];
            delete model.methods[method];
            model.methods[method.toString().toLowerCase()] = data;
        }
        let middlewares = model.methods.middlewares || [];
        let customModel = {};
        if (model.methods.crud) {
            customModel['get'] = model.methods.get || [];
            customModel['post'] = model.methods.post || [];
            customModel['put'] = model.methods.put || [];
            customModel['delete'] = model.methods.delete || [];
        } else {
            for (let m in model.methods) {
                if (m === 'get' || m === 'put' || m === 'post' || m === 'delete')
                    customModel[m] = model.methods[m];
            }
        }
        this.funcCheck(middlewares, name);
        for (let m in customModel) {
            this.funcCheck(customModel[m], name);
            customModel[m].push(...middlewares);
        }
        this.models[name] = customModel;
    }
    /**
     * construct route object
     */
    constructRouteMethods() {
        let routes = this.febby.routes || {};
        for (let r in routes) {
            let route = routes[r] || {};
            for (let method in route) {
                let data = route[method];
                delete route[method];
                let m = method.toString().toLowerCase();
                route[m] = data;
                route[m].middlewares = route[m].middlewares || [];
                this.funcCheck(route[m].middlewares, r + ' ROUTE ' + m + ' METHOD');
                route[m].handler = route[m].handler || null;
                if (!route[m].handler) {
                    throw `HANDLER DECLARATION IS MISSING IN ${JSON.stringify(route)}`;
                }
                if (typeof route[m].handler !== 'function') {
                    throw `HANDLER SHOULD BE A FUNCTION , NOT ${typeof route.handler}`;
                }
            }
            this.routes[r] = route;
        }
    }
    /**
     * Check for array of functions
     * @param {Array} middlewares -middleware array
     * @param {String} name -name of the route or model
     */
    funcCheck(middlewares, name) {
        for (let i = 0; i < middlewares.length; i++) {
            if (typeof middlewares[i] !== 'function')
                throw `${JSON.stringify(middlewares[i])} IS NOT A FUNCTION IN  '${name}' MIDDLEWARE DEFINITION`;
        }
    }
}

module.exports = Vanku;
