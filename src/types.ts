import mongoose, { ConnectOptions } from "mongoose";
import express, { Router, Handler, RouterOptions, NextFunction } from "express";
import { RedisOptions } from "ioredis";

export const GET = "get";
export const PUT = "put";
export const POST = "post";
export const DELETE = "delete";
export const PATCH = "patch";
export const appBaseUrl = "/";
export const XCONTROLLER = "x-controller";
export const XMIDDLEWARES = "x-middlewares";

export const BAD_REQUEST = 400;
export const INTERNAL_SERVER_ERROR = 500;
export const OK = 200;
export const CREATED = 201;
export type PathParams = string | RegExp | Array<string | RegExp>;

/**
 * HTTP methods
 */
export type HttpMethod =
	| "get"
	| "put"
	| "post"
	| "delete"
	| "patch"
	| "head"
	| "options";

/**
 * IAppConfig interface implements Application configuration
 */
export interface IAppConfig {
	port: number;
	db?: {
		url: string;
		options?: ConnectOptions;
	};
	loadDefaultMiddlewareOnAppCreation?: boolean;
	/**
	 * serviceName - will be used to identify service with given name and used across app
	 */
	serviceName?: string;
	hostname?: string;
	version?: string;
	bodyParser?: any;
	cors?: any;
	clusterMode?: boolean;
	appBaseUrl?: PathParams;
	helmet?: any;
	morgan?: string;
	redis?: RedisOptions;
	app?: express.Express;
}

/**
 * ICrudConfig interface implements crud configuration
 */
export interface ICrudConfig {
	crud: boolean;
	middlewares?: Handler[];
	get?: Handler[];
	post?: Handler[];
	put?: Handler[];
	delete?: Handler[];
}

/**
 * IRouteConfig interface implements route configuration
 */
export interface IRouteConfig {
	router?: Router;
	method: HttpMethod;
	path: string;
	middlewares?: Handler[];
	handler: Handler;
	bodySchema?: any;
}

/**
 * Used for [[Febby]] constructor
 */
export interface IFebby {
	bootstrap(cb?: Function): void;
	start(): Promise<void>;
	model(
		name: string,
		schema: mongoose.Schema
	): mongoose.Model<mongoose.Document, {}>;
	finalHandler(middleware: NextFunction): void;
	models(): { [index: string]: mongoose.Model<mongoose.Document, {}> };
	crud(path: string, config: ICrudConfig, model: any, router?: Router): void;
	router(url: string, router?: Router, options?: RouterOptions): Router;
	middlewares(middlewares: NextFunction[], router?: Router): void;
	middleware(middleware: NextFunction, router?: Router): void;
	routes(routesConfig: IRouteConfig[]): void;
	route(routeConfig: IRouteConfig): void;
	shutdown(): void;
	closeDbConnection(): void;
	closeConnection(): void;
	loadOpenAPIConfigYAML(
		path: string,
		options?: IOpenApiOptions
	): Promise<void>;
	loadDefaultMiddlewares(): Promise<void>;
}
/**
 * IMiddleware interface represent next function and its name, it will be used to config route level middleware.
 */
export interface IMiddleware {
	// function name will be used to map middleware on api level
	name: string;
	// middleware function
	func: Handler;
}

/**
 * IMiddleware interface represent next function and its name, it will be used to config route level middleware.
 */
export interface IController extends IMiddleware {}

export interface IOpenApiValidatorOptions {
	validateApiSpec?: boolean;
	validateResponses?: boolean;
	validateRequests?: boolean;
}

// openapi yaml file config options
export interface IOpenApiOptions {
	middlewares: IMiddleware[];
	controllers: IController[];
	openApiValidatorOptions: IOpenApiValidatorOptions;
}
