"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProjection = exports.getHandler = exports.putHandler = exports.postHandler = exports.removeByIdHandler = exports.getByIdHandler = exports.register = exports.validateAppConfig = void 0;
const types_1 = require("./types");
const debug = __importStar(require("debug"));
const log = debug.debug("febby:helper");
function validateAppConfig(config) {
    config.appBaseUrl = config.appBaseUrl || types_1.appBaseUrl;
    config.serviceName = config.serviceName || "febby";
    return config;
}
exports.validateAppConfig = validateAppConfig;
function buildRedisKey(serviceName, functionName, key) {
    return `${serviceName}.${functionName}.${key}`;
}
function register(router, method, path, middlewares, handler) {
    log(`Register route :: ${method} :: ${path}`);
    try {
        router[method](path, middlewares, handler);
    }
    catch (error) {
        throw error;
    }
}
exports.register = register;
async function getByIdHandler(req, res, next) {
    const id = req.params.id;
    log(`getByIdHandler :: ${req.app.locals.collection.modelName} :: ${id}`);
    const projection = req.query.projection
        ? buildProjection(req.query.projection)
        : "";
    try {
        const doc = await req.app.locals.febby.redis.get(buildRedisKey(req.app.locals.febby.appConfig.serviceName, req.app.locals.collection.modelName, id));
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
    }
    catch (error) {
        const code = 500;
        res.status(code).send({
            error: error.message,
            code,
        });
    }
    try {
        const result = await req.app.locals.collection.findById(id, projection || {});
        if (result) {
            await req.app.locals.febby.redis.set(buildRedisKey(req.app.locals.febby.appConfig.serviceName, req.app.locals.collection.modelName, id), JSON.stringify(result));
        }
        res.status(types_1.OK).send(result);
    }
    catch (error) {
        const code = 500;
        res.status(code).send({
            error: error.message,
            code,
        });
    }
}
exports.getByIdHandler = getByIdHandler;
async function removeByIdHandler(req, res, next) {
    const _id = req.params.id;
    log(`removeByIdHandler :: ${req.app.locals.collection.modelName} :: ${_id}`);
    try {
        await req.app.locals.febby.redis.del(buildRedisKey(req.app.locals.febby.appConfig.serviceName, req.app.locals.collection.modelName, _id));
    }
    catch (error) {
        const code = 500;
        res.status(code).send({
            error: error.message,
            code,
        });
    }
    try {
        const result = await req.app.locals.collection.deleteOne({
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
}
exports.removeByIdHandler = removeByIdHandler;
async function postHandler(req, res, next) {
    const { body } = req;
    let result;
    try {
        const coll = new req.app.locals.collection(body);
        result = await coll.save();
        res.status(types_1.CREATED).send(result);
    }
    catch (error) {
        const code = 500;
        res.status(code).send({
            error: error.message,
            code,
        });
    }
    log(`postHandler :: ${req.app.locals.collection.modelName} :: ${result._id}`);
    try {
        await req.app.locals.febby.redis.set(buildRedisKey(req.app.locals.febby.appConfig.serviceName, req.app.locals.collection.modelName, result._id), JSON.stringify(result));
    }
    catch (error) {
        log(`postHandler error:: ${error.message}`);
    }
}
exports.postHandler = postHandler;
async function putHandler(req, res, next) {
    const { body } = req;
    const _id = req.params.id;
    log(`putHandler :: ${req.app.locals.collection.modelName} :: ${_id}`);
    try {
        await req.app.locals.febby.redis.del(buildRedisKey(req.app.locals.febby.appConfig.serviceName, req.app.locals.collection.modelName, _id));
    }
    catch (error) {
        const code = 500;
        res.status(code).send({
            error: error.message,
            code,
        });
    }
    try {
        const result = await req.app.locals.collection.updateOne({
            _id,
        }, {
            $set: body,
        }, {
            new: false,
        });
        res.status(types_1.OK).send(result);
        await req.app.locals.febby.redis.del(buildRedisKey(req.app.locals.febby.appConfig.serviceName, req.app.locals.collection.modelName, _id));
    }
    catch (error) {
        const code = 500;
        res.status(code).send({
            error: error.message,
            code,
        });
    }
}
exports.putHandler = putHandler;
async function getHandler(req, res, next) {
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
    const limit = req.query.limit
        ? parseInt(req.query.limit, 10)
        : 10;
    const projection = (req.query.projection || "").length > 0
        ? buildProjection(req.query.projection)
        : {};
    try {
        const query = req.query.query ? JSON.parse(req.query.query) : {};
        const results = await Promise.all([
            req.app.locals.collection.count(query),
            await req.app.locals.collection.find(query, projection, {
                skip,
                limit,
            }),
        ]);
        res.status(200).send({ value: results[1], count: results[0] });
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