/*!
 * Copyright(c) 2018-2023 Vasu Vanka < vanka.vasu@gmail.com>
 * MIT Licensed
 */

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
} from "./types";
import { createServer, Server } from "http";
import { debug } from "debug";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import mongoose, { Model, Document, Schema } from "mongoose";
import * as Redis from "ioredis";
import assert from "assert";

const log = debug("febby:core");

/**
 * Creates febby application instance.
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
	 * @param config Application configuration
	 */
	constructor(config: IAppConfig) {
		log("Febby init started");
		if (Febby.instance) {
			return Febby.instance;
		}
		this.appConfig = validateAppConfig(config);

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
		log("app main router created");
		this.expressApp.use(this.appConfig.appBaseUrl!, this.mainRouter);
		log("final middlewares");
		log("app main router set");
		Febby.instance = this;
		this.connectDatabase();
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
	 * bootstrap will start the application
	 * @param cb Callback function which will execute after application bootstrap
	 * @returns None
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
	 * start will start the application
	 * @param cb Callback function which will execute after application bootstrap
	 * @returns None
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
	 * route will register an url with handler and middlewares
	 * @param routeConfig Route configuration
	 * @returns None
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
	 * @param routesConfig[] Routes will be list of route config objects
	 * @returns None
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
	 * @param middleware Middleware function
	 * @param router Router object
	 * @returns None
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
	 * @param middlewares[] list of middleware functions
	 * @param router Router object
	 * @returns None
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
	 * @param url Url
	 * @param router Router object
	 * @param options Router object options
	 * @returns Router
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
	 * @param path Url
	 * @param config Crud operation configuration
	 * @param model Model object
	 * @param router Router object
	 * @returns None
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
	 * @param name Model name
	 * @param schema Model schema
	 * @returns Model<Document & any>
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
	 * @param middlewares Middleware functions
	 * @returns None
	 */
	finalMiddlewares(middlewares: Handler[]): void {
		log(`final middlewares registration`);
		middlewares.forEach((middleware) => this.expressApp.use(middleware));
	}

	/**
	 * @deprecated - use case is very rare so deprecating it
	 * finalHandler will register final middleware function
	 * @param middleware Middleware function
	 * @returns None
	 */
	finalHandler(middleware: Handler): void {
		log(`final handler registration`);
		this.expressApp.use(middleware);
	}

	/**
	 * @deprecated - use case is very rare so deprecating it
	 * shutdown will close the application
	 * @returns None
	 */
	shutdown(): void {
		log(`application shutdown`);
		this.server?.close();
	}

	/**
	 * @deprecated - use case is very rare so deprecating it
	 * closeConnection will close database connection
	 * @returns None
	 */
	closeConnection(): void {
		log(`closing database connection`);
		mongoose.connection.close();
	}

	/**
	 * @deprecated - use case is very rare so deprecating it
	 * closeDbConnection will close database connection
	 * @returns None
	 */
	closeDbConnection(): void {
		log(`closing database connection`);
		mongoose.connection.close();
	}
}

export default Febby;
