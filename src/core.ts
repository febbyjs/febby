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
import * as Redis from "ioredis";
import assert from "assert";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { parseYAMLFile, processOpenApiSpecFile } from "./openapi";

const log = debug("febby:core");

/**
 * Febby implements [[IFebby]] interface
 */
export class Febby implements IFebby {
	// instance will hold febby object
	private static instance: Febby;

	// expressApp holds express application object
	expressApp = express();

	private appConfig: IAppConfig;
	// server - express server object
	server: Server;
	private mainRouter = Router();

	private redis: Redis.Redis;
	/**
	 * @param {IAppConfig} config - Febby application configuration
	 */
	constructor(config: IAppConfig) {
		log("Febby init started");
		if (Febby.instance) {
			return Febby.instance;
		}
		this.appConfig = validateAppConfig(config);

		/**
		 * if express app provided explicitly then use it else use created one.
		 */
		if (config.app) {
			this.expressApp = config.app;
		}

		if (this.appConfig.loadDefaultMiddlewareOnAppCreation) {
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

		log("app main router created");
		this.expressApp.use(this.appConfig.appBaseUrl!, this.mainRouter);

		log("app main router set");
		Febby.instance = this;

		if (this.appConfig.db) {
			this.connectDatabase();
		}
		if (this.appConfig.redis) {
			this.connectRedis();
		}
	}

	/**
	 * @private
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
	 * @private
	 */
	private async connectRedis() {
		log("redis connection init");
		assert(
			this.appConfig.redis === undefined,
			"redis config should be defined"
		);

		const conf = this.appConfig.redis;

		assert(conf.port === undefined, "redis port should be defined");
		assert(conf.host === undefined, "redis host should be defined");

		this.redis = new Redis.default(conf.port, conf.host, { ...conf });
		const monitor = await this.redis.monitor();
		monitor.on("monitor", function (time, args, source, database) {
			log(
				`time : ${time}, args : ${args}, source: ${source}, database: ${database}`
			);
		});
	}
	/**
	 * @deprecated - bootstrap will be deprecated in favor of start method for better async usability
	 * @param {function} cb - Callback function which will execute after application bootstrap
	 */
	bootstrap(cb?: Function): void {
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
	 * start - will start/bootstrap the application
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
	 * loadDefaultMiddlewares - morgan,body-parser,helmet and cors will load as default middlewares for your express app.
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
	 * loadOpenAPIConfigYAML - Will be used when you want to create your app using open-api specification YAML file.
	 * @param {string} path - path to open-api YAML spec file
	 * @param {IOpenApiOptions} options - Options hold all controller,middleware definitions and validation config
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
	 * route will register an url with handler and middlewares
	 * @param {IRouteConfig} routeConfig - Route configuration
	 */
	route(routeConfig: IRouteConfig): void {
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
	 * @deprecated - rarely used and can be achieved
	 * routes will register list of route configs.
	 * @param {Array<IRouteConfig>} list - Routes will be list of route config objects
	 */
	routes(list: Array<IRouteConfig>): void {
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
	 * middleware will register a middleware function to the specified route
	 * @param {Handler} middleware - Middleware function
	 * @param {Router} router - router
	 */
	middleware(middleware: Handler, router: Router = this.mainRouter): void {
		log("middleware registration start");
		assert(middleware !== undefined, "middleware should defined");

		router.use(middleware);
		log("middleware registration end");
	}
	/**
	 * @deprecated - will be removed from next version onwards
	 * middlewares will register list of middleware functions
	 * @param {Array<Handler>} list - list of middleware functions
	 * @param {Router} router - router
	 */
	middlewares(list: Handler[], router: Router = this.mainRouter): void {
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
	 * router will creates router object
	 * @param {string} url - router base URL
	 * @param {Router} router - parent router object
	 * @param {RouterOptions} options - router options
	 * @returns {Router} - Router instance
	 */
	router(url: string, router?: Router, options?: RouterOptions): Router {
		log("router registration start");
		router = router || this.mainRouter;
		options = options || {};
		const newRouter = Router(options);
		router.use(url, newRouter);
		log("router registration end");
		return newRouter;
	}
	/**
	 * crud will create create,update,get and delete operations on model
	 * @param {string} path Url
	 * @param {ICrudConfig} config Crud operation configuration
	 * @param {Model<Document, {}>} model Model object
	 * @param {Router} router Router object
	 */
	crud(
		path: string = "/",
		config: ICrudConfig,
		model: Model<Document, {}>,
		router: Router = this.mainRouter
	): void {
		log("crud registration start");
		const attachCollection = (
			req: Request,
			_res: Response,
			next: NextFunction
		) => {
			log("attaching model & redis");
			req.app.locals.collection = model;
			req.app.locals.febby = this;
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
					attachCollection,
					...(config.middlewares || []),
					...(config.post || []),
				],
				postHandler
			);
		}
	}

	/**
	 * model will register and creates mongoose model instance if not exist
	 * @param {string} name Model name
	 * @param {Schema} schema Model schema
	 * @returns {Model<Document & any>}
	 */
	model(name: string, schema?: Schema): Model<Document & any> {
		log(`model registration : ${name}`);
		const models = this.models();
		if (models[name]) {
			return models[name];
		}
		return mongoose.model(name, schema);
	}

	/**
	 * models will return model objects
	 * @returns { [index: string]: Model<Document & any> }
	 */
	models(): { [index: string]: Model<Document & any> } {
		log(`return models`);
		return mongoose.models;
	}

	/**
	 * @deprecated - use case is very rare so deprecating it
	 * finalMiddlewares will register all final middleware function
	 * @param {Array<NextFunction>} middlewares Middleware functions
	 */
	finalMiddlewares(middlewares: NextFunction[]): void {
		log(`final middlewares registration`);
		middlewares.forEach((middleware) => this.expressApp.use(middleware));
	}

	/**
	 * @deprecated - use case is very rare so deprecating it
	 * finalHandler will register final middleware function
	 * @param {NextFunction} middleware Middleware function
	 */
	finalHandler(middleware: NextFunction): void {
		log(`final handler registration`);
		this.expressApp.use(middleware);
	}

	/**
	 * @deprecated - use case is very rare so deprecating it
	 * shutdown will close the application
	 */
	shutdown(): void {
		log(`application shutdown`);
		this.server?.close();
	}

	/**
	 * @deprecated - use case is very rare so deprecating it
	 * closeConnection will close database connection
	 */
	closeConnection(): void {
		log(`closing database connection`);
		mongoose.connection.close();
	}

	/**
	 * @deprecated - use case is very rare so deprecating it
	 * closeDbConnection will close database connection
	 */
	closeDbConnection(): void {
		log(`closing database connection`);
		mongoose.connection.close();
	}
}
