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
exports.parseYAMLFile = exports.processOpenApiSpecFile = void 0;
const express_1 = require("express");
const yaml = __importStar(require("js-yaml"));
const types_1 = require("./types");
const OpenApiValidator = __importStar(require("express-openapi-validator"));
const helper_1 = require("./helper");
const debug_1 = __importDefault(require("debug"));
const url_1 = require("url");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const log = debug_1.default.debug("febby:openapi");
async function fetchControllersFromDirectory(dirpath) {
    if (!(0, fs_1.existsSync)(dirpath)) {
        throw new Error(`
			controllers directory not found at "${dirpath}". provide valid controllers directory path
		`);
    }
    const controllerList = [];
    const list = await (0, promises_1.readdir)(dirpath);
    for (const filePath of list) {
        const file = await Promise.resolve(`${(0, path_1.join)(dirpath, filePath)}`).then(s => __importStar(require(s)));
        for (const name of Object.keys(file.default)) {
            controllerList.push({
                name,
                func: file.default[name],
            });
        }
    }
    return controllerList;
}
async function fetchMiddlewaresFromDirectory(dirpath) {
    if (!(0, fs_1.existsSync)(dirpath)) {
        throw new Error(`
			middlewares directory not found at "${dirpath}". provide valid middlewares directory path
		`);
    }
    const middlewareList = [];
    const list = await (0, promises_1.readdir)(dirpath);
    for (const filePath of list) {
        const file = await Promise.resolve(`${(0, path_1.join)(dirpath, filePath)}`).then(s => __importStar(require(s)));
        for (const name of Object.keys(file.default)) {
            middlewareList.push({
                name,
                func: file.default[name],
            });
        }
    }
    return middlewareList;
}
async function buildOpenApiRoutes(openApiJson, router, options) {
    var _a, _b, _c;
    const paths = openApiJson.paths;
    if (!paths) {
        throw new Error("open-api spec route paths not defined");
    }
    const middlewareMap = new Map();
    const controllerMap = new Map();
    if (Array.isArray(options.middlewares)) {
        const middlewares = options.middlewares || [];
        for (const middleware of middlewares) {
            middlewareMap.set(middleware.name, middleware.func);
        }
    }
    if (Array.isArray(options.controllers)) {
        const controllers = options.controllers || [];
        for (const controller of controllers) {
            controllerMap.set(controller.name, controller.func);
        }
    }
    if (typeof options.controllers === "string") {
        const controllers = await fetchControllersFromDirectory(options.controllers);
        for (const controller of controllers) {
            controllerMap.set(controller.name, controller.func);
        }
    }
    if (typeof options.middlewares === "string") {
        const middlewares = await fetchMiddlewaresFromDirectory(options.middlewares);
        for (const middleware of middlewares) {
            middlewareMap.set(middleware.name, middleware.func);
        }
    }
    router.use(OpenApiValidator.middleware({
        apiSpec: openApiJson,
        validateApiSpec: (_a = options === null || options === void 0 ? void 0 : options.openApiValidatorOptions) === null || _a === void 0 ? void 0 : _a.validateApiSpec,
        validateRequests: (_b = options === null || options === void 0 ? void 0 : options.openApiValidatorOptions) === null || _b === void 0 ? void 0 : _b.validateApiSpec,
        validateResponses: (_c = options === null || options === void 0 ? void 0 : options.openApiValidatorOptions) === null || _c === void 0 ? void 0 : _c.validateResponses,
    }));
    for (const path in paths) {
        const routeData = paths[path];
        for (const method in routeData) {
            const controllerInfo = routeData[method] || {};
            const controllerName = controllerInfo[types_1.XCONTROLLER];
            const middlewareNames = controllerInfo[types_1.XMIDDLEWARES] || [];
            if (!controllerName) {
                throw new Error(`missing controller definition for route: "${path}" , method: "${method}" in open-api spec file,\n
                    *help* -> you should add "x-controller" in each route definition \n

                    /pet:
                        put:
                        tags:
                            - pet
                        summary: Update an existing pet
                        description: Update an existing pet by Id
                        operationId: updatePet
                        x-controller: updatePetController
                        x-middleware:
                            - middleware1
                            - middleware2
                        requestBody:
                            description: Update an existent pet in the store
                            content:
                            application/json:
                                schema:
                                $ref: "#/components/schemas/Pet"
                            required: true
                        responses:
                            "200":
                            description: Successful operation               
                    `);
            }
            if (!controllerMap.has(controllerName)) {
                throw new Error(`missing controller definition for route: "${path}" , method: "${method}" with name "${controllerName}",\n
                    *help* -> you should add "${controllerName}" controller to config as below \n
                    febby.loadOpenAPIConfigYAML("path-to/open-api.yaml", {
                        middlewares: [],
                        controllers: [
                          {
                            name: "${controllerName}",
                            func: (req, res) => res.json({ message: "this is ${controllerName}" }),
                          },
                        ],
                      })
                    `);
            }
            const middlewares = [];
            for (const middlewareName of middlewareNames) {
                if (!middlewareMap.has(middlewareName)) {
                    throw new Error(`missing middleware definition for route: "${path}" , method: "${method}" with name "${middlewareName}", \n
                        *help* -> you should add "${middlewareName}" middleware to config as below \n
                        febby.loadOpenAPIConfigYAML("path-to/open-api.yaml", {
                            middlewares: [
                              {
                                name:"${middlewareName}",
                                func: (req, res,next) => {
                                    console.log("this is ${middlewareName}")
                                    return next()
                                }
                              }
                            ]
                          })
                        `);
                }
                middlewares.push(middlewareMap.get(middlewareName));
            }
            const expressPath = path.replace(/{/g, ":").replace(/}/g, "");
            const controller = controllerMap.get(controllerName);
            (0, helper_1.register)(router, method, expressPath, middlewares, controller);
            log(`registered: ${method} - ${expressPath} - ${controllerInfo["x-controller"]} - ${controllerInfo["x-middleware"]} - ${controllerInfo["operationId"]}`);
        }
    }
}
async function processOpenApiSpecFile(openApiJson, options) {
    log("processOpenApiSpecFile start");
    const router = (0, express_1.Router)();
    await buildOpenApiRoutes(openApiJson, router, options);
    if (!openApiJson.servers ||
        (Array.isArray(openApiJson.servers) && !openApiJson.servers.length)) {
        return { pathnames: ["/"], router };
    }
    const pathnames = openApiJson.servers
        .map((serviceUrl) => new url_1.URL(serviceUrl.url).pathname)
        .filter((value) => !!value);
    let errHandler = (err, req, res, next) => {
        res.status(err.status || 500).json({
            message: err.message,
            errors: err.errors,
        });
    };
    if (options.finalErrorHandler) {
        errHandler = options.finalErrorHandler;
    }
    router.use(errHandler);
    log("processOpenApiSpecFile end");
    return { pathnames, router };
}
exports.processOpenApiSpecFile = processOpenApiSpecFile;
async function parseYAMLFile(fileBuffer) {
    log("parseYAMLFile triggered");
    return yaml.load(fileBuffer);
}
exports.parseYAMLFile = parseYAMLFile;
//# sourceMappingURL=openapi.js.map