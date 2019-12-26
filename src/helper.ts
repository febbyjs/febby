import { IAppConfig } from "./types"
import { NextFunction, Handler, Request, Response } from "express"

export function validateAppConfig(config: IAppConfig): IAppConfig {
    config.appBaseUrl = config.appBaseUrl || '/api'
    return config
}

export function register(router: any, method: string, path: string, middlewares: Handler[], handler: Handler): void {
    router[method](path, middlewares, handler)
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const id = req.params.id
    const projection = req.query.projection || {}
    let result, err
    try {
        result = await req.app.locals.collection.findById(id, projection)
    } catch (error) {
        const code = 400
        err = {
            error,
            code
        }
    }
    res.status(result ? 200 : 400).send(result || err)
}

export async function removeByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const _id = req.params.id
    let result, err
    try {
        result = await req.app.locals.collection.findOneAndRemove({
            _id
        })
    } catch (error) {
        const code = 400
        err = {
            error,
            code
        }
    }
    res.status(result ? 200 : 400).send(result || err)
}

export async function postHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const {
        body
    } = req
    let result, err
    try {
        const coll = new req.app.locals.collection(body)
        result = await coll.save()
    } catch (error) {
        const code = 400
        err = {
            error,
            code
        }
    }
    res.status(result ? 200 : 400).send(result || err)
}

export async function putHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const {
        body
    } = req
    const _id = req.params.id
    let result, err
    try {
        result = await req.app.locals.collection.findOneAndUpdate({
            _id
        }, {
            $set: body
        }, {
            new: true
        })
    } catch (error) {
        const code = 400
        err = {
            error,
            code
        }
    }
    res.status(result ? 200 : 400).send(result || err)
}

export async function patchHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const {
        body
    } = req
    const _id = req.params.id
    let result, err
    try {
        result = await req.app.locals.collection.findOneAndUpdate({
            _id
        }, {
            $set: body
        }, {
            new: false
        })
    } catch (error) {
        const code = 400
        err = {
            error,
            code
        }
    }
    res.status(result ? 200 : 400).send(result || err)
}

export async function getHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const projection = req.query.projection || {};
    const query = req.query.query || {}
    let docs, err, count = 0;
    try {
        count = await req.app.locals.collection.count(query)
        docs = await req.app.locals.collection.find(query, projection, {
            skip,
            limit
        }) || [];
    } catch (error) {
        const code = 400;
        err = {
            error,
            code
        };
    }
    res.status(docs.length > 0 ? 200 : 400).send({ docs, count } || err);
}