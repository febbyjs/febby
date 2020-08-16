"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/*!
 * febby
 * Copyright(c) 2018-2020 Vasu Vanka
 * MIT Licensed
 */
var types_1 = require("./types");
var debug = __importStar(require("debug"));
var log = debug.debug('febby:helper');
/**
 * @private
 * @param config Validates application configuration
 */
function validateAppConfig(config) {
    config.appBaseUrl = config.appBaseUrl || types_1.appBaseUrl;
    return config;
}
exports.validateAppConfig = validateAppConfig;
/**
 * @private
 * Route Registration
 * @param router Application Router
 * @param method Http methgod
 * @param path Url path
 * @param middlewares Middleware functions
 * @param handler request handler
 */
function register(router, method, path, middlewares, handler) {
    log("Register route :: " + method + " :: " + path);
    try {
        router[method](path, middlewares, handler);
    }
    catch (error) {
        // give more context of error
        throw error;
    }
}
exports.register = register;
/**
 * getByIdHandler - Get document by id, supports projection now. just pass projection in query params. ex: projection=name+mobile+email
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
function getByIdHandler(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var id, projection, result, error_1, code;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id = req.params.id;
                    projection = (req.query.projection || "").length > 0 ? buildProjection(req.query.projection) : {};
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, req.app.locals.collection.findById(id, projection)];
                case 2:
                    result = _a.sent();
                    res.status(types_1.OK).send(result);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    code = 500;
                    res.status(code).send({
                        error: (error_1 || {}).message,
                        code: code
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.getByIdHandler = getByIdHandler;
/**
 * removeByIdHandler - Remove document by id
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
function removeByIdHandler(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var _id, result, error_2, code;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _id = req.params.id;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, req.app.locals.collection.findOneAndRemove({
                            _id: _id
                        })];
                case 2:
                    result = _a.sent();
                    res.status(types_1.OK).send(result);
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    code = 500;
                    res.status(code).send({
                        error: (error_2 || {}).message,
                        code: code
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.removeByIdHandler = removeByIdHandler;
/**
 * postHandler - Creates Document
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
function postHandler(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var body, coll, result, error_3, code;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    body = req.body;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    coll = new req.app.locals.collection(body);
                    return [4 /*yield*/, coll.save()];
                case 2:
                    result = _a.sent();
                    res.status(types_1.CREATED).send(result);
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    code = 500;
                    res.status(code).send({
                        error: (error_3 || {}).message,
                        code: code
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.postHandler = postHandler;
/**
 * putHandler - Updates Document
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
function putHandler(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var body, _id, result, error_4, code;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    body = req.body;
                    _id = req.params.id;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, req.app.locals.collection.findOneAndUpdate({
                            _id: _id
                        }, {
                            $set: body
                        }, {
                            new: false
                        })];
                case 2:
                    result = _a.sent();
                    res.status(types_1.OK).send(result);
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    code = 500;
                    res.status(code).send({
                        error: (error_4 || {}).message,
                        code: code
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.putHandler = putHandler;
/**
 * patchHandler - Updates Document
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
function patchHandler(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var body, _id, result, error_5, code;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    body = req.body;
                    _id = req.params.id;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, req.app.locals.collection.findOneAndUpdate({
                            _id: _id
                        }, {
                            $set: body
                        }, {
                            new: false
                        })];
                case 2:
                    result = _a.sent();
                    res.status(types_1.OK).send(result);
                    return [3 /*break*/, 4];
                case 3:
                    error_5 = _a.sent();
                    code = 500;
                    res.status(code).send({
                        error: (error_5 || {}).message,
                        code: code
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.patchHandler = patchHandler;
/**
 * getHandler - Get Documents, supports projection , skip and limit. skip defaulted to 0 and limit defaulted to 10
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
function getHandler(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var skip, limit, projection, query, results, _a, _b, _c, error_6, code;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
                    limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
                    projection = (req.query.projection || "").length > 0 ? buildProjection(req.query.projection) : {};
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 4, , 5]);
                    query = req.query.query ? JSON.parse(req.query.query) : {};
                    _b = (_a = Promise).all;
                    _c = [req.app.locals.collection.count(query)];
                    return [4 /*yield*/, req.app.locals.collection.find(query, projection, {
                            skip: skip,
                            limit: limit
                        })];
                case 2: return [4 /*yield*/, _b.apply(_a, [_c.concat([_d.sent()])])];
                case 3:
                    results = _d.sent();
                    res.status(200).send({ value: results[1], count: results[0] });
                    return [3 /*break*/, 5];
                case 4:
                    error_6 = _d.sent();
                    code = 500;
                    res.status(code).send({
                        error: (error_6 || {}).message,
                        code: code
                    });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.getHandler = getHandler;
/**
 * buildProjection - builds Projection
 * @param projection projection string represents fields with + .Example : 'first_name+last_name+email'
 */
function buildProjection(projection) {
    if (projection === void 0) { projection = ''; }
    return projection.replace('+', ' ');
}
exports.buildProjection = buildProjection;
