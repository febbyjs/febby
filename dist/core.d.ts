/// <reference types="node" />
/*!
 * febby
 * Copyright(c) 2018-2020 Vasu Vanka
 * MIT Licensed
 */
import { Router, RouterOptions, Handler } from 'express';
import { IAppConfig, IRouteConfig, ICrudConfig, IFebby } from './types';
import { Server } from 'http';
import mongoose from 'mongoose';
/**
 * Febby implements IFebby interface
 * See the [[IFebby]] interface for more details.
 */
export declare class Febby implements IFebby {
    /**
     * instance variable will hold Febby instance
     */
    private static instance;
    /**
     * expressApp holds express application object
     */
    expressApp: import("express-serve-static-core").Express;
    private appConfig;
    server: Server | undefined;
    private mainRouter;
    /**
     * @param config Application configuration
     */
    constructor(config?: IAppConfig);
    /**
     * bootstrap will start the application
     * @param cb Callback function which will execute after application bootstrap
     */
    bootstrap(cb?: Function): void;
    /**
     * route will register an url with handler and middlewares
     * @param routeConfig Route configuration
     */
    route(routeConfig: IRouteConfig): void;
    /**
     * routes will register list of route configs.
     * @param routesConfig Routes will be list of route config objects
     */
    routes(routesConfig: IRouteConfig[]): void;
    /**
     * middleware will register a middleware function to the specified route
     * @param middleware Middleware function
     * @param router Router object
     */
    middleware(middleware: Handler, router?: Router): void;
    /**
     * middlewares will register list of middleware functions
     * @param middlewares list of middleware functions
     * @param router Router object
     */
    middlewares(middlewares: Handler[], router?: Router): void;
    /**
     * router will creates router object
     * @param url Url
     * @param router Router object
     * @param options Router object options
     */
    router(url: string, router?: Router, options?: RouterOptions): Router;
    /**
     * crud will create create,update,get and delete operations on model
     * @param path Url
     * @param config Crud operation configuration
     * @param model Model object
     * @param router Router object
     */
    crud(path: string, config: ICrudConfig, model: mongoose.Model<mongoose.Document, {}>, router?: Router): void;
    /**
     * model will register and creates mongoose model instance
     * @param name Model name
     * @param schema Model schema
     */
    model(name: string, schema: mongoose.Schema): mongoose.Model<mongoose.Document, {}>;
    /**
     * models will return model object as key and schema pair
     */
    models(): {
        [index: string]: mongoose.Model<mongoose.Document, {}>;
    };
    /**
     * finalMiddlewares will register all final middleware function
     * @param middlewares Middleware functions
     */
    finalMiddlewares(middlewares: Handler[]): void;
    /**
     * finalHandler will register final middleware function
     * @param middleware Middleware function
     */
    finalHandler(middleware: Handler): void;
    /**
     * shutdown will close the application
     */
    shutdown(): void;
    /**
     * closeConnection will close database connection
     */
    closeConnection(): void;
    /**
     * closeDbConnection will close database connection
     */
    closeDbConnection(): void;
    /**
     * @private
     * @param url Database connection string
     * @param options Database config options
     */
    connection(url: string, options?: mongoose.ConnectionOptions): Promise<void>;
}
