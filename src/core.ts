/*!
 * Copyright(c) 2018-2022 Vasu Vanka
 * MIT Licensed
 */

/**
 * Module dependencies.
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
import util from "util";

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
	private appConfig!: IAppConfig;
	// server - express server object
	server!: Server;
	private mainRouter = Router();

	private redis: Redis.Redis | undefined;
	/**
	 * @param config Application configuration
	 */
	constructor(config?: IAppConfig) {
		log("Febby init started");
		if (Febby.instance) {
			return Febby.instance;
		}
		this.appConfig = validateAppConfig(config || ({} as IAppConfig));
		log("app config set");
		log(
			"mongoose set default values for useNewUrlParser,useFindAndModify,useCreateIndex,useUnifiedTopology"
		);
		log("express app created");
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
		if (this.appConfig?.db) {
			const options = Object.assign(
				{
					useUnifiedTopology: true,
					useNewUrlParser: true,
				},
				this.appConfig.db?.options
			);
			try {
				await mongoose.connect(this.appConfig.db?.url, options);
			} catch (error: any) {
				throw error;
			}
			log("db connection created");
		}
	}

	/**
	 * @private
	 */
	private async connectRedis() {
		log("redis connection init");
		const conf = this.appConfig?.redis;
		if (conf) {
			this.redis = new Redis.default(conf.port, conf.host, { ...conf });
			this.redis.monitor().then(function (monitor) {
				monitor.on("monitor", function (time, args, source, database) {
					log(time + " : " + util.inspect(args));
				});
			});
		}
	}
	/**
	 * bootstrap will start the application
	 * @param cb Callback function which will execute after application bootstrap
	 * @returns None
	 */
	bootstrap(cb?: Function): void {
		log("bootstrap init");
		this.server = createServer(this.expressApp);
		this.server.listen(this.appConfig?.port, () => {
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
	 * route will register an url with handler and middlewares
	 * @param routeConfig Route configuration
	 * @returns None
	 */
	route(routeConfig: IRouteConfig): void {
		log("route registartion start");
		register(
			routeConfig.router || this.mainRouter,
			routeConfig.method,
			routeConfig.path,
			routeConfig.middlewares || [],
			routeConfig.handler
		);
		log("route registartion end");
	}
	/**
	 * routes will register list of route configs.
	 * @param routesConfig Routes will be list of route config objects
	 * @returns None
	 */
	routes(routesConfig: IRouteConfig[]): void {
		log("routes registartion start");
		routesConfig.forEach((route) => this.route(route));
		log("routes registartion end");
	}
	/**
	 * middleware will register a middleware function to the specified route
	 * @param middleware Middleware function
	 * @param router Router object
	 * @returns None
	 */
	middleware(middleware: Handler, router?: Router): void {
		log("middleware registartion start");
		(router || this.mainRouter).use(middleware);
		log("middleware registartion end");
	}
	/**
	 * middlewares will register list of middleware functions
	 * @param middlewares list of middleware functions
	 * @param router Router object
	 * @returns None
	 */
	middlewares(middlewares: Handler[], router?: Router): void {
		log("middlewares registartion start");
		middlewares.forEach((middleware) =>
			this.middleware(middleware, router || this.mainRouter)
		);
		log("middlewares registartion end");
	}

	/**
	 * router will creates router object
	 * @param url Url
	 * @param router Router object
	 * @param options Router object options
	 * @returns Router
	 */
	router(url: string, router?: Router, options?: RouterOptions): Router {
		log("router registartion start");
		router = router || this.mainRouter;
		options = options || {};
		const newRouter = Router(options);
		router.use(url, newRouter);
		log("router registartion end");
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
		path: string,
		config: ICrudConfig,
		model: Model<Document, {}>,
		router?: Router
	): void {
		log("crud registartion start");
		router = router || this.mainRouter;
		path = path || "/";
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
			log("crud get registartion");
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
			log("crud put registartion");
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
			log("crud post registartion");
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
			log("crud get registartion");
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
			log("crud delete registartion");
		} else {
			if (config.get) {
				log("crud get registartion");
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
				log("crud put registartion");
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
				log("crud delete registartion");
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
				log("crud post registartion");
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
	}

	/**
	 * model will register and creates mongoose model instance if not exist
	 * @param name Model name
	 * @param schema Model schema
	 * @returns Model<Document & any>
	 */
	model(name: string, schema?: Schema): Model<Document & any> {
		log(`model registartion : ${name}`);
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
	 * finalMiddlewares will register all final middleware function
	 * @param middlewares Middleware functions
	 * @returns None
	 */
	finalMiddlewares(middlewares: Handler[]): void {
		log(`final middlewares registartion`);
		middlewares.forEach((middleware) => this.expressApp.use(middleware));
	}
	/**
	 * finalHandler will register final middleware function
	 * @param middleware Middleware function
	 * @returns None
	 */
	finalHandler(middleware: Handler): void {
		log(`final handler registartion`);
		this.expressApp.use(middleware);
	}
	/**
	 * shutdown will close the application
	 * @returns None
	 */
	shutdown(): void {
		log(`application shutdown`);
		this.server?.close();
	}
	/**
	 * @deprecated
	 * closeConnection will close database connection
	 * @returns None
	 */
	closeConnection(): void {
		log(`closing database connection`);
		mongoose.connection.close();
	}
	/**
	 * closeDbConnection will close database connection
	 * @returns None
	 */
	closeDbConnection(): void {
		log(`closing database connection`);
		mongoose.connection.close();
	}
}

export default Febby;
