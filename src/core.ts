import express, {
	Router,
	NextFunction,
	RouterOptions,
	Request,
	Response,
	Handler,
} from "express";
import {
	validateAppConfig,
	register,
	getByIdHandler,
	removeByIdHandler,
	putHandler,
	postHandler,
	getHandler,
} from "./helper";
import {
	IAppConfig,
	IRouteConfig,
	ICrudConfig,
	GET,
	PUT,
	POST,
	DELETE,
	IFebby,
	IOpenApiOptions,
} from "./types";
import { createServer, Server } from "http";
import { debug } from "debug";
import morgan from "morgan";
import * as bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import mongoose, { Model, Document, Schema } from "mongoose";
import assert from "assert";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { parseYAMLFile, processOpenApiSpecFile } from "./openapi";
import { Redis, RedisOptions } from "ioredis";

const log = debug("febby:core");

/**
 * The Febby class represents the main application framework.
 * It initializes and configures the Express.js application and provides methods
 * for routing, middleware, and database connections.
 */
export class Febby implements IFebby {
	// instance will hold febby object
	protected static instance: Febby;

	// expressApp holds express application object
	expressApp = express();

	protected appConfig: IAppConfig;
	// server - express server object
	server: Server;
	protected mainRouter = Router();

	protected redis: Redis;
	/**
	 * Creates an instance of the Febby class.
	 * @param {IAppConfig} config - The application configuration.
	 * @returns {Febby} - An instance of the Febby class.
	 */
	constructor(config: IAppConfig) {
		log("Febby init started");
		if (Febby.instance) {
			return Febby.instance;
		}
		this.appConfig = validateAppConfig(config);

		if (config.app) {
			this.expressApp = config.app;
		}

		if (this.appConfig.loadDefaultMiddlewareOnAppCreation) {
			this.loadDefaultMiddlewares();
		}

		log("app main router created");
		this.expressApp.use(this.appConfig.appBaseUrl!, this.mainRouter);

		log("app main router set");
		Febby.instance = this;

		(async () => {
			if (this.appConfig.db) {
				await this.connectDatabase();
			}
			if (config.redis) {
				await this.connectRedis(config.redis);
			}
		})();
	}

	/**
	 * Connects to the MongoDB database using Mongoose.
	 */
	private async connectDatabase() {
		log("db connection init");

		assert.notStrictEqual(
			this.appConfig.db,
			undefined,
			"database config should be defined"
		);

		const options = Object.assign(
			{
				useUnifiedTopology: true,
				useNewUrlParser: true,
			},
			this.appConfig.db?.options
		);

		assert(
			this.appConfig.db.url !== undefined,
			"mongodb url - db.url should be defined"
		);

		mongoose.set("strictQuery", true);
		await mongoose.connect(this.appConfig.db.url, options);
		log("db connection created");
	}

	/**
	 * Connects to the Redis server using ioredis.
	 */
	private async connectRedis(redisOpts: RedisOptions) {
		log("redis connection init");

		this.redis = new Redis(redisOpts);
		const monitor = await this.redis.monitor();
		monitor.on("monitor", function (time, args, source, database) {
			log(
				`time : ${time}, args : ${args}, source: ${source}, database: ${database}`
			);
		});
	}
	/**
	 * @deprecated
	 * Initializes and starts the Febby application.
	 * @param {Function} [cb] - An optional callback function to be executed after the application has started.
	 */
	async bootstrap(cb?: Function): Promise<void> {
		log("bootstrap init");
		this.server = createServer(this.expressApp);
		assert(this.appConfig.port !== undefined, "app port should be defined");

		this.server.listen(this.appConfig.port, () => {
			log(
				`Server started on PORT ${JSON.stringify(
					this.server?.address()
				)}`
			);
			if (cb) {
				cb();
			}
		});
		log("bootstrap end");
	}

	/**
	 * Starts the Febby application.
	 * @returns {Promise<void>} - A promise that resolves once the application has started.
	 * @example
	 * await febby.start();
	 */
	async start(): Promise<void> {
		log("start init");
		assert(this.appConfig.port !== undefined, "app port should be defined");

		this.server = createServer(this.expressApp);
		this.server.listen(this.appConfig.port, () => {
			log(`Server started on PORT ${this.server?.address()}`);
		});
		log("start end");
	}

	/**
	 * Loads default middlewares such as morgan, body-parser, helmet, and cors for the express app.
	 * @returns {Promise<void>} - A promise that resolves once the middlewares are loaded.
	 * @example
	 * await febby.loadDefaultMiddlewares();
	 */
	async loadDefaultMiddlewares(): Promise<void> {
		log("app default middlewares init started");
		this.expressApp.use(morgan(this.appConfig.morgan || "combined"));
		log("express app added morgan logger");
		this.expressApp.use(
			bodyParser.urlencoded({
				extended: false,
			})
		);
		log("express app added bodyParser");
		this.expressApp.use(bodyParser.json());
		log("express app added bodyParser.json");
		this.expressApp.use(helmet(this.appConfig.helmet || {}));
		log("express app added helmet");
		this.expressApp.use(cors(this.appConfig.cors || {}));
		log("express app added cors");
	}
	/**
	 * Load OpenAPI configuration from a YAML file and register routes based on the specification.
	 */

	/**
	 * Load OpenAPI configuration from a YAML file and register routes based on the specification.
	 *
	 * This method is used when you want to create your application using an OpenAPI specification in YAML format. It reads the YAML file, parses it, and generates routes and controllers based on the specification.
	 * include x-controller,x-middlewares in each route definition for mapping.
	 *
	 * @param {string} path - The path to the OpenAPI YAML spec file.
	 * @param {IOpenApiOptions} options - An optional configuration object that holds controller, middleware definitions, and validation settings.
	 *
	 * @returns {Promise<void>} A Promise that resolves when the OpenAPI configuration is successfully loaded and routes are registered.
	 *
	 * @example
	 * // Load OpenAPI configuration from a YAML file and register routes with default options.
	 * await loadOpenAPIConfigYAML("/path/to/openapi.yaml");
	 *
	 * @example
	 * // Load OpenAPI configuration from a YAML file and customize controller and middleware options.
	 * const customOptions = {
	 *   controllers: {
	 *     UserController: (req, res) => { /* Custom UserController logic * / },
	 *   },
	 *   middleware: [
	 *     (req, res, next) => { /* Custom middleware logic * / },
	 *   ],
	 *    openApiValidatorOptions: {
	 *     validateApiSpec: true,
	 *     validateResponses: true,
	 *     validateRequests: true,
	 *   }
	 * };
	 * await loadOpenAPIConfigYAML("/path/to/openapi.yaml", customOptions);
	 *
	 * @example
	 * // Load OpenAPI configuration from a YAML file and provide controller and middleware options.
	 * const customOptions = {
	 *   controllers: path.join(__dirname, 'controllers'), // path to controller directory
	 *   middleware: path.join(__dirname, 'middlewares'), // path to middleware directory
	 *    openApiValidatorOptions: {
	 *     validateApiSpec: true,
	 *     validateResponses: true,
	 *     validateRequests: true,
	 *   }
	 * };
	 * await loadOpenAPIConfigYAML("/path/to/openapi.yaml", customOptions);
	 */

	async loadOpenAPIConfigYAML(
		path: string,
		options: IOpenApiOptions = {} as IOpenApiOptions
	): Promise<void> {
		log("loadOpenAPIConfigYAML init");
		if (!existsSync(path)) {
			log("file not found at " + path);
			throw new Error(
				`invalid file path to load openApi YAML file at "${path}"`
			);
		}

		// read open-api spec file
		const fileBuffer = await readFile(path, { encoding: "utf-8" });

		// parse YAML to Json
		const parsedJson = await parseYAMLFile(fileBuffer);

		const { pathnames, router } = await processOpenApiSpecFile(
			parsedJson,
			options
		);

		log(
			`base paths registered on server for OpenApi is ${pathnames.join(
				","
			)}`
		);

		this.expressApp.use(pathnames, router);

		log("loadOpenAPIConfigYAML end");
	}

	/**
	 * Registers a route with a specified path, HTTP method, handler function, and optional middlewares.
	 * @param {IRouteConfig} routeConfig - The route configuration.
	 * @returns {Promise<void>}
	 * @example
	 * febby.route({
	 *   method: "get",
	 *   path: "/api/users",
	 *   handler: (req, res) => {
	 *     // Handle GET request for /api/users
	 *   },
	 *   middlewares: [],
	 * });
	 */
	async route(routeConfig: IRouteConfig): Promise<void> {
		log("route registration start");
		const router = routeConfig.router || this.mainRouter;
		const middlewares = routeConfig.middlewares || [];
		register(
			router,
			routeConfig.method,
			routeConfig.path,
			middlewares,
			routeConfig.handler
		);
		log("route registration end");
	}

	/**
	 * @deprecated
	 * Registers multiple routes from an array of route configurations.
	 * @param {IRouteConfig[]} routesConfig - An array of route configurations.
	 * @returns {Promise<void>}
	 * @example
	 * febby.routes([
	 *   {
	 *     method: "get",
	 *     path: "/api/users",
	 *     handler: (req, res) => {
	 *       // Handle GET request for /api/users
	 *     },
	 *   },
	 *   {
	 *     method: "post",
	 *     path: "/api/users",
	 *     handler: (req, res) => {
	 *       // Handle POST request for /api/users
	 *     },
	 *   },
	 * ]);
	 */
	async routes(list: Array<IRouteConfig>): Promise<void> {
		log("routes registration start");

		assert(
			Array.isArray(list),
			"routes should be an array of route object definitions"
		);

		assert(
			(list as Array<IRouteConfig>).length !== 0,
			"should contain at least minimum of one route object definitions"
		);

		(list as Array<IRouteConfig>).forEach((route) => this.route(route));

		log("routes registration end");
	}

	/**
	 * Registers a middleware function to be used in the application.
	 * @param {Handler} middleware - The middleware function to be registered.
	 * @param {Router} [router] - The router to which the middleware should be attached (default is the main router).
	 * @returns {Promise<void>}
	 * @example
	 * febby.middleware((req, res, next) => {
	 *   // Custom middleware logic
	 *   next();
	 * });
	 */
	async middleware(
		middleware: Handler,
		router: Router = this.mainRouter
	): Promise<void> {
		log("middleware registration start");
		assert(middleware !== undefined, "middleware should defined");

		router.use(middleware);
		log("middleware registration end");
	}

	/**
	 * @deprecated
	 * Registers an array of middleware functions to be used in the application.
	 * @param {Handler[]} middlewares - An array of middleware functions to be registered.
	 * @param {Router} [router] - The router to which the middlewares should be attached (default is the main router).
	 * @returns {Promise<void>}
	 * @example
	 * febby.middlewares([
	 *   (req, res, next) => {
	 *     // Custom middleware 1 logic
	 *     next();
	 *   },
	 *   (req, res, next) => {
	 *     // Custom middleware 2 logic
	 *     next();
	 *   },
	 * ]);
	 */
	async middlewares(
		list: Handler[],
		router: Router = this.mainRouter
	): Promise<void> {
		log("middlewares registration start");

		assert(
			Array.isArray(list),
			"routes should be an array of route object definitions"
		);

		assert(
			(list as Array<Handler>).length !== 0,
			"should contain at least minimum of one route object definitions"
		);

		(list as Array<Handler>).forEach((middleware) =>
			this.middleware(middleware, router)
		);
		log("middlewares registration end");
	}

	/**
	 * Creates and returns a new router instance.
	 * @param {string} url - The base URL path for the new router.
	 * @param {Router} [router] - The parent router to which the new router should be attached (default is the main router).
	 * @param {RouterOptions} [options] - Options for configuring the new router.
	 * @returns {Promise<Router>} - The newly created router instance.
	 * @example
	 * const apiRouter = febby.router("/api");
	 */
	async router(
		url: string,
		router?: Router,
		options?: RouterOptions
	): Promise<Router> {
		log("router registration start");
		router = router || this.mainRouter;
		options = options || {};
		const newRouter = Router(options);
		router.use(url, newRouter);
		log("router registration end");
		return newRouter;
	}

	/**
	 * Configures CRUD (Create, Read, Update, Delete) operations for a model and registers corresponding routes.
	 * @param {string} [path="/"] - The base URL path for the CRUD operations.
	 * @param {ICrudConfig} config - The CRUD configuration.
	 * @param {mongoose.Model<mongoose.Document, {}>} model - The Mongoose model for the data.
	 * @param {Router} [router] - The router to which the CRUD routes should be registered (default is the main router).
	 * @returns {Promise<void>}
	 * @example
	 * febby.crud("/api/users", {
	 *   crud: true,
	 *   middlewares: [],
	 *   get: [GetMiddleware],
	 *   post: [],
	 *   put: [PutMiddleware],
	 *   delete: [],
	 * }, userModel);
	 */
	async crud(
		path: string = "/",
		config: ICrudConfig,
		model: Model<Document, {}>,
		router: Router = this.mainRouter
	): Promise<void> {
		log("crud registration start");
		const attachCollection = (
			req: Request,
			_res: Response,
			next: NextFunction
		) => {
			log("attaching model & redis");
			_res.app.set("collection", model);
			_res.app.set("febby", this);
			next();
		};

		if (config.crud) {
			log("crud registration");
			register(
				router,
				GET,
				`${path}/:id`,
				[
					attachCollection,
					...(config.middlewares || []),
					...(config.get || []),
				],
				getByIdHandler
			);

			log("crud get registration");
			register(
				router,
				PUT,
				`${path}/:id`,
				[
					express.json(),
					attachCollection,
					...(config.middlewares || []),
					...(config.put || []),
				],
				putHandler
			);

			log("crud post registration");
			register(
				router,
				POST,
				path,
				[
					express.json(),
					attachCollection,
					...(config.middlewares || []),
					...(config.post || []),
				],
				postHandler
			);

			log("crud get registration");
			register(
				router,
				GET,
				path,
				[
					attachCollection,
					...(config.middlewares || []),
					...(config.get || []),
				],
				getHandler
			);

			log("crud delete registration");
			register(
				router,
				DELETE,
				`${path}/:id`,
				[
					attachCollection,
					...(config.middlewares || []),
					...(config.delete || []),
				],
				removeByIdHandler
			);
			return;
		}

		if (config.get) {
			log("crud get registration");
			register(
				router,
				GET,
				`${path}/:id`,
				[
					attachCollection,
					...(config.middlewares || []),
					...(config.get || []),
				],
				getByIdHandler
			);
			register(
				router,
				GET,
				path,
				[
					attachCollection,
					...(config.middlewares || []),
					...(config.get || []),
				],
				getHandler
			);
		}
		if (config.put) {
			log("crud put registration");
			register(
				router,
				PUT,
				`${path}/:id`,
				[
					express.json(),
					attachCollection,
					...(config.middlewares || []),
					...(config.put || []),
				],
				putHandler
			);
		}
		if (config.delete) {
			log("crud delete registration");
			register(
				router,
				DELETE,
				path,
				[
					attachCollection,
					...(config.middlewares || []),
					...(config.delete || []),
				],
				removeByIdHandler
			);
		}
		if (config.post) {
			log("crud post registration");
			register(
				router,
				POST,
				path,
				[
					express.json(),
					attachCollection,
					...(config.middlewares || []),
					...(config.post || []),
				],
				postHandler
			);
		}
	}

	/**
	 * Defines a Mongoose model for data storage and retrieval.
	 * @param {string} name - The name of the Mongoose model.
	 * @param {mongoose.Schema} schema - The schema for the Mongoose model.
	 * @returns {Promise<mongoose.Model<mongoose.Document, {}>>} - The Mongoose model instance.
	 * @example
	 * const User = febby.model("User", userSchema);
	 */
	async model(name: string, schema?: Schema): Promise<Model<Document & any>> {
		log(`model registration : ${name}`);
		const models = this.models();
		if (models[name]) {
			return models[name];
		}
		return mongoose.model(name, schema);
	}

	/**
	 * Retrieves all defined Mongoose models.
	 * @returns {Promise<{ [index: string]: mongoose.Model<mongoose.Document, {}> }>} - An object containing all defined Mongoose models.
	 * @example
	 * const models = febby.models();
	 * const User = models["User"];
	 */
	async models(): Promise<{ [index: string]: Model<Document & any> }> {
		log(`return models`);
		return mongoose.models;
	}

	/**
	 * @deprecated
	 * Registers a final middleware function to be used at the end of the middleware chain.
	 * @param {NextFunction} middleware - The final middleware function to be registered.
	 * @return {Promise<void>}
	 * @example
	 * febby.finalHandler((req, res, next) => {
	 *   // Final middleware logic
	 *   next();
	 * });
	 */
	async finalMiddlewares(middlewares: NextFunction[]): Promise<void> {
		log(`final middlewares registration`);
		middlewares.forEach((middleware) => this.expressApp.use(middleware));
	}

	/**
	 * @deprecated - use case is very rare so deprecating it
	 * finalHandler will register final middleware function
	 * @param {NextFunction} middleware Middleware function
	 * @return {Promise<void>}
	 */
	async finalHandler(middleware: NextFunction): Promise<void> {
		log(`final handler registration`);
		this.expressApp.use(middleware);
	}

	/**
	 * @deprecated
	 * Shuts down the Febby application.
	 * @return {Promise<void>}
	 * @example
	 * febby.shutdown();
	 */
	async shutdown(): Promise<void> {
		log(`application shutdown`);
		this.server?.close();
	}

	/**
	 * @deprecated
	 * Closes the database connection used by the Febby application (alias for closeDbConnection).
	 * @return {Promise<void>}
	 * @example
	 * febby.closeConnection();
	 */
	async closeConnection(): Promise<void> {
		log(`closing database connection`);
		mongoose.connection.close();
	}

	/**
	 * @deprecated
	 * Closes the database connection used by the Febby application.
	 * @return {Promise<void>}
	 * @example
	 * febby.closeDbConnection();
	 */
	async closeDbConnection(): Promise<void> {
		log(`closing database connection`);
		mongoose.connection.close();
	}
}
