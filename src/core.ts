import express, { Router, NextFunction, RouterOptions, Request, Response } from 'express'
import { validateAppConfig, register, getByIdHandler, removeByIdHandler, putHandler, postHandler, getHandler, patchHandler } from './helper'
import { IAppConfig, IRouteConfig, ICrudConfig } from './types'
import { createServer, Server } from 'http'
import debugUtil from 'debug'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'

const febbyDebug = debugUtil('febby:Febby')


export class Febby implements IFebby {
    expressApp: any
    appConfig: IAppConfig
    server: Server | undefined
    mainRouter: Router
    constructor(config: IAppConfig) {
        febbyDebug('Febby init started')
        this.appConfig = validateAppConfig(config)
        febbyDebug('app config set')
        mongoose.set('useNewUrlParser', true);
        mongoose.set('useFindAndModify', false);
        mongoose.set('useCreateIndex', true);
        mongoose.set('useUnifiedTopology', true);
        febbyDebug('mongoose set default values for useNewUrlParser,useFindAndModify,useCreateIndex,useUnifiedTopology')
        this.expressApp = express();
        febbyDebug('express app created')
        const self = this;
        (async () => {
            if (self.appConfig.db) {
                await this.connection(self.appConfig.db.url, self.appConfig.db.options || {});
                febbyDebug('db connection created created')
            }
        })()
        febbyDebug('app default middlewares init started')
        this.expressApp.use(morgan('combined'))
        febbyDebug('express app added morgan logger')
        this.expressApp.use(bodyParser.urlencoded({
            extended: false
        }))
        febbyDebug('express app added bodyParser')
        this.expressApp.use(bodyParser.json())
        febbyDebug('express app added bodyParser.json')
        this.expressApp.use(helmet())
        febbyDebug('express app added helmet')
        this.expressApp.use(cors())
        febbyDebug('express app added cors')
        febbyDebug('app default middlewares init ended')
        this.mainRouter = Router()
        febbyDebug('app main router created')
        this.expressApp.use(this.appConfig.appBaseUrl, this.mainRouter)
        febbyDebug('app main router set')
    }

    bootstrap(cb?: Function): void {
        febbyDebug('bootstrap init')
        this.server = createServer(this.expressApp)
        this.server.listen(this.appConfig.port, () => {
            febbyDebug('app port set and listening')
            console.log(`Server started on PORT ${JSON.stringify(this.server?.address())}`)
            if (cb) {
                cb()
            }
        })
        febbyDebug('bootstrap end')
    }

    route(routeConfig: IRouteConfig): void {
        febbyDebug('route registartion start')
        register(routeConfig.router || this.mainRouter, routeConfig.method, routeConfig.path, routeConfig.middlewares || [], routeConfig.handler)
        febbyDebug('route registartion end')
    }

    routes(routesConfig: IRouteConfig[]): void {
        febbyDebug('routes registartion start')
        routesConfig.forEach(route => this.route(route))
        febbyDebug('routes registartion end')
    }

    middleware(middleware: NextFunction, router?: Router): void {
        febbyDebug('middleware registartion start');
        (router || this.mainRouter).use(middleware)
        febbyDebug('middleware registartion end')
    }

    middlewares(middlewares: NextFunction[], router?: Router): void {
        febbyDebug('middlewares registartion start');
        middlewares.forEach(middleware => this.middleware(middleware, router || this.mainRouter))
        febbyDebug('middlewares registartion end');
    }

    router(url: string, router?: Router, options?: RouterOptions): Router {
        febbyDebug('router registartion start');
        router = router || this.mainRouter
        options = options || {}
        const newRouter = Router(options)
        router.use(url, newRouter)
        febbyDebug('router registartion end');
        return newRouter
    }

    crud(path: string, config: ICrudConfig, model: mongoose.Model<mongoose.Document, {}>, router?: Router): void {
        febbyDebug('crud registartion start');
        router = router || this.mainRouter
        path = path || '/'
        const attachCollection = (req: Request, _res: Response, next: NextFunction) => {
            febbyDebug('attaching model');
            req.app.locals.collection = model
            next()
        }
        if (config.crud) {
            febbyDebug('crud registration')
            register(router, 'get', `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.get || [])], getByIdHandler)
            febbyDebug('crud get registartion')
            register(router, 'put', `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.put || [])], putHandler)
            febbyDebug('crud put registartion')
            register(router, 'patch', `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.patch || [])], patchHandler)
            febbyDebug('crud patch registartion')
            register(router, 'post', path, [attachCollection, ...(config.middlewares || []), ...(config.post || [])], postHandler)
            febbyDebug('crud post registartion')
            register(router, 'get', path, [attachCollection, ...(config.middlewares || []), ...(config.get || [])], getHandler)
            febbyDebug('crud get registartion')
            register(router, 'delete', `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.delete || [])], removeByIdHandler)
            febbyDebug('crud delete registartion')
        } else {
            if (config.get) {
                febbyDebug('crud get registartion')
                register(router, 'get', `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.get || [])], getByIdHandler)
                register(router, 'get', path, [attachCollection, ...(config.middlewares || []), ...(config.get || [])], getHandler)
            }
            if (config.put) {
                febbyDebug('crud put registartion')
                register(router, 'put', `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.put || [])], putHandler)
            }
            if (config.delete) {
                febbyDebug('crud delete registartion')
                register(router, 'delete', path, [attachCollection, ...(config.middlewares || []), ...(config.delete || [])], removeByIdHandler)
            }
            if (config.post) {
                febbyDebug('crud post registartion')
                register(router, 'post', path, [attachCollection, ...(config.middlewares || []), ...(config.post || [])], postHandler)
            }
            if (config.patch) {
                febbyDebug('crud patch registartion')
                register(router, 'patch', `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.post || [])], patchHandler)
            }
        }
    }

    model(name: string, schema: mongoose.Schema): mongoose.Model<mongoose.Document, {}> {
        febbyDebug(`model registartion : ${name}`)
        return mongoose.model(name, schema)
    }

    models(): { [index: string]: mongoose.Model<mongoose.Document, {}> } {
        febbyDebug(`return models`)
        return mongoose.models
    }

    finalMiddlewares(middlewares: NextFunction[]): void {
        febbyDebug(`final middlewares registartion`)
        middlewares.forEach(middleware => this.expressApp.use(middleware))
    }

    finalHandler(middleware: NextFunction): void {
        febbyDebug(`final handler registartion`)
        this.expressApp.use(middleware)
    }

    shutdown(): void {
        febbyDebug(`application shutdown`)
        this.server?.close()
    }

    closeConnection(): void {
        febbyDebug(`closing database connection`)
        mongoose.connection.close()
    }

    closeDbConnection(): void {
        febbyDebug(`closing database connection`)
        mongoose.connection.close()
    }

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


interface IFebby {
    bootstrap(cb?: Function): void
    model(name: string, schema: mongoose.Schema): mongoose.Model<mongoose.Document, {}>
    finalHandler(middleware: NextFunction): void
    models(): { [index: string]: mongoose.Model<mongoose.Document, {}> }
    crud(path: string, config: ICrudConfig, model: any, router?: Router): void
    router(url: string, router?: Router, options?: RouterOptions): Router
    middlewares(middlewares: NextFunction[], router?: Router): void
    middleware(middleware: NextFunction, router?: Router): void
    routes(routesConfig: IRouteConfig[]): void
    route(routeConfig: IRouteConfig): void
    bootstrap(cb?: Function): void
    shutdown(): void
    closeDbConnection(): void
    closeConnection(): void
    model(name: string, schema: mongoose.Schema): mongoose.Model<mongoose.Document, {}>
}