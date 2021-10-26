/*!
 * Copyright(c) 2018-2021 Vasu Vanka
 * MIT Licensed
 */
import { IAppConfig, appBaseUrl, HttpMethod, OK, CREATED } from "./types";
import { NextFunction, Handler, Request, Response, Router } from "express";
import * as debug from "debug";

const log = debug.debug("febby:helper");
/**
 * @private
 * @param config Validates application configuration
 */
export function validateAppConfig(config: IAppConfig): IAppConfig {
	config.appBaseUrl = config.appBaseUrl || appBaseUrl;
	config.serviceName = config.serviceName || "febby";
	return config;
}

function buildRedisKey(serviceName: string, functionName: string, key: string) {
	return `${serviceName}.${functionName}.${key}`;
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
export function register(
	router: Router,
	method: HttpMethod,
	path: string,
	middlewares: Handler[],
	handler: Handler
): void {
	log(`Register route :: ${method} :: ${path}`);
	try {
		router[method](path, middlewares, handler);
	} catch (error: unknown) {
		// give more context of error
		throw error;
	}
}

/**
 * getByIdHandler - Get document by id, supports projection now. just pass projection in query params. ex: projection=name+mobile+email
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export async function getByIdHandler(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const id = req.params.id;
	log(`getByIdHandler :: ${req.app.locals.collection.modelName} :: ${id}`);
	const projection = req.query.projection
		? buildProjection(req.query.projection as string)
		: "";
	let doc;
	if (req.app.locals.febby.redis) {
		doc = await req.app.locals.febby.redis.get(
			buildRedisKey(
				req.app.locals.febby.appConfig.serviceName,
				req.app.locals.collection.modelName,
				id
			)
		);
	}
	try {
		if (doc) {
			const parsedDoc = JSON.parse(doc);
			const keys = projection ? (projection as string).split(" ") : [];
			let result = {} as any;
			if (keys.length > 0) {
				for (const key of keys) {
					if (parsedDoc[key]) {
						result[key] = parsedDoc[key];
					}
				}
			} else {
				result = parsedDoc;
			}
			res.status(OK).send(result);
			return;
		}
	} catch (error) {
		const code = 500;
		res.status(code).send({
			error: (error as any).message,
			code,
		});
	}
	try {
		const result = await req.app.locals.collection.findById(
			id,
			projection || {}
		);
		if (result && req.app.locals.febby.redis) {
			await req.app.locals.febby.redis.set(
				buildRedisKey(
					req.app.locals.febby.appConfig.serviceName,
					req.app.locals.collection.modelName,
					id
				),
				JSON.stringify(result)
			);
		}
		res.status(OK).send(result);
	} catch (error: unknown) {
		const code = 500;
		res.status(code).send({
			error: (error as any).message,
			code,
		});
	}
}

/**
 * removeByIdHandler - Remove document by id
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export async function removeByIdHandler(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const _id = req.params.id;
	log(
		`removeByIdHandler :: ${req.app.locals.collection.modelName} :: ${_id}`
	);
	try {
		if (req.app.locals.febby.redis) {
			await req.app.locals.febby.redis.del(
				buildRedisKey(
					req.app.locals.febby.appConfig.serviceName,
					req.app.locals.collection.modelName,
					_id
				)
			);
		}
	} catch (error: unknown) {
		const code = 500;
		res.status(code).send({
			error: (error as any).message,
			code,
		});
	}

	try {
		const result = await req.app.locals.collection.deleteOne({
			_id,
		});
		res.status(OK).send(result);
	} catch (error: unknown) {
		const code = 500;
		res.status(code).send({
			error: (error as any).message,
			code,
		});
	}
}

/**
 * postHandler - Creates Document
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export async function postHandler(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const { body } = req;
	let result;
	try {
		const coll = new req.app.locals.collection(body);
		result = await coll.save();
		res.status(CREATED).send(result);
	} catch (error: unknown) {
		const code = 500;
		res.status(code).send({
			error: (error as any).message,
			code,
		});
	}
	log(
		`postHandler :: ${req.app.locals.collection.modelName} :: ${result._id}`
	);
	try {
		if (req.app.locals.febby.redis) {
			await req.app.locals.febby.redis.set(
				buildRedisKey(
					req.app.locals.febby.appConfig.serviceName,
					req.app.locals.collection.modelName,
					result._id
				),
				JSON.stringify(result)
			);
		}
	} catch (error) {
		log(`postHandler error:: ${error.message}`);
	}
}

/**
 * putHandler - Updates Document
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export async function putHandler(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const { body } = req;
	const _id = req.params.id;
	log(`putHandler :: ${req.app.locals.collection.modelName} :: ${_id}`);
	try {
		if (req.app.locals.febby.redis) {
			await req.app.locals.febby.redis.del(
				buildRedisKey(
					req.app.locals.febby.appConfig.serviceName,
					req.app.locals.collection.modelName,
					_id
				)
			);
		}
	} catch (error: unknown) {
		const code = 500;
		res.status(code).send({
			error: (error as any).message,
			code,
		});
	}

	try {
		const result = await req.app.locals.collection.updateOne(
			{
				_id,
			},
			{
				$set: body,
			},
			{
				new: false,
			}
		);
		res.status(OK).send(result);
		if (req.app.locals.febby.redis) {
			await req.app.locals.febby.redis.del(
				buildRedisKey(
					req.app.locals.febby.appConfig.serviceName,
					req.app.locals.collection.modelName,
					_id
				)
			);
		}
	} catch (error: unknown) {
		const code = 500;
		res.status(code).send({
			error: (error as any).message,
			code,
		});
	}
}

/**
 * getHandler - Get Documents, supports projection , skip and limit. skip defaulted to 0 and limit defaulted to 10
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export async function getHandler(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;
	const limit = req.query.limit
		? parseInt(req.query.limit as string, 10)
		: 10;
	const projection =
		((req.query.projection as any) || "").length > 0
			? buildProjection(req.query.projection as any)
			: {};
	try {
		const query = req.query.query ? JSON.parse(req.query.query as any) : {};
		const results = await Promise.all([
			req.app.locals.collection.find(query, { _id: 1 }),
			await req.app.locals.collection.find(query, projection, {
				skip,
				limit,
			}),
		]);
		const count = (results[0] || []).length;
		const value = results[1] || {};
		res.status(200).send({ value, count });
	} catch (error: unknown) {
		const code = 500;
		res.status(code).send({
			error: (error as any).message,
			code,
		});
	}
}

/**
 * buildProjection - builds Projection
 * @param projection projection string represents fields with + .Example : 'first_name+last_name+email'
 */
export function buildProjection(projection: string = ""): string {
	return projection.replace("+", " ");
}
