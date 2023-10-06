import mongoose, { ConnectOptions } from "mongoose";
import express, { Router, Handler, RouterOptions, NextFunction } from "express";
import { RedisOptions } from "ioredis";

/**
 * HTTP methods supported by Febby.
 */
export type HttpMethod =
	| "get"
	| "put"
	| "post"
	| "delete"
	| "patch"
	| "head"
	| "options";

export const GET = "get";
export const PUT = "put";
export const POST = "post";
export const DELETE = "delete";
export const PATCH = "patch";
export const appBaseUrl = "/";
export const XMIDDLEWARES = "x-middlewares";
export const XCONTROLLER = "x-controller";

export const BAD_REQUEST = 400;
export const INTERNAL_SERVER_ERROR = 500;
export const OK = 200;
export const CREATED = 201;

/**
 * Configuration options for the Febby application.
 *
 * @example
 * const appConfig: IAppConfig = {
 *   port: 3000,
 *   db: {
 *     url: "mongodb://localhost/mydb",
 *     options: { useNewUrlParser: true }
 *   },
 *   loadDefaultMiddlewareOnAppCreation: true,
 *   serviceName: "my-service",
 *   hostname: "localhost",
 *   version: "1.0.0",
 *   bodyParser: {},
 *   cors: {},
 *   clusterMode: false,
 *   appBaseUrl: "/api",
 *   helmet: {},
 *   morgan: {},
 *   redis: { host: "localhost", port: 6379 }
 * };
 */
export interface IAppConfig {
	/**
	 * The port on which the Febby application will listen.
	 */
	port: number;
	/**
	 * Database configuration options for connecting to MongoDB.
	 */
	db?: {
		/**
		 * The URL of the MongoDB database.
		 */
		url: string;
		/**
		 * Additional options for configuring the MongoDB connection.
		 */
		options?: ConnectOptions;
	};
	/**
	 * Whether to load default middlewares when creating the app instance.
	 */
	loadDefaultMiddlewareOnAppCreation?: boolean;
	/**
	 * The name of the service, used for identification.
	 */
	serviceName?: string;
	/**
	 * The hostname of the service.
	 */
	hostname?: string;
	/**
	 * The version of the service.
	 */
	version?: string;
	/**
	 * Middleware for parsing request bodies (e.g., JSON, URL-encoded).
	 */
	bodyParser?: any;
	/**
	 * Middleware for handling Cross-Origin Resource Sharing (CORS).
	 */
	cors?: any;
	/**
	 * Whether to run the application in cluster mode.
	 */
	clusterMode?: boolean;
	/**
	 * The base URL for the application.
	 */
	appBaseUrl?: string;
	/**
	 * Middleware for enhancing application security (e.g., Helmet).
	 */
	helmet?: any;
	/**
	 * Logger middleware (e.g., Morgan) configuration.
	 */
	morgan?: string;
	/**
	 * Configuration options for Redis, used for caching.
	 */
	redis?: RedisOptions;
	/**
	 * Existing Express application instance to use.
	 */
	app?: express.Express;
}

/**
 * Configuration options for CRUD operations in Febby.
 *
 * @example
 * const crudConfig: ICrudConfig = {
 *   crud: true,
 *   middlewares: [authMiddleware],
 *   get: [validateGetParams],
 *   post: [validatePostData],
 *   put: [validatePutData],
 *   delete: [validateDeleteParams]
 * };
 */
export interface ICrudConfig {
	/**
	 * Indicates whether CRUD operations are enabled.
	 */
	crud: boolean;
	/**
	 * Array of middleware functions to apply globally.
	 */
	middlewares?: Handler[];
	/**
	 * Middleware functions for the GET method.
	 */
	get?: Handler[];
	/**
	 * Middleware functions for the POST method.
	 */
	post?: Handler[];
	/**
	 * Middleware functions for the PUT method.
	 */
	put?: Handler[];
	/**
	 * Middleware functions for the DELETE method.
	 */
	delete?: Handler[];
}

/**
 * Configuration options for defining routes in Febby.
 *
 * @example
 * const routeConfig: IRouteConfig = {
 *   method: "get",
 *   path: "/users",
 *   middlewares: [authMiddleware],
 *   handler: getUserHandler
 * };
 */
export interface IRouteConfig {
	/**
	 * Optional Express router to use for routes.
	 */
	router?: Router;
	/**
	 * HTTP method for the route (e.g., 'get', 'post').
	 */
	method: HttpMethod;
	/**
	 * The URL path for the route.
	 */
	path: string;
	/**
	 * Middleware functions to apply to this route.
	 */
	middlewares?: Handler[];
	/**
	 * The request handler function for this route.
	 */
	handler: Handler;
	/**
	 * Schema for validating the request body.
	 */
	bodySchema?: any;
}

/**
 * The main interface representing the Febby application.
 */
export interface IFebby {
	/**
	 * Initializes and boots up the Febby application.
	 *
	 * @param {Function} cb - Callback function to run after booting.
	 */
	bootstrap(cb?: Function): Promise<void>;

	/**
	 * Starts the Febby application.
	 *
	 * @returns {Promise<void>} A promise that resolves when the app is started.
	 */
	start(): Promise<void>;

	/**
	 * Creates a Mongoose model for a specific name and schema.
	 *
	 * @param {string} name - The name of the model.
	 * @param {mongoose.Schema} schema - The schema for the model.
	 *
	 * @returns {mongoose.Model<mongoose.Document, {}>} The created Mongoose model.
	 */
	model(
		name: string,
		schema: mongoose.Schema
	): Promise<mongoose.Model<mongoose.Document, {}>>;

	/**
	 * Adds a final request handler middleware to the application.
	 *
	 * @param {NextFunction} middleware - The final request handler middleware.
	 */
	finalHandler(middleware: NextFunction): Promise<void>;

	/**
	 * Retrieves all registered Mongoose models.
	 *
	 * @returns {Object} An object containing all registered Mongoose models.
	 */
	models(): Promise<{
		[index: string]: mongoose.Model<mongoose.Document, {}>;
	}>;

	/**
	 * Configures CRUD operations for a specific path and model.
	 *
	 * @param {string} path - The URL path for CRUD operations.
	 * @param {ICrudConfig} config - Configuration for CRUD operations.
	 * @param {any} model - The Mongoose model for CRUD operations.
	 * @param {Router} router - Optional Express router to use for routes.
	 */
	crud(
		path: string,
		config: ICrudConfig,
		model: any,
		router?: Router
	): Promise<void>;

	/**
	 * Creates and configures an Express router for a specific URL path.
	 *
	 * @param {string} url - The URL path to create a router for.
	 * @param {Router} router - Optional Express router instance.
	 * @param {RouterOptions} options - Optional router options.
	 *
	 * @returns {Router} The created Express router.
	 */
	router(
		url: string,
		router?: Router,
		options?: RouterOptions
	): Promise<Router>;

	/**
	 * Adds multiple middlewares to an Express router.
	 *
	 * @param {NextFunction[]} middlewares - An array of middleware functions.
	 * @param {Router} router - Optional Express router to add middlewares to.
	 */
	middlewares(middlewares: NextFunction[], router?: Router): Promise<void>;

	/**
	 * Adds a single middleware to an Express router.
	 *
	 * @param {NextFunction} middleware - The middleware function.
	 * @param {Router} router - Optional Express router to add the middleware to.
	 */
	middleware(middleware: NextFunction, router?: Router): Promise<void>;

	/**
	 * Registers multiple route configurations with the application.
	 *
	 * @param {IRouteConfig[]} routesConfig - An array of route configurations.
	 */
	routes(routesConfig: IRouteConfig[]): Promise<void>;

	/**
	 * Registers a single route configuration with the application.
	 *
	 * @param {IRouteConfig} routeConfig - A single route configuration.
	 */
	route(routeConfig: IRouteConfig): Promise<void>;

	/**
	 * Shuts down the Febby application.
	 */
	shutdown(): Promise<void>;

	/**
	 * Closes the database connection used by the application.
	 */
	closeDbConnection(): Promise<void>;

	/**
	 * Closes the application's connection.
	 */
	closeConnection(): Promise<void>;

	/**
	 * Loads an OpenAPI specification from a YAML file and configures the application.
	 *
	 * @param {string} path - The path to the OpenAPI YAML spec file.
	 * @param {IOpenApiOptions} options - Options for controllers, middlewares, and validation.
	 *
	 * @returns {Promise<void>} A promise that resolves when the configuration is loaded.
	 */
	loadOpenAPIConfigYAML(
		path: string,
		options?: IOpenApiOptions
	): Promise<void>;

	/**
	 * Loads the default middlewares for the Febby application.
	 *
	 * @returns {Promise<void>} A promise that resolves when the default middlewares are loaded.
	 */
	loadDefaultMiddlewares(): Promise<void>;
}

/**
 * IMiddleware interface represents a middleware function with a name.
 */
export interface IMiddleware {
	/**
	 * The name of the middleware, used for identification.
	 */
	name: string;
	/**
	 * The middleware function.
	 */
	func: Handler;
}

/**
 * IController interface represents a controller function with a name.
 */
export interface IController extends IMiddleware {}

/**
 * IOpenApiValidatorOptions interface represents options for OpenAPI validation.
 */
export interface IOpenApiValidatorOptions {
	/**
	 * Whether to validate the OpenAPI specification.
	 */
	validateApiSpec?: boolean;
	/**
	 * Whether to validate responses.
	 */
	validateResponses?: boolean;
	/**
	 * Whether to validate requests.
	 */
	validateRequests?: boolean;
}

/**
 * Configuration options for OpenAPI support in Febby.
 *
 * @example
 * const authMiddleware = { name: 'authMiddleware', func: (req,res,next)=>next()}
 * const userController = { name: 'userController', func: (req,res)=> res.send('userController')}
 * const openApiOptions: IOpenApiOptions = {
 *   middlewares: [authMiddleware],
 *   controllers: [userController],
 *   openApiValidatorOptions: {
 *     validateApiSpec: true,
 *     validateResponses: true,
 *     validateRequests: true
 *   }
 * };
 */
export interface IOpenApiOptions {
	/**
	 * An array of middleware functions to apply or provide middlewares directory path
	 */
	middlewares: IMiddleware[] | string;
	/**
	 * An array of controller functions to apply or provide controllers directory path
	 */
	controllers: IController[] | string;
	/**
	 * Options for OpenAPI validation.
	 */
	openApiValidatorOptions: IOpenApiValidatorOptions;
	/**
	 * finalErrorHandler will be configured after routes registered so you can customize errors and response structure.
	 * default to below handler
	 * @example
	 * router.use((err, req, res, next) => {
	 *  		res.status(err.status || 500).json({
	 * 	 	message: err.message,
	 *	 	errors: err.errors,
	 *	 });
	 * });
	 */
	finalErrorHandler?: Handler;
}
