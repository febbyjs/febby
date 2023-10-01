import { Handler, Router } from "express";
import * as yaml from "js-yaml";
import {
	HttpMethod,
	IOpenApiOptions,
	XCONTROLLER,
	XMIDDLEWARES,
} from "./types";
import * as OpenApiValidator from "express-openapi-validator";
import { register } from "./helper";
import debug from "debug";
import { URL } from "url";

const log = debug.debug("febby:openapi");

/**
 * buildOpenApiRoutes - Will stitch routes and controller together
 * @param {object} openApiJson - parsed JSON from YAML file
 * @param {Router} router - router to register paths and controllers
 * @param {IOpenApiOptions} options
 */
function buildOpenApiRoutes(
	openApiJson: any,
	router: Router,
	options: IOpenApiOptions
) {
	const paths = openApiJson.paths;
	if (!paths) {
		throw new Error("open-api spec route paths not defined");
	}

	const middlewareMap: Map<string, Handler> = new Map();
	const controllerMap: Map<string, Handler> = new Map();

	const middlewares = options.middlewares || [];
	for (const middleware of middlewares) {
		middlewareMap.set(middleware.name, middleware.func);
	}

	const controllers = options.controllers || [];
	for (const controller of controllers) {
		controllerMap.set(controller.name, controller.func);
	}

	router.use(
		OpenApiValidator.middleware({
			apiSpec: openApiJson,
			validateApiSpec: options?.openApiValidatorOptions?.validateApiSpec,
			validateRequests: options?.openApiValidatorOptions?.validateApiSpec,
			validateResponses:
				options?.openApiValidatorOptions?.validateResponses,
		})
	);

	for (const path in paths) {
		const routeData = paths[path];
		for (const method in routeData) {
			const controllerInfo = routeData[method] || {};
			const controllerName = controllerInfo[XCONTROLLER];
			const middlewareNames = controllerInfo[XMIDDLEWARES] || [];

			if (!controllerName) {
				throw new Error(
					`missing controller definition for route: "${path}" , method: "${method}" in open-api spec file,\n
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
                    `
				);
			}

			if (!controllerMap.has(controllerName)) {
				throw new Error(
					`missing controller definition for route: "${path}" , method: "${method}" with name "${controllerName}",\n
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
                    `
				);
			}

			const middlewares = [];
			for (const middlewareName of middlewareNames) {
				if (!middlewareMap.has(middlewareName)) {
					throw new Error(
						`missing middleware definition for route: "${path}" , method: "${method}" with name "${middlewareName}", \n
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
                        `
					);
				}
				middlewares.push(middlewareMap.get(middlewareName));
			}

			const expressPath = path.replace(/{/g, ":").replace(/}/g, "");
			const controller = controllerMap.get(controllerName);

			register(
				router,
				method as HttpMethod,
				expressPath,
				middlewares,
				controller
			);

			log(
				`registered: ${method} - ${expressPath} - ${controllerInfo["x-controller"]} - ${controllerInfo["x-middleware"]} - ${controllerInfo["operationId"]}`
			);
		}
	}
}

/**
 * processOpenApiSpecFile - creates open api router and returns path and router
 * @param {object} openApiJson
 * @param {IOpenApiOptions} options
 * @returns {Promise<{ pathnames: string[]; router: Router }>}
 */
export async function processOpenApiSpecFile(
	openApiJson: any,
	options: IOpenApiOptions
): Promise<{ pathnames: string[]; router: Router }> {
	log("processOpenApiSpecFile start");

	const router = Router();

	buildOpenApiRoutes(openApiJson, router, options);

	if (
		!openApiJson.servers ||
		(Array.isArray(openApiJson.servers) && !openApiJson.servers.length)
	) {
		return { pathnames: ["/"], router };
	}

	const pathnames = openApiJson.servers
		.map((serviceUrl) => new URL(serviceUrl.url).pathname)
		.filter((value) => !!value);

	router.use((err, req, res, next) => {
		res.status(err.status || 500).json({
			message: err.message,
			errors: err.errors,
		});
	});

	log("processOpenApiSpecFile end");

	return { pathnames, router };
}

/**
 * parseYAMLFile - parses YAML string and returns JSON object
 * @param {string} fileBuffer - file content
 * @returns {Promise<object>}
 */
export async function parseYAMLFile(fileBuffer: string): Promise<object> {
	log("parseYAMLFile triggered");
	return yaml.load(fileBuffer) as object;
}
