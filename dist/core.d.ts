/*!
 * Copyright(c) 2018-2023 Vasu Vanka < vanka.vasu@gmail.com>
 * MIT Licensed
 */
/// <reference types="node" />
import { Router, RouterOptions, Handler } from "express";
import { IAppConfig, IRouteConfig, ICrudConfig, IFebby, IOpenApiOptions } from "./types";
import { Server } from "http";
import { Model, Document, Schema } from "mongoose";
export declare class Febby implements IFebby {
    private static instance;
    expressApp: import("express-serve-static-core").Express;
    private appConfig;
    server: Server;
    private mainRouter;
    private redis;
    constructor(config: IAppConfig);
    private connectDatabase;
    private connectRedis;
    bootstrap(cb?: Function): void;
    start(): Promise<void>;
    loadOpenAPIConfigYAML(path: string, options?: IOpenApiOptions): Promise<void>;
    route(routeConfig: IRouteConfig): void;
    routes(list: Array<IRouteConfig>): void;
    middleware(middleware: Handler, router?: Router): void;
    middlewares(list: Handler[], router?: Router): void;
    router(url: string, router?: Router, options?: RouterOptions): Router;
    crud(path: string, config: ICrudConfig, model: Model<Document, {}>, router?: Router): void;
    model(name: string, schema?: Schema): Model<Document & any>;
    models(): {
        [index: string]: Model<Document & any>;
    };
    finalMiddlewares(middlewares: Handler[]): void;
    finalHandler(middleware: Handler): void;
    shutdown(): void;
    closeConnection(): void;
    closeDbConnection(): void;
}
export default Febby;
