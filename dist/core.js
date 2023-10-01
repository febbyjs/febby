"use strict";
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
const bodyParser = __importStar(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const Redis = __importStar(require("ioredis"));
const assert_1 = __importDefault(require("assert"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const openapi_1 = require("./openapi");
const log = (0, debug_1.debug)("febby:core");
class Febby {
    constructor(config) {
        this.expressApp = (0, express_1.default)();
        this.mainRouter = (0, express_1.Router)();
        log("Febby init started");
        if (Febby.instance) {
            return Febby.instance;
        }
        this.appConfig = (0, helper_1.validateAppConfig)(config);
        if (config.app) {
            this.expressApp = config.app;
        }
        if (this.appConfig.loadDefaultMiddlewareOnAppCreation) {
            log("app default middlewares init started");
            this.expressApp.use((0, morgan_1.default)(this.appConfig.morgan || "combined"));
            log("express app added morgan logger");
            this.expressApp.use(bodyParser.urlencoded({
                extended: false,
            }));
            log("express app added bodyParser");
            this.expressApp.use(bodyParser.json());
            log("express app added bodyParser.json");
            this.expressApp.use((0, helmet_1.default)(this.appConfig.helmet || {}));
            log("express app added helmet");
            this.expressApp.use((0, cors_1.default)(this.appConfig.cors || {}));
            log("express app added cors");
        }
        log("app main router created");
        this.expressApp.use(this.appConfig.appBaseUrl, this.mainRouter);
        log("app main router set");
        Febby.instance = this;
        if (this.appConfig.db) {
            this.connectDatabase();
        }
        if (this.appConfig.redis) {
            this.connectRedis();
        }
    }
    async connectDatabase() {
        var _a;
        log("db connection init");
        assert_1.default.notStrictEqual(this.appConfig.db, undefined, "database config should be defined");
        const options = Object.assign({
            useUnifiedTopology: true,
            useNewUrlParser: true,
        }, (_a = this.appConfig.db) === null || _a === void 0 ? void 0 : _a.options);
        (0, assert_1.default)(this.appConfig.db.url !== undefined, "mongodb url - db.url should be defined");
        mongoose_1.default.set("strictQuery", true);
        await mongoose_1.default.connect(this.appConfig.db.url, options);
        log("db connection created");
    }
    async connectRedis() {
        log("redis connection init");
        (0, assert_1.default)(this.appConfig.redis === undefined, "redis config should be defined");
        const conf = this.appConfig.redis;
        (0, assert_1.default)(conf.port === undefined, "redis port should be defined");
        (0, assert_1.default)(conf.host === undefined, "redis host should be defined");
        this.redis = new Redis.default(conf.port, conf.host, { ...conf });
        const monitor = await this.redis.monitor();
        monitor.on("monitor", function (time, args, source, database) {
            log(`time : ${time}, args : ${args}, source: ${source}, database: ${database}`);
        });
    }
    bootstrap(cb) {
        log("bootstrap init");
        this.server = (0, http_1.createServer)(this.expressApp);
        (0, assert_1.default)(this.appConfig.port !== undefined, "app port should be defined");
        this.server.listen(this.appConfig.port, () => {
            var _a;
            log(`Server started on PORT ${JSON.stringify((_a = this.server) === null || _a === void 0 ? void 0 : _a.address())}`);
            if (cb) {
                cb();
            }
        });
        log("bootstrap end");
    }
    async start() {
        log("start init");
        (0, assert_1.default)(this.appConfig.port !== undefined, "app port should be defined");
        this.server = (0, http_1.createServer)(this.expressApp);
        this.server.listen(this.appConfig.port, () => {
            var _a;
            log(`Server started on PORT ${(_a = this.server) === null || _a === void 0 ? void 0 : _a.address()}`);
        });
        log("start end");
    }
    async loadDefaultMiddlewares() {
        log("app default middlewares init started");
        this.expressApp.use((0, morgan_1.default)(this.appConfig.morgan || "combined"));
        log("express app added morgan logger");
        this.expressApp.use(bodyParser.urlencoded({
            extended: false,
        }));
        log("express app added bodyParser");
        this.expressApp.use(bodyParser.json());
        log("express app added bodyParser.json");
        this.expressApp.use((0, helmet_1.default)(this.appConfig.helmet || {}));
        log("express app added helmet");
        this.expressApp.use((0, cors_1.default)(this.appConfig.cors || {}));
        log("express app added cors");
    }
    async loadOpenAPIConfigYAML(path, options = {}) {
        log("loadOpenAPIConfigYAML init");
        if (!(0, fs_1.existsSync)(path)) {
            log("file not found at " + path);
            throw new Error(`invalid file path to load openApi YAML file at "${path}"`);
        }
        const fileBuffer = await (0, promises_1.readFile)(path, { encoding: "utf-8" });
        const parsedJson = await (0, openapi_1.parseYAMLFile)(fileBuffer);
        const { pathnames, router } = await (0, openapi_1.processOpenApiSpecFile)(parsedJson, options);
        log(`base paths registered on server for OpenApi is ${pathnames.join(",")}`);
        this.expressApp.use(pathnames, router);
        log("loadOpenAPIConfigYAML end");
    }
    route(routeConfig) {
        log("route registration start");
        const router = routeConfig.router || this.mainRouter;
        const middlewares = routeConfig.middlewares || [];
        (0, helper_1.register)(router, routeConfig.method, routeConfig.path, middlewares, routeConfig.handler);
        log("route registration end");
    }
    routes(list) {
        log("routes registration start");
        (0, assert_1.default)(Array.isArray(list), "routes should be an array of route object definitions");
        (0, assert_1.default)(list.length !== 0, "should contain at least minimum of one route object definitions");
        list.forEach((route) => this.route(route));
        log("routes registration end");
    }
    middleware(middleware, router = this.mainRouter) {
        log("middleware registration start");
        (0, assert_1.default)(middleware !== undefined, "middleware should defined");
        router.use(middleware);
        log("middleware registration end");
    }
    middlewares(list, router = this.mainRouter) {
        log("middlewares registration start");
        (0, assert_1.default)(Array.isArray(list), "routes should be an array of route object definitions");
        (0, assert_1.default)(list.length !== 0, "should contain at least minimum of one route object definitions");
        list.forEach((middleware) => this.middleware(middleware, router));
        log("middlewares registration end");
    }
    router(url, router, options) {
        log("router registration start");
        router = router || this.mainRouter;
        options = options || {};
        const newRouter = (0, express_1.Router)(options);
        router.use(url, newRouter);
        log("router registration end");
        return newRouter;
    }
    crud(path = "/", config, model, router = this.mainRouter) {
        log("crud registration start");
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
            log("crud get registration");
            (0, helper_1.register)(router, types_1.PUT, `${path}/:id`, [
                attachCollection,
                ...(config.middlewares || []),
                ...(config.put || []),
            ], helper_1.putHandler);
            log("crud post registration");
            (0, helper_1.register)(router, types_1.POST, path, [
                attachCollection,
                ...(config.middlewares || []),
                ...(config.post || []),
            ], helper_1.postHandler);
            log("crud get registration");
            (0, helper_1.register)(router, types_1.GET, path, [
                attachCollection,
                ...(config.middlewares || []),
                ...(config.get || []),
            ], helper_1.getHandler);
            log("crud delete registration");
            (0, helper_1.register)(router, types_1.DELETE, `${path}/:id`, [
                attachCollection,
                ...(config.middlewares || []),
                ...(config.delete || []),
            ], helper_1.removeByIdHandler);
            return;
        }
        if (config.get) {
            log("crud get registration");
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
            log("crud put registration");
            (0, helper_1.register)(router, types_1.PUT, `${path}/:id`, [
                attachCollection,
                ...(config.middlewares || []),
                ...(config.put || []),
            ], helper_1.putHandler);
        }
        if (config.delete) {
            log("crud delete registration");
            (0, helper_1.register)(router, types_1.DELETE, path, [
                attachCollection,
                ...(config.middlewares || []),
                ...(config.delete || []),
            ], helper_1.removeByIdHandler);
        }
        if (config.post) {
            log("crud post registration");
            (0, helper_1.register)(router, types_1.POST, path, [
                attachCollection,
                ...(config.middlewares || []),
                ...(config.post || []),
            ], helper_1.postHandler);
        }
    }
    model(name, schema) {
        log(`model registration : ${name}`);
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
        log(`final middlewares registration`);
        middlewares.forEach((middleware) => this.expressApp.use(middleware));
    }
    finalHandler(middleware) {
        log(`final handler registration`);
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
//# sourceMappingURL=core.js.map