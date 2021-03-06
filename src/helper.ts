/*!
 * febby
 * Copyright(c) 2018-2020 Vasu Vanka
 * MIT Licensed
 */
import { IAppConfig, appBaseUrl, HttpMethod, OK, BADREQUEST, CREATED } from "./types"
import { NextFunction, Handler, Request, Response, Router } from "express"
import * as debug from "debug"

const log = debug.debug('febby:helper')
/**
 * @private
 * @param config Validates application configuration
 */
export function validateAppConfig(config: IAppConfig): IAppConfig {
    config.appBaseUrl = config.appBaseUrl || appBaseUrl
    return config
}

/**
 * @private
 * Route Registration
 * @param router Application Router
 * @param method Http methgod
 * @param path Url path
 * @param middlewares Middleware functions
 * @param handler request handler
 */
export function register(router: Router, method: HttpMethod, path: string, middlewares: Handler[], handler: Handler): void {
    log(`Register route :: ${method} :: ${path}`)
    try {
        router[method](path, middlewares, handler)
    } catch (error) {
        // give more context of error
        throw error
    }
}

/**
 * getByIdHandler - Get document by id, supports projection now. just pass projection in query params. ex: projection=name+mobile+email
 * @param req Request 
 * @param res Response
 * @param next NextFunction
 */
export async function getByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const id = req.params.id
    const projection = (req.query.projection || "").length > 0 ? buildProjection(req.query.projection) : {}
    try {
        const result = await req.app.locals.collection.findById(id, projection)
        res.status(OK).send(result)
    } catch (error) {
        const code = 500
        res.status(code).send({
            error: (error || {}).message,
            code
        });
    }
}

/**
 * removeByIdHandler - Remove document by id
 * @param req Request 
 * @param res Response
 * @param next NextFunction
 */
export async function removeByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const _id = req.params.id
    try {
        const result = await req.app.locals.collection.findOneAndRemove({
            _id
        })
        res.status(OK).send(result)
    } catch (error) {
        const code = 500
        res.status(code).send({
            error: (error || {}).message,
            code
        });
    }
}


/**
 * postHandler - Creates Document
 * @param req Request 
 * @param res Response
 * @param next NextFunction
 */
export async function postHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const {
        body
    } = req
    try {
        const coll = new req.app.locals.collection(body)
        const result = await coll.save()
        res.status(CREATED).send(result)
    } catch (error) {
        const code = 500
        res.status(code).send({
            error: (error || {}).message,
            code
        })
    }
}

/**
 * putHandler - Updates Document
 * @param req Request 
 * @param res Response
 * @param next NextFunction
 */
export async function putHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const {
        body
    } = req
    const _id = req.params.id
    try {
        const result = await req.app.locals.collection.findOneAndUpdate({
            _id
        }, {
            $set: body
        }, {
            new: false
        })
        res.status(OK).send(result)
    } catch (error) {
        const code = 500
        res.status(code).send({
            error: (error || {}).message,
            code
        })
    }
}

/**
 * patchHandler - Updates Document
 * @param req Request 
 * @param res Response
 * @param next NextFunction
 */
export async function patchHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const {
        body
    } = req
    const _id = req.params.id
    try {
        const result = await req.app.locals.collection.findOneAndUpdate({
            _id
        }, {
            $set: body
        }, {
            new: false
        })
        res.status(OK).send(result)
    } catch (error) {
        const code = 500
        res.status(code).send({
            error: (error || {}).message,
            code
        })
    }
}

/**
 * getHandler - Get Documents, supports projection , skip and limit. skip defaulted to 0 and limit defaulted to 10
 * @param req Request 
 * @param res Response
 * @param next NextFunction
 */
export async function getHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const projection = (req.query.projection || "").length > 0 ? buildProjection(req.query.projection) : {}
    try {
        const query = req.query.query ? JSON.parse(req.query.query) : {}
        const results = await Promise.all([req.app.locals.collection.count(query), await req.app.locals.collection.find(query, projection, {
            skip,
            limit
        })])
        res.status(200).send({ value: results[1], count: results[0] })
    } catch (error) {
        const code = 500
        res.status(code).send({
            error: (error || {}).message,
            code
        })
    }
}

/**
 * buildProjection - builds Projection
 * @param projection projection string represents fields with + .Example : 'first_name+last_name+email'
 */
export function buildProjection(projection: string = ''): string {
    return projection.replace('+', ' ')
}