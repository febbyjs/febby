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
        this.restConfig = {};
        this.dbModels = {};
        this.models = {};
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
            this.restConfig[pModel] = this.febby.models[model];
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
            this.models[pModel] = module.exports = mongoose.model(pModel, this.febby.models[model].schema);
            this.dbModels[pModel] = new Query(pModel);
        }
        this.loadRoutes();
        this.loadDefaultMiddlewares();
        //this.loadPreMiddlewares();
        this.loadCustomRoutes();
        this.loadRestRoutes();
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

    // loadPreMiddlewares() {
    //     let middlewares = this.middlewares;
    //     if (!_.isArray(middlewares)) {
    //         throw `it should be array of middleware functions ${middlewares}`;
    //     }
    //     middlewares.forEach(middleware => {
    //         if (typeof middleware !== 'function') {
    //             throw `its not a function \n${middleware}`;
    //         }
    //         this.app.use(middleware);
    //     });
    // }
    /**
     * Load and create route object to handle REST APIs
     */
    loadRoutes() {
        this.error = new Cerror();
        this.route = new ProcessRoute(this);
    }

    /**
     * Load REST Routes and handlers
     */
    loadRestRoutes() {
        let url = this.febby.config.restBasePath || '/',
            self = this;
        this.app.use(url, restRouter);
        restRouter.use(Validators.requestValidator);
        restRouter.param('model', (req, res, next, model) => {
            let pModel;
            try {
                pModel = pluralize(model).toLowerCase();
            } catch (exception) {
                return next(exception);
            }
            req.pModel = pModel;
            let dbModel = self.models[pModel];
            if (!dbModel) {
                let err = this.error.getError(400, `'${model.toUpperCase()}' NOT CONFIGURED`);
                return next(err);
            }
            let restConfig = self.restConfig[pModel];
            let methodConfig = restConfig.methods || {
                all: true,
                middlewares: []
            };
            for (let m in methodConfig) {
                methodConfig[m.toLowerCase()] = methodConfig[m];
            }
            let methodObj = {
                middlewares: []
            };
            if (!methodConfig.all) {
                methodObj = methodConfig[req.method.toLowerCase()];
                if (!methodObj) {
                    return next(this.error.get404());
                } else {
                    if (!methodObj.isEnabled) {
                        return next(this.error.get404());
                    }
                }
            }
            if (!methodConfig[req.method.toLowerCase()]) {
                methodConfig[req.method.toLowerCase()] = {
                    middlewares: []
                };
            }
            methodObj.middlewares = methodConfig[req.method.toLowerCase()].middlewares || [];

            let funcs = [];
            if (_.isArray(methodConfig.middlewares)) {
                funcs = methodConfig.middlewares.length > 0 ? methodConfig.middlewares : [];
            } else if (_.isFunction(methodConfig.middlewares)) {
                funcs = [methodConfig.middlewares];
            }
            for (let func in funcs) {
                if (!_.isFunction(funcs[func])) {
                    return next(this.error.getError(409, 'INVALID GLOBAL MIDDLEWARE DECLARATION'));
                }
            }
            let methodFunc = [];
            if (_.isArray(methodObj.middlewares)) {
                methodFunc = methodObj.middlewares.length > 0 ? methodObj.middlewares : [];
            } else if (_.isFunction(methodObj.middlewares)) {
                methodFunc = [methodObj.middlewares];
            }
            for (let func in methodFunc) {
                if (!_.isFunction(methodFunc[func])) {
                    return next(this.error.getError(409, 'INVALID METHOD MIDDLEWARE DECLARATION'));
                }
            }
            let middlewares = _.concat(funcs, methodFunc);
            this.processMiddlewares(req, res, (err) => {
                if (err)
                    return next(err);
                next();
            }, middlewares);
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
                'errors': [err.message]
            });
        });

    }

    /**
     * Load Custom route handlers to process custom defined routes
     */
    loadCustomRoutes() {
        let curl;
        try {
            curl = this.febby.config.routeBasePath || '/';
        } catch (e) {
            curl = '/';
        }
        this.app.use(curl, customRouter);
        customRouter.all('*', (req, res, next) => {
            let cr = this.febby.routes[req.path.toLowerCase()] || null;
            if (!cr) {
                return next(this.error.get404());
            }
            if (cr.method.toLowerCase() !== req.method.toLowerCase()) {
                return next(this.error.get404());
            }
            if (typeof cr.handler !== 'function') {
                return next(this.error.getError(403, 'NOT A VALID REQ. HANDLER'));
            }
            cr.handler(req, res, next, this.dbModels);
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
}

module.exports = Vanku;
