/// <reference types="node" />
import { Router, NextFunction, RouterOptions, Handler } from "express";
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
    bootstrap(cb?: Function): Promise<void>;
    start(): Promise<void>;
    loadDefaultMiddlewares(): Promise<void>;
    loadOpenAPIConfigYAML(path: string, options?: IOpenApiOptions): Promise<void>;
    route(routeConfig: IRouteConfig): Promise<void>;
    routes(list: Array<IRouteConfig>): Promise<void>;
    middleware(middleware: Handler, router?: Router): Promise<void>;
    middlewares(list: Handler[], router?: Router): Promise<void>;
    router(url: string, router?: Router, options?: RouterOptions): Promise<Router>;
    crud(path: string, config: ICrudConfig, model: Model<Document, {}>, router?: Router): Promise<void>;
    model(name: string, schema?: Schema): Promise<Model<Document & any>>;
    models(): Promise<{
        [index: string]: Model<Document & any>;
    }>;
    finalMiddlewares(middlewares: NextFunction[]): Promise<void>;
    finalHandler(middleware: NextFunction): Promise<void>;
    shutdown(): Promise<void>;
    closeConnection(): Promise<void>;
    closeDbConnection(): Promise<void>;
}
