import mongoose, { ConnectOptions } from "mongoose";
import express, { Router, Handler, RouterOptions, NextFunction } from "express";
import { RedisOptions } from "ioredis";
export type HttpMethod = "get" | "put" | "post" | "delete" | "patch" | "head" | "options";
export declare const GET = "get";
export declare const PUT = "put";
export declare const POST = "post";
export declare const DELETE = "delete";
export declare const PATCH = "patch";
export declare const appBaseUrl = "/";
export declare const XMIDDLEWARES = "x-middlewares";
export declare const XCONTROLLER = "x-controller";
export declare const BAD_REQUEST = 400;
export declare const INTERNAL_SERVER_ERROR = 500;
export declare const OK = 200;
export declare const CREATED = 201;
export interface IAppConfig {
    port: number;
    db?: {
        url: string;
        options?: ConnectOptions;
    };
    loadDefaultMiddlewareOnAppCreation?: boolean;
    serviceName?: string;
    hostname?: string;
    version?: string;
    bodyParser?: any;
    cors?: any;
    clusterMode?: boolean;
    appBaseUrl?: string;
    helmet?: any;
    morgan?: string;
    redis?: RedisOptions;
    app?: express.Express;
}
export interface ICrudConfig {
    crud: boolean;
    middlewares?: Handler[];
    get?: Handler[];
    post?: Handler[];
    put?: Handler[];
    delete?: Handler[];
}
export interface IRouteConfig {
    router?: Router;
    method: HttpMethod;
    path: string;
    middlewares?: Handler[];
    handler: Handler;
    bodySchema?: any;
}
export interface IFebby {
    bootstrap(cb?: Function): Promise<void>;
    start(): Promise<void>;
    model(name: string, schema: mongoose.Schema): Promise<mongoose.Model<mongoose.Document, {}>>;
    finalHandler(middleware: NextFunction): Promise<void>;
    models(): Promise<{
        [index: string]: mongoose.Model<mongoose.Document, {}>;
    }>;
    crud(path: string, config: ICrudConfig, model: any, router?: Router): Promise<void>;
    router(url: string, router?: Router, options?: RouterOptions): Promise<Router>;
    middlewares(middlewares: NextFunction[], router?: Router): Promise<void>;
    middleware(middleware: NextFunction, router?: Router): Promise<void>;
    routes(routesConfig: IRouteConfig[]): Promise<void>;
    route(routeConfig: IRouteConfig): Promise<void>;
    shutdown(): Promise<void>;
    closeDbConnection(): Promise<void>;
    closeConnection(): Promise<void>;
    loadOpenAPIConfigYAML(path: string, options?: IOpenApiOptions): Promise<void>;
    loadDefaultMiddlewares(): Promise<void>;
}
export interface IMiddleware {
    name: string;
    func: Handler;
}
export interface IController extends IMiddleware {
}
export interface IOpenApiValidatorOptions {
    validateApiSpec?: boolean;
    validateResponses?: boolean;
    validateRequests?: boolean;
}
export interface IOpenApiOptions {
    middlewares: IMiddleware[];
    controllers: IController[];
    openApiValidatorOptions: IOpenApiValidatorOptions;
}
