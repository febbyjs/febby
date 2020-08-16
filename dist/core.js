"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*!
 * febby
 * Copyright(c) 2018-2020 Vasu Vanka
 * MIT Licensed
 */
var express_1 = __importStar(require("express"));
var helper_1 = require("./helper");
var types_1 = require("./types");
var http_1 = require("http");
var debug_1 = require("debug");
var morgan_1 = __importDefault(require("morgan"));
var body_parser_1 = __importDefault(require("body-parser"));
var cors_1 = __importDefault(require("cors"));
var helmet_1 = __importDefault(require("helmet"));
var mongoose_1 = __importDefault(require("mongoose"));
var log = debug_1.debug('febby:core');
/**
 * Febby implements IFebby interface
 * See the [[IFebby]] interface for more details.
 */
var Febby = /** @class */ (function () {
    /**
     * @param config Application configuration
     */
    function Febby(config) {
        // expressApp holds express application object
        this.expressApp = express_1.default();
        this.mainRouter = express_1.Router();
        log('Febby init started');
        if (Febby.instance) {
            return Febby.instance;
        }
        this.appConfig = helper_1.validateAppConfig(config || {});
        log('app config set');
        log('mongoose set default values for useNewUrlParser,useFindAndModify,useCreateIndex,useUnifiedTopology');
        log('express app created');
        log('app default middlewares init started');
        this.expressApp.use(morgan_1.default(this.appConfig.morgan || 'combined'));
        log('express app added morgan logger');
        this.expressApp.use(body_parser_1.default.urlencoded({
            extended: false
        }));
        log('express app added bodyParser');
        this.expressApp.use(body_parser_1.default.json());
        log('express app added bodyParser.json');
        this.expressApp.use(helmet_1.default(this.appConfig.helmet || {}));
        log('express app added helmet');
        this.expressApp.use(cors_1.default(this.appConfig.cors || {}));
        log('express app added cors');
        log('app main router created');
        this.expressApp.use(this.appConfig.appBaseUrl, this.mainRouter);
        log('final middlewares');
        log('app main router set');
        Febby.instance = this;
        this.connectToDb().then(log).catch(console.error);
    }
    /**
     * @private
     */
    Febby.prototype.connectToDb = function () {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var options, error_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        log('db connection init');
                        if (!((_a = this.appConfig) === null || _a === void 0 ? void 0 : _a.db)) return [3 /*break*/, 5];
                        options = __assign({}, ((_b = this.appConfig.db) === null || _b === void 0 ? void 0 : _b.options) || { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: true });
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, mongoose_1.default.connect((_c = this.appConfig.db) === null || _c === void 0 ? void 0 : _c.url, __assign({}, options))];
                    case 2:
                        _d.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _d.sent();
                        throw error_1;
                    case 4:
                        log('db connection created');
                        _d.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * bootstrap will start the application
     * @param cb Callback function which will execute after application bootstrap
     * @returns None
     */
    Febby.prototype.bootstrap = function (cb) {
        var _this = this;
        var _a;
        log('bootstrap init');
        this.server = http_1.createServer(this.expressApp);
        this.server.listen((_a = this.appConfig) === null || _a === void 0 ? void 0 : _a.port, function () {
            var _a;
            log("Server started on PORT " + JSON.stringify((_a = _this.server) === null || _a === void 0 ? void 0 : _a.address()));
            if (cb) {
                cb();
            }
        });
        log('bootstrap end');
    };
    /**
     * route will register an url with handler and middlewares
     * @param routeConfig Route configuration
     * @returns None
     */
    Febby.prototype.route = function (routeConfig) {
        log('route registartion start');
        helper_1.register(routeConfig.router || this.mainRouter, routeConfig.method, routeConfig.path, routeConfig.middlewares || [], routeConfig.handler);
        log('route registartion end');
    };
    /**
     * routes will register list of route configs.
     * @param routesConfig Routes will be list of route config objects
     * @returns None
     */
    Febby.prototype.routes = function (routesConfig) {
        var _this = this;
        log('routes registartion start');
        routesConfig.forEach(function (route) { return _this.route(route); });
        log('routes registartion end');
    };
    /**
     * middleware will register a middleware function to the specified route
     * @param middleware Middleware function
     * @param router Router object
     * @returns None
     */
    Febby.prototype.middleware = function (middleware, router) {
        log('middleware registartion start');
        (router || this.mainRouter).use(middleware);
        log('middleware registartion end');
    };
    /**
     * middlewares will register list of middleware functions
     * @param middlewares list of middleware functions
     * @param router Router object
     * @returns None
     */
    Febby.prototype.middlewares = function (middlewares, router) {
        var _this = this;
        log('middlewares registartion start');
        middlewares.forEach(function (middleware) { return _this.middleware(middleware, router || _this.mainRouter); });
        log('middlewares registartion end');
    };
    /**
     * router will creates router object
     * @param url Url
     * @param router Router object
     * @param options Router object options
     * @returns Router
     */
    Febby.prototype.router = function (url, router, options) {
        log('router registartion start');
        router = router || this.mainRouter;
        options = options || {};
        var newRouter = express_1.Router(options);
        router.use(url, newRouter);
        log('router registartion end');
        return newRouter;
    };
    /**
     * crud will create create,update,get and delete operations on model
     * @param path Url
     * @param config Crud operation configuration
     * @param model Model object
     * @param router Router object
     * @returns None
     */
    Febby.prototype.crud = function (path, config, model, router) {
        log('crud registartion start');
        router = router || this.mainRouter;
        path = path || '/';
        var attachCollection = function (req, _res, next) {
            log('attaching model');
            req.app.locals.collection = model;
            next();
        };
        if (config.crud) {
            log('crud registration');
            helper_1.register(router, types_1.GET, path + "/:id", __spreadArrays([attachCollection], (config.middlewares || []), (config.get || [])), helper_1.getByIdHandler);
            log('crud get registartion');
            helper_1.register(router, types_1.PUT, path + "/:id", __spreadArrays([attachCollection], (config.middlewares || []), (config.put || [])), helper_1.putHandler);
            log('crud put registartion');
            helper_1.register(router, types_1.POST, path, __spreadArrays([attachCollection], (config.middlewares || []), (config.post || [])), helper_1.postHandler);
            log('crud post registartion');
            helper_1.register(router, types_1.PATCH, path, __spreadArrays([attachCollection], (config.middlewares || []), (config.post || [])), helper_1.patchHandler);
            log('crud patch registartion');
            helper_1.register(router, types_1.GET, path, __spreadArrays([attachCollection], (config.middlewares || []), (config.get || [])), helper_1.getHandler);
            log('crud get registartion');
            helper_1.register(router, types_1.DELETE, path + "/:id", __spreadArrays([attachCollection], (config.middlewares || []), (config.delete || [])), helper_1.removeByIdHandler);
            log('crud delete registartion');
        }
        else {
            if (config.get) {
                log('crud get registartion');
                helper_1.register(router, types_1.GET, path + "/:id", __spreadArrays([attachCollection], (config.middlewares || []), (config.get || [])), helper_1.getByIdHandler);
                helper_1.register(router, types_1.GET, path, __spreadArrays([attachCollection], (config.middlewares || []), (config.get || [])), helper_1.getHandler);
            }
            if (config.put) {
                log('crud put registartion');
                helper_1.register(router, types_1.PUT, path + "/:id", __spreadArrays([attachCollection], (config.middlewares || []), (config.put || [])), helper_1.putHandler);
            }
            if (config.delete) {
                log('crud delete registartion');
                helper_1.register(router, types_1.DELETE, path, __spreadArrays([attachCollection], (config.middlewares || []), (config.delete || [])), helper_1.removeByIdHandler);
            }
            if (config.post) {
                log('crud post registartion');
                helper_1.register(router, types_1.POST, path, __spreadArrays([attachCollection], (config.middlewares || []), (config.post || [])), helper_1.postHandler);
            }
            if (config.patch) {
                log('crud patch registartion');
                helper_1.register(router, types_1.PATCH, path + "/:id", __spreadArrays([attachCollection], (config.middlewares || []), (config.post || [])), helper_1.patchHandler);
            }
        }
    };
    /**
     * model will register and creates mongoose model instance if not exist
     * @param name Model name
     * @param schema Model schema
     * @returns Model<Document, {}>
     */
    Febby.prototype.model = function (name, schema) {
        log("model registartion : " + name);
        var models = this.models();
        if (models[name]) {
            return models[name];
        }
        return mongoose_1.default.model(name, schema);
    };
    /**
     * models will return model objects
     * @returns { [index: string]: Model<Document, {}> }
     */
    Febby.prototype.models = function () {
        log("return models");
        return mongoose_1.default.models;
    };
    /**
     * finalMiddlewares will register all final middleware function
     * @param middlewares Middleware functions
     * @returns None
     */
    Febby.prototype.finalMiddlewares = function (middlewares) {
        var _this = this;
        log("final middlewares registartion");
        middlewares.forEach(function (middleware) { return _this.expressApp.use(middleware); });
    };
    /**
     * finalHandler will register final middleware function
     * @param middleware Middleware function
     * @returns None
     */
    Febby.prototype.finalHandler = function (middleware) {
        log("final handler registartion");
        this.expressApp.use(middleware);
    };
    /**
     * shutdown will close the application
     * @returns None
     */
    Febby.prototype.shutdown = function () {
        var _a;
        log("application shutdown");
        (_a = this.server) === null || _a === void 0 ? void 0 : _a.close();
    };
    /**
     * @deprecated
     * closeConnection will close database connection
     * @returns None
     */
    Febby.prototype.closeConnection = function () {
        log("closing database connection");
        mongoose_1.default.connection.close();
    };
    /**
     * closeDbConnection will close database connection
     * @returns None
     */
    Febby.prototype.closeDbConnection = function () {
        log("closing database connection");
        mongoose_1.default.connection.close();
    };
    return Febby;
}());
exports.Febby = Febby;
exports.default = Febby;
