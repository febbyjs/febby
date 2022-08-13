"use strict";
/*!
 * Copyright(c) 2018-2022 Vasu Vanka
 * MIT Licensed
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Febby = void 0;
const express_1 = __importStar(require("express"));
const helper_1 = require("./helper");
const types_1 = require("./types");
const http_1 = require("http");
const debug_1 = require("debug");
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const Redis = __importStar(require("ioredis"));
const util_1 = __importDefault(require("util"));
const log = (0, debug_1.debug)("febby:core");
class Febby {
    constructor(config) {
        this.expressApp = (0, express_1.default)();
        this.mainRouter = (0, express_1.Router)();
        log("Febby init started");
        if (Febby.instance) {
            return Febby.instance;
        }
        this.appConfig = (0, helper_1.validateAppConfig)(config || {});
        log("app config set");
        log("mongoose set default values for useNewUrlParser,useFindAndModify,useCreateIndex,useUnifiedTopology");
        log("express app created");
        log("app default middlewares init started");
        this.expressApp.use((0, morgan_1.default)(this.appConfig.morgan || "combined"));
        log("express app added morgan logger");
        this.expressApp.use(body_parser_1.default.urlencoded({
            extended: false,
        }));
        log("express app added bodyParser");
        this.expressApp.use(body_parser_1.default.json());
        log("express app added bodyParser.json");
        this.expressApp.use((0, helmet_1.default)(this.appConfig.helmet || {}));
        log("express app added helmet");
        this.expressApp.use((0, cors_1.default)(this.appConfig.cors || {}));
        log("express app added cors");
        log("app main router created");
        this.expressApp.use(this.appConfig.appBaseUrl, this.mainRouter);
        log("final middlewares");
        log("app main router set");
        Febby.instance = this;
        this.connectDatabase();
        if (this.appConfig.redis) {
            this.connectRedis();
        }
    }
    async connectDatabase() {
        var _a, _b, _c;
        log("db connection init");
        if ((_a = this.appConfig) === null || _a === void 0 ? void 0 : _a.db) {
            const options = Object.assign({
                useUnifiedTopology: true,
                useNewUrlParser: true,
            }, (_b = this.appConfig.db) === null || _b === void 0 ? void 0 : _b.options);
            try {
                await mongoose_1.default.connect((_c = this.appConfig.db) === null || _c === void 0 ? void 0 : _c.url, options);
            }
            catch (error) {
                throw error;
            }
            log("db connection created");
        }
    }
    async connectRedis() {
        var _a;
        log("redis connection init");
        const conf = (_a = this.appConfig) === null || _a === void 0 ? void 0 : _a.redis;
        if (conf) {
            this.redis = new Redis.default(conf.port, conf.host, { ...conf });
            this.redis.monitor().then(function (monitor) {
                monitor.on("monitor", function (time, args, source, database) {
                    log(time + " : " + util_1.default.inspect(args));
                });
            });
        }
    }
    bootstrap(cb) {
        var _a;
        log("bootstrap init");
        this.server = (0, http_1.createServer)(this.expressApp);
        this.server.listen((_a = this.appConfig) === null || _a === void 0 ? void 0 : _a.port, () => {
            var _a;
            log(`Server started on PORT ${JSON.stringify((_a = this.server) === null || _a === void 0 ? void 0 : _a.address())}`);
            if (cb) {
                cb();
            }
        });
        log("bootstrap end");
    }
    route(routeConfig) {
        log("route registartion start");
        (0, helper_1.register)(routeConfig.router || this.mainRouter, routeConfig.method, routeConfig.path, routeConfig.middlewares || [], routeConfig.handler);
        log("route registartion end");
    }
    routes(routesConfig) {
        log("routes registartion start");
        routesConfig.forEach((route) => this.route(route));
        log("routes registartion end");
    }
    middleware(middleware, router) {
        log("middleware registartion start");
        (router || this.mainRouter).use(middleware);
        log("middleware registartion end");
    }
    middlewares(middlewares, router) {
        log("middlewares registartion start");
        middlewares.forEach((middleware) => this.middleware(middleware, router || this.mainRouter));
        log("middlewares registartion end");
    }
    router(url, router, options) {
        log("router registartion start");
        router = router || this.mainRouter;
        options = options || {};
        const newRouter = (0, express_1.Router)(options);
        router.use(url, newRouter);
        log("router registartion end");
        return newRouter;
    }
    crud(path, config, model, router) {
        log("crud registartion start");
        router = router || this.mainRouter;
        path = path || "/";
        const attachCollection = (req, _res, next) => {
            log("attaching model & redis");
            req.app.locals.collection = model;
            req.app.locals.febby = this;
            next();
        };
        if (config.crud) {
            log("crud registration");
            (0, helper_1.register)(router, types_1.GET, `${path}/:id`, [
                attachCollection,
                ...(config.middlewares || []),
                ...(config.get || []),
            ], helper_1.getByIdHandler);
            log("crud get registartion");
            (0, helper_1.register)(router, types_1.PUT, `${path}/:id`, [
                attachCollection,
                ...(config.middlewares || []),
                ...(config.put || []),
            ], helper_1.putHandler);
            log("crud put registartion");
            (0, helper_1.register)(router, types_1.POST, path, [
                attachCollection,
                ...(config.middlewares || []),
                ...(config.post || []),
            ], helper_1.postHandler);
            log("crud post registartion");
            (0, helper_1.register)(router, types_1.GET, path, [
                attachCollection,
                ...(config.middlewares || []),
                ...(config.get || []),
            ], helper_1.getHandler);
            log("crud get registartion");
            (0, helper_1.register)(router, types_1.DELETE, `${path}/:id`, [
                attachCollection,
                ...(config.middlewares || []),
                ...(config.delete || []),
            ], helper_1.removeByIdHandler);
            log("crud delete registartion");
        }
        else {
            if (config.get) {
                log("crud get registartion");
                (0, helper_1.register)(router, types_1.GET, `${path}/:id`, [
                    attachCollection,
                    ...(config.middlewares || []),
                    ...(config.get || []),
                ], helper_1.getByIdHandler);
                (0, helper_1.register)(router, types_1.GET, path, [
                    attachCollection,
                    ...(config.middlewares || []),
                    ...(config.get || []),
                ], helper_1.getHandler);
            }
            if (config.put) {
                log("crud put registartion");
                (0, helper_1.register)(router, types_1.PUT, `${path}/:id`, [
                    attachCollection,
                    ...(config.middlewares || []),
                    ...(config.put || []),
                ], helper_1.putHandler);
            }
            if (config.delete) {
                log("crud delete registartion");
                (0, helper_1.register)(router, types_1.DELETE, path, [
                    attachCollection,
                    ...(config.middlewares || []),
                    ...(config.delete || []),
                ], helper_1.removeByIdHandler);
            }
            if (config.post) {
                log("crud post registartion");
                (0, helper_1.register)(router, types_1.POST, path, [
                    attachCollection,
                    ...(config.middlewares || []),
                    ...(config.post || []),
                ], helper_1.postHandler);
            }
        }
    }
    model(name, schema) {
        log(`model registartion : ${name}`);
        const models = this.models();
        if (models[name]) {
            return models[name];
        }
        return mongoose_1.default.model(name, schema);
    }
    models() {
        log(`return models`);
        return mongoose_1.default.models;
    }
    finalMiddlewares(middlewares) {
        log(`final middlewares registartion`);
        middlewares.forEach((middleware) => this.expressApp.use(middleware));
    }
    finalHandler(middleware) {
        log(`final handler registartion`);
        this.expressApp.use(middleware);
    }
    shutdown() {
        var _a;
        log(`application shutdown`);
        (_a = this.server) === null || _a === void 0 ? void 0 : _a.close();
    }
    closeConnection() {
        log(`closing database connection`);
        mongoose_1.default.connection.close();
    }
    closeDbConnection() {
        log(`closing database connection`);
        mongoose_1.default.connection.close();
    }
}
exports.Febby = Febby;
exports.default = Febby;
//# sourceMappingURL=core.js.map