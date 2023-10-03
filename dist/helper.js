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
exports.buildProjection = exports.getHandler = exports.putHandler = exports.postHandler = exports.removeByIdHandler = exports.getByIdHandler = exports.register = exports.buildRedisKey = exports.validateAppConfig = void 0;
const types_1 = require("./types");
const debug = __importStar(require("debug"));
const assert_1 = __importDefault(require("assert"));
const log = debug.debug("febby:helper");
function validateAppConfig(config) {
    (0, assert_1.default)(config !== undefined, "config should be provided");
    config.appBaseUrl = config.appBaseUrl || types_1.appBaseUrl;
    config.serviceName = config.serviceName || "febby";
    config.loadDefaultMiddlewareOnAppCreation =
        config.loadDefaultMiddlewareOnAppCreation === undefined
            ? true
            : config.loadDefaultMiddlewareOnAppCreation;
    return config;
}
exports.validateAppConfig = validateAppConfig;
function buildRedisKey(serviceName, functionName, key) {
    return `${serviceName}.${functionName}.${key}`;
}
exports.buildRedisKey = buildRedisKey;
function register(router, method, path, middlewares, handler) {
    log(`Register route :: ${method} :: ${path}`);
    (0, assert_1.default)(method !== undefined, "method should be defined");
    (0, assert_1.default)(path !== undefined, "path should be defined");
    (0, assert_1.default)(middlewares !== undefined, "middlewares should be defined or empty array");
    (0, assert_1.default)(handler !== undefined, "handler should be defined");
    router[method](path, middlewares, handler);
}
exports.register = register;
async function getByIdHandler(req, res, next) {
    var _a, _b, _c;
    const id = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
    const model = res.app.get("collection");
    const febby = res.app.get("febby");
    log(`getByIdHandler :: ${model.modelName} :: ${id}`);
    const projection = ((_b = req.query) === null || _b === void 0 ? void 0 : _b.projection)
        ? buildProjection((_c = req.query) === null || _c === void 0 ? void 0 : _c.projection)
        : "";
    let doc = null;
    if (febby.redis) {
        doc = await febby.redis.get(buildRedisKey(febby.appConfig.serviceName, model.modelName, id));
    }
    if (doc) {
        const parsedDoc = JSON.parse(doc);
        const keys = projection ? projection.split(" ") : [];
        let result = {};
        if (keys.length > 0) {
            for (const key of keys) {
                if (parsedDoc[key]) {
                    result[key] = parsedDoc[key];
                }
            }
        }
        else {
            result = parsedDoc;
        }
        res.status(types_1.OK).send(result);
        return;
    }
    let result;
    try {
        result = await model.findById(id, projection || {});
        res.status(types_1.OK).send(result);
    }
    catch (error) {
        const code = 500;
        res.status(code).send({
            error: error.message,
            code,
        });
    }
    if (result && febby.redis) {
        try {
            await febby.redis.set(buildRedisKey(febby.appConfig.serviceName, model.modelName, id), JSON.stringify(result), "EX", 600);
        }
        catch (error) {
            console.error(`failed to store rec in redis, error is ${error}`);
        }
    }
}
exports.getByIdHandler = getByIdHandler;
async function removeByIdHandler(req, res, next) {
    var _a;
    const model = res.app.get("collection");
    const febby = res.app.get("febby");
    const _id = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
    log(`removeByIdHandler :: ${model.modelName} :: ${_id}`);
    try {
        const result = await model.deleteOne({
            _id,
        });
        res.status(types_1.OK).send(result);
    }
    catch (error) {
        const code = 500;
        res.status(code).send({
            error: error.message,
            code,
        });
    }
    if (febby.redis) {
        try {
            await febby.redis.del(buildRedisKey(febby.appConfig.serviceName, model.modelName, _id));
        }
        catch (error) {
            log(`removeByIdHandler redis error ${error}`);
        }
    }
}
exports.removeByIdHandler = removeByIdHandler;
async function postHandler(req, res, next) {
    const { body } = req;
    log(`postHandler - ${JSON.stringify(body)}`);
    const model = res.app.get("collection");
    let result;
    try {
        const coll = new model(body);
        result = await coll.save();
        res.status(types_1.CREATED).send(result);
    }
    catch (error) {
        const code = 500;
        res.status(code).send({
            error: error.message,
            code,
        });
        return;
    }
}
exports.postHandler = postHandler;
async function putHandler(req, res, next) {
    var _a;
    const { body } = req;
    log(`putHandler - ${JSON.stringify(body)}`);
    const model = res.app.get("collection");
    const febby = res.app.get("febby");
    const _id = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const result = await model.updateOne({
            _id,
        }, {
            $set: body,
        }, {
            new: false,
        });
        res.status(types_1.OK).send(result);
    }
    catch (error) {
        const code = 500;
        res.status(code).send({
            error: error.message,
            code,
        });
    }
    if (febby.redis) {
        try {
            await febby.redis.del(buildRedisKey(febby.appConfig.serviceName, model.modelName, _id));
        }
        catch (error) {
            log(`putHandler redis error:: ${error}`);
        }
    }
}
exports.putHandler = putHandler;
async function getHandler(req, res, next) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const model = res.app.get("collection");
    const skip = ((_a = req.query) === null || _a === void 0 ? void 0 : _a.skip) ? parseInt((_b = req.query) === null || _b === void 0 ? void 0 : _b.skip, 10) : 0;
    const limit = ((_c = req.query) === null || _c === void 0 ? void 0 : _c.limit)
        ? parseInt((_d = req.query) === null || _d === void 0 ? void 0 : _d.limit, 10)
        : 10;
    const projection = (((_e = req.query) === null || _e === void 0 ? void 0 : _e.projection) || "").length > 0
        ? buildProjection((_f = req.query) === null || _f === void 0 ? void 0 : _f.projection)
        : {};
    try {
        const query = ((_g = req.query) === null || _g === void 0 ? void 0 : _g.query)
            ? JSON.parse((_h = req.query) === null || _h === void 0 ? void 0 : _h.query)
            : {};
        const [countList, value = {}] = await Promise.all([
            model.find(query, { _id: 1 }),
            model.find(query, projection, {
                skip,
                limit,
            }),
        ]);
        res.status(200).send({ value, count: countList.length });
    }
    catch (error) {
        const code = 500;
        res.status(code).send({
            error: error.message,
            code,
        });
    }
}
exports.getHandler = getHandler;
function buildProjection(projection = "") {
    return projection.replace("+", " ");
}
exports.buildProjection = buildProjection;
//# sourceMappingURL=helper.js.map