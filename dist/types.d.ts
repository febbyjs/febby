/*!
 * Copyright(c) 2018-2022 Vasu Vanka
 * MIT Licensed
 */
import mongoose, { ConnectOptions } from "mongoose";
import { Router, Handler, RouterOptions } from "express";
import { RedisOptions } from "ioredis";
export declare const GET = "get";
export declare const PUT = "put";
export declare const POST = "post";
export declare const DELETE = "delete";
export declare const PATCH = "patch";
export declare const appBaseUrl = "/";
export declare const BAD_REQUEST = 400;
export declare const INTERNAL_SERVER_ERROR = 500;
export declare const OK = 200;
export declare const CREATED = 201;
export type PathParams = string | RegExp | Array<string | RegExp>;
export type HttpMethod = "get" | "put" | "post" | "delete" | "patch" | "head" | "options";
export interface IAppConfig {
    port: number;
    db: {
        url: string;
        options?: ConnectOptions;
    };
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
    bootstrap(cb?: Function): void;
    start(): Promise<void>;
    model(name: string, schema: mongoose.Schema): mongoose.Model<mongoose.Document, {}>;
    finalHandler(middleware: Handler): void;
    models(): {
        [index: string]: mongoose.Model<mongoose.Document, {}>;
    };
    crud(path: string, config: ICrudConfig, model: any, router?: Router): void;
    router(url: string, router?: Router, options?: RouterOptions): Router;
    middlewares(middlewares: Handler[], router?: Router): void;
    middleware(middleware: Handler, router?: Router): void;
    routes(routesConfig: IRouteConfig[]): void;
    route(routeConfig: IRouteConfig): void;
    shutdown(): void;
    closeDbConnection(): void;
    closeConnection(): void;
}
