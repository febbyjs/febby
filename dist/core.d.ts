/// <reference types="node" />
/*!
 * febby
 * Copyright(c) 2018-2020 Vasu Vanka
 * MIT Licensed
 */
import { Router, RouterOptions, Handler } from 'express';
import { IAppConfig, IRouteConfig, ICrudConfig, IFebby } from './types';
import { Server } from 'http';
import { Model, Document, Schema } from 'mongoose';
/**
 * Febby implements IFebby interface
 * See the [[IFebby]] interface for more details.
 */
export declare class Febby implements IFebby {
    private static instance;
    expressApp: import("express-serve-static-core").Express;
    private appConfig;
    server: Server;
    private mainRouter;
    /**
     * @param config Application configuration
     */
    constructor(config?: IAppConfig);
    /**
     * @private
     */
    private connectToDb;
    /**
     * bootstrap will start the application
     * @param cb Callback function which will execute after application bootstrap
     * @returns None
     */
    bootstrap(cb?: Function): void;
    /**
     * route will register an url with handler and middlewares
     * @param routeConfig Route configuration
     * @returns None
     */
    route(routeConfig: IRouteConfig): void;
    /**
     * routes will register list of route configs.
     * @param routesConfig Routes will be list of route config objects
     * @returns None
     */
    routes(routesConfig: IRouteConfig[]): void;
    /**
     * middleware will register a middleware function to the specified route
     * @param middleware Middleware function
     * @param router Router object
     * @returns None
     */
    middleware(middleware: Handler, router?: Router): void;
    /**
     * middlewares will register list of middleware functions
     * @param middlewares list of middleware functions
     * @param router Router object
     * @returns None
     */
    middlewares(middlewares: Handler[], router?: Router): void;
    /**
     * router will creates router object
     * @param url Url
     * @param router Router object
     * @param options Router object options
     * @returns Router
     */
    router(url: string, router?: Router, options?: RouterOptions): Router;
    /**
     * crud will create create,update,get and delete operations on model
     * @param path Url
     * @param config Crud operation configuration
     * @param model Model object
     * @param router Router object
     * @returns None
     */
    crud(path: string, config: ICrudConfig, model: Model<Document, {}>, router?: Router): void;
    /**
     * model will register and creates mongoose model instance if not exist
     * @param name Model name
     * @param schema Model schema
     * @returns Model<Document, {}>
     */
    model(name: string, schema?: Schema): Model<Document, {}>;
    /**
     * models will return model objects
     * @returns { [index: string]: Model<Document, {}> }
     */
    models(): {
        [index: string]: Model<Document, {}>;
    };
    /**
     * finalMiddlewares will register all final middleware function
     * @param middlewares Middleware functions
     * @returns None
     */
    finalMiddlewares(middlewares: Handler[]): void;
    /**
     * finalHandler will register final middleware function
     * @param middleware Middleware function
     * @returns None
     */
    finalHandler(middleware: Handler): void;
    /**
     * shutdown will close the application
     * @returns None
     */
    shutdown(): void;
    /**
     * @deprecated
     * closeConnection will close database connection
     * @returns None
     */
    closeConnection(): void;
    /**
     * closeDbConnection will close database connection
     * @returns None
     */
    closeDbConnection(): void;
}
export default Febby;
