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
        mongoose.set('useNewUrlParser', true);
        mongoose.set('useFindAndModify', false);
        mongoose.set('useCreateIndex', true);
        mongoose.set('useUnifiedTopology', true);
        this.expressApp = express();
        const self = this;
        (async () => {
            if (self.appConfig.db) {
                await this.connection(self.appConfig.db.url, self.appConfig.db.options || {});
            }
        })()
        febbyDebug('Express app created')
        febbyDebug('app default middlewares init started')
        this.expressApp.use(morgan('combined'))
        this.expressApp.use(bodyParser.urlencoded({
            extended: false
        }))
        this.expressApp.use(bodyParser.json())
        this.expressApp.use(helmet())
        this.expressApp.use(cors())
        febbyDebug('app default middlewares init ended')
        this.mainRouter = Router()
        febbyDebug('mainRouter configured')
        this.expressApp.use(this.appConfig.appBaseUrl, this.mainRouter)
    }

    bootstrap(cb?: Function): void {
        this.server = createServer(this.expressApp)
        this.server.listen(this.appConfig.port, () => {
            console.log(`Server started on PORT ${JSON.stringify(this.server?.address())}`)
            if (cb) {
                cb()
            }
        })
    }

    route(routeConfig: IRouteConfig): void {
        register(routeConfig.router || this.mainRouter, routeConfig.method, routeConfig.path, routeConfig.middlewares || [], routeConfig.handler)
    }

    routes(routesConfig: IRouteConfig[]): void {
        routesConfig.forEach(route => this.route(route))
    }

    middleware(middleware: NextFunction, router?: Router): void {
        (router || this.mainRouter).use(middleware)
    }

    middlewares(middlewares: NextFunction[], router?: Router): void {
        middlewares.forEach(middleware => this.middleware(middleware, router || this.mainRouter))
    }

    router(url: string, router?: Router, options?: RouterOptions): Router {
        router = router || this.mainRouter
        options = options || {}
        const newRouter = Router(options)
        router.use(url, newRouter)
        return newRouter
    }

    crud(path: string, config: ICrudConfig, model: mongoose.Model<mongoose.Document, {}>, router?: Router): void {
        router = router || this.mainRouter
        path = path || '/'
        const attachCollection = (req: Request, _res: Response, next: NextFunction) => {
            req.app.locals.collection = model
            next()
        }
        if (config.crud) {
            register(router, 'get', `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.get || [])], getByIdHandler)
            register(router, 'put', `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.put || [])], putHandler)
            register(router, 'patch', `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.patch || [])], patchHandler)
            register(router, 'post', path, [attachCollection, ...(config.middlewares || []), ...(config.post || [])], postHandler)
            register(router, 'get', path, [attachCollection, ...(config.middlewares || []), ...(config.get || [])], getHandler)
            register(router, 'delete', `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.delete || [])], removeByIdHandler)
        } else {
            if (config.get) {
                register(router, 'get', `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.get || [])], getByIdHandler)
                register(router, 'get', path, [attachCollection, ...(config.middlewares || []), ...(config.get || [])], getHandler)
            }
            if (config.put) {
                register(router, 'put', `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.put || [])], putHandler)
            }
            if (config.delete) {
                register(router, 'delete', path, [attachCollection, ...(config.middlewares || []), ...(config.delete || [])], removeByIdHandler)
            }
            if (config.post) {
                register(router, 'post', path, [attachCollection, ...(config.middlewares || []), ...(config.post || [])], postHandler)
            }
            if (config.patch) {
                register(router, 'patch', `${path}/:id`, [attachCollection, ...(config.middlewares || []), ...(config.post || [])], patchHandler)
            }
        }
    }

    model(name: string, schema: mongoose.Schema): mongoose.Model<mongoose.Document, {}> {
        return mongoose.model(name, schema)
    }

    models(): { [index: string]: mongoose.Model<mongoose.Document, {}> } {
        return mongoose.models
    }

    finalMiddlewares(middlewares: NextFunction[]): void {
        middlewares.forEach(middleware => this.expressApp.use(middleware))
    }

    finalHandler(middleware: NextFunction): void {
        this.expressApp.use(middleware)
    }

    shutdown(): void {
        this.server?.close()
    }

    closeConnection(): void {
        mongoose.connection.close()
    }

    closeDbConnection(): void {
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
    model(name: string, schema: mongoose.Schema): mongoose.Model<mongoose.Document, {}>
}