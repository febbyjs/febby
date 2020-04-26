/*!
 * febby
 * Copyright(c) 2018-2020 Vasu Vanka
 * MIT Licensed
 */
import mongoose, { ConnectionOptions } from 'mongoose';
import { Router, Handler, RouterOptions } from 'express';
export declare const GET = "get";
export declare const PUT = "put";
export declare const POST = "post";
export declare const DELETE = "delete";
export declare const PATCH = "patch";
export declare const appBaseUrl = "/";
export declare const BADREQUEST = 400;
export declare const INTERNALSERVERERROR = 500;
export declare const OK = 200;
export declare const CREATED = 201;
export declare type PathParams = string | RegExp | Array<string | RegExp>;
/**
 * HTTP methods
 */
export declare type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'patch' | 'head' | 'options' | 'copy';
/**
 * IAppConfig interface implements Application configuration
 */
export interface IAppConfig {
    port: number;
    hostname?: string;
    version?: string;
    bodyParser?: any;
    cors?: any;
    db?: {
        url: string;
        options?: ConnectionOptions;
    };
    clusterMode?: boolean;
    appBaseUrl?: PathParams;
    helmet?: any;
    morgan?: string;
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
    patch?: Handler[];
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
 * IFebby interface implements all required features to support faster application development
 */
export interface IFebby {
    bootstrap(cb?: Function): void;
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
