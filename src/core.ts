/*!
 * febby
 * Copyright(c) 2018-2020 Vasu Vanka
 * MIT Licensed
 */
import express, { Router, NextFunction, RouterOptions, Request, Response, Handler } from 'express'
import { validateAppConfig, register, getByIdHandler, removeByIdHandler, putHandler, postHandler, getHandler, patchHandler } from './helper'
import { IAppConfig, IRouteConfig, ICrudConfig, GET, PUT, POST, DELETE, PATCH, IFebby } from './types'
import { createServer, Server } from 'http'
import * as debug from 'debug'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
/**
 * @private
 */
const log = debug.debug('febby')

/**
 * Febby implements IFebby interface 
 * See the [[IFebby]] interface for more details.
 */
export class Febby implements IFebby {
    /**
     * instance variable will hold Febby instance
     */
    private static instance: Febby;
    /**
     * expressApp holds express application object
     */
    expressApp = express();
    private appConfig: IAppConfig | undefined
    server: Server | undefined
    private mainRouter = Router()
    /**
     * @param config Application configuration
     */
    constructor(config?: IAppConfig) {
        log('Febby init started')
        if (Febby.instance) {
            return Febby.instance;
        }
        this.appConfig = validateAppConfig(config || {} as IAppConfig)
        log('app config set')
        mongoose.set('useNewUrlParser', true);
        mongoose.set('useFindAndModify', false);
        mongoose.set('useCreateIndex', true);
        mongoose.set('useUnifiedTopology', true);
        log('mongoose set default values for useNewUrlParser,useFindAndModify,useCreateIndex,useUnifiedTopology')
        log('express app created')
        const self = this;
        (async () => {
            if (self.appConfig?.db) {
                await this.connection(self.appConfig.db.url, self.appConfig.db.options || {});
                log('db connection created')
            }
        })()
        log('app default middlewares init started')
        this.expressApp.use(morgan('combined'))
        log('express app added morgan logger')
        this.expressApp.use(bodyParser.urlencoded({
            extended: false
        }))
        log('express app added bodyParser')
        this.expressApp.use(bodyParser.json())
        log('express app added bodyParser.json')
        this.expressApp.use(helmet())
        log('express app added helmet')
        this.expressApp.use(cors())
        log('express app added cors')
        log('app main router created')
        this.expressApp.use(this.appConfig.appBaseUrl!, this.mainRouter)
        log('final middlewares')
        log('app main router set')
        Febby.instance = this
    }

    /**
     * bootstrap will start the application
     * @param cb Callback function which will execute after application bootstrap
     */
    bootstrap(cb?: Function): void {
        log('bootstrap init')
        this.server = createServer(this.expressApp)
        this.server.listen(this.appConfig?.port, () => {
            log(`Server started on PORT ${JSON.stringify(this.server?.address())}`)
            if (cb) {
                cb()
            }
        })
        log('bootstrap end')
    }
    /**
     * route will register an url with handler and middlewares
     * @param routeConfig Route configuration
     */
    route(routeConfig: IRouteConfig): void {
        log('route registartion start')
        register(routeConfig.router || this.mainRouter, routeConfig.method, routeConfig.path, routeConfig.middlewares || [], routeConfig.handler)
        log('route registartion end')
    }
    /**
     * routes will register list of route configs.
     * @param routesConfig Routes will be list of route config objects
     */
    routes(routesConfig: IRouteConfig[]): void {
        log('routes registartion start')
        routesConfig.forEach(route => this.route(route))
        log('routes registartion end')
    }
    /**
     * middleware will register a middleware function to the specified route
     * @param middleware Middleware function
     * @param router Router object
     */
    middleware(middleware: Handler, router?: Router): void {
        log('middleware registartion start');
        (router || this.mainRouter).use(middleware)
        log('middleware registartion end')
    }
    /**
     * middlewares will register list of middleware functions
     * @param middlewares list of middleware functions
     * @param router Router object
     */
    middlewares(middlewares: Handler[], router?: Router): void {
        log('middlewares registartion start');
        middlewares.forEach(middleware => this.middleware(middleware, router || this.mainRouter))
        log('middlewares registartion end');
    }

    /**
     * router will creates router object
     * @param url Url 
     * @param router Router object
     * @param options Router object options
     */
    router(url: string, router?: Router, options?: RouterOptions): Router {
        log('router registartion start');
        router = router || this.mainRouter
        options = options || {}
        const newRouter = Router(options)
        router.use(url, newRouter)
        log('router registartion end');
        return newRouter
    }
    /**
     * crud will create create,update,get and delete operations on model
     * @param path Url
     * @param config Crud operation configuration
     * @param model Model object
     * @param router Router object
     */
    crud(path: string, config: ICrudConfig, model: mongoose.Model<mongoose.Document, {}>, router?: Router): void {
        log('crud registartion start');
        router = router || this.mainRouter
        path = path || '/'
        const attachCollection = (req: Request, _res: Response, next: NextFunction) => {
            log('attaching model');
            req.app.locals.collection = model
            next()
        }
        if (config.crud) {
            log('crud registration')
            register(router, GET, `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.get || [])], getByIdHandler)
            log('crud get registartion')
            register(router, PUT, `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.put || [])], putHandler)
            log('crud put registartion')
            register(router, POST, path, [attachCollection, ...(config.middlewares || []), ...(config.post || [])], postHandler)
            log('crud post registartion')
            register(router, GET, path, [attachCollection, ...(config.middlewares || []), ...(config.get || [])], getHandler)
            log('crud get registartion')
            register(router, DELETE, `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.delete || [])], removeByIdHandler)
            log('crud delete registartion')
        } else {
            if (config.get) {
                log('crud get registartion')
                register(router, GET, `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.get || [])], getByIdHandler)
                register(router, GET, path, [attachCollection, ...(config.middlewares || []), ...(config.get || [])], getHandler)
            }
            if (config.put) {
                log('crud put registartion')
                register(router, PUT, `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.put || [])], putHandler)
            }
            if (config.delete) {
                log('crud delete registartion')
                register(router, DELETE, path, [attachCollection, ...(config.middlewares || []), ...(config.delete || [])], removeByIdHandler)
            }
            if (config.post) {
                log('crud post registartion')
                register(router, POST, path, [attachCollection, ...(config.middlewares || []), ...(config.post || [])], postHandler)
            }
            if (config.patch) {
                log('crud patch registartion')
                register(router, PATCH, `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.post || [])], patchHandler)
            }
        }
    }

    /**
     * model will register and creates mongoose model instance
     * @param name Model name
     * @param schema Model schema
     */
    model(name: string, schema: mongoose.Schema): mongoose.Model<mongoose.Document, {}> {
        log(`model registartion : ${name}`)
        return mongoose.model(name, schema)
    }
    /**
     * models will return model object as key and schema pair
     */
    models(): { [index: string]: mongoose.Model<mongoose.Document, {}> } {
        log(`return models`)
        return mongoose.models
    }
    /**
     * finalMiddlewares will register all final middleware function
     * @param middlewares Middleware functions
     */
    finalMiddlewares(middlewares: Handler[]): void {
        log(`final middlewares registartion`)
        middlewares.forEach(middleware => this.expressApp.use(middleware))
    }
    /**
     * finalHandler will register final middleware function
     * @param middleware Middleware function
     */
    finalHandler(middleware: Handler): void {
        log(`final handler registartion`)
        this.expressApp.use(middleware)
    }
    /**
     * shutdown will close the application
     */
    shutdown(): void {
        log(`application shutdown`)
        this.server?.close()
    }
    /**
     * closeConnection will close database connection
     */
    closeConnection(): void {
        log(`closing database connection`)
        mongoose.connection.close()
    }
    /**
     * closeDbConnection will close database connection
     */
    closeDbConnection(): void {
        log(`closing database connection`)
        mongoose.connection.close()
    }
    /**
     * @private
     * @param url Database connection string
     * @param options Database config options
     */
    async connection(url: string, options?: mongoose.ConnectionOptions) {
        options = options || {};
        options.useNewUrlParser = true;
        try {
            await mongoose.connect(url, { useNewUrlParser: true, ...options });
        } catch (error) {
            throw error;
        }
    }
}
