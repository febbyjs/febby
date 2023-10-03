import { IAppConfig, appBaseUrl, HttpMethod, OK, CREATED } from "./types";
import { NextFunction, Handler, Request, Response, Router } from "express";
import * as debug from "debug";
import assert from "assert";

const log = debug.debug("febby:helper");

/**
 * Validates the application configuration and applies default values if necessary.
 *
 * @private
 * @param {IAppConfig} config - The application configuration to validate.
 * @returns {IAppConfig} The validated and possibly updated application configuration.
 */
export function validateAppConfig(config: IAppConfig): IAppConfig {
	assert(config !== undefined, "config should be provided");

	config.appBaseUrl = config.appBaseUrl || appBaseUrl;
	config.serviceName = config.serviceName || "febby";
	config.loadDefaultMiddlewareOnAppCreation =
		config.loadDefaultMiddlewareOnAppCreation === undefined
			? true
			: config.loadDefaultMiddlewareOnAppCreation;
	return config;
}

/**
 * Builds a Redis key using a predefined structure as 'serviceName.functionName.key'.
 *
 * @param {string} serviceName - The service name.
 * @param {string} functionName - The function name.
 * @param {string} key - The key.
 * @returns {string} The Redis key.
 */
export function buildRedisKey(
	serviceName: string,
	functionName: string,
	key: string
): string {
	return `${serviceName}.${functionName}.${key}`;
}

/**
 * Registers a route on the application router.
 *
 * @private
 * @param {Router} router - The application router.
 * @param {HttpMethod} method - The HTTP method.
 * @param {string} path - The URL path.
 * @param {Array<Handler>} middlewares - The middleware functions.
 * @param {Handler} handler - The request handler.
 */
export function register(
	router: Router,
	method: HttpMethod,
	path: string,
	middlewares: Handler[],
	handler: Handler
): void {
	log(`Register route :: ${method} :: ${path}`);

	assert(method !== undefined, "method should be defined");
	assert(path !== undefined, "path should be defined");
	assert(
		middlewares !== undefined,
		"middlewares should be defined or empty array"
	);
	assert(handler !== undefined, "handler should be defined");

	router[method](path, middlewares, handler);
}

/**
 * getByIdHandler - Get document by id, supports projection now. just pass projection in query params. ex: projection=name+mobile+email
 * @param {Request} req Request
 * @param {Response} res Response
 * @param {NextFunction} next NextFunction
 */
export async function getByIdHandler(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const id = req.params?.id;

	const model = res.app.get("collection");
	const febby = res.app.get("febby");

	log(`getByIdHandler :: ${model.modelName} :: ${id}`);
	const projection = req.query?.projection
		? buildProjection(req.query?.projection as string)
		: "";

	try {
		let doc = null;
		if (febby.redis) {
			doc = await febby.redis.get(
				buildRedisKey(febby.appConfig.serviceName, model.modelName, id)
			);
		}

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
		log(`getByIdHandler redis ${error}`);
	}

	try {
		const result = await model.findById(id, projection || {});
		if (result && febby.redis) {
			await febby.redis.set(
				buildRedisKey(febby.appConfig.serviceName, model.modelName, id),
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
 * @param {Request} req Request
 * @param {Response} res Response
 * @param {NextFunction} next NextFunction
 */
export async function removeByIdHandler(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const model = res.app.get("collection");
	const febby = res.app.get("febby");

	const _id = req.params?.id;
	log(`removeByIdHandler :: ${model.modelName} :: ${_id}`);

	if (febby.redis) {
		try {
			await febby.redis.del(
				buildRedisKey(febby.appConfig.serviceName, model.modelName, _id)
			);
		} catch (error: unknown) {
			log(`removeByIdHandler redis ${error}`);
		}
	}

	try {
		const result = await model.deleteOne({
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
 * @param {Request} req Request
 * @param {Response} res Response
 * @param {NextFunction} next NextFunction
 */
export async function postHandler(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const { body } = req;
	log(`postHandler - ${JSON.stringify(body)}`);
	const model = res.app.get("collection");
	const febby = res.app.get("febby");
	let result;
	try {
		const model = res.app.get("collection");

		const coll = new model(body);
		result = await coll.save();
		res.status(CREATED).send(result);
	} catch (error: unknown) {
		const code = 500;
		res.status(code).send({
			error: (error as any).message,
			code,
		});
		return;
	}
	log(`postHandler :: ${model.modelName} :: ${result._id}`);

	if (febby.redis) {
		try {
			await febby.redis.set(
				buildRedisKey(
					febby.appConfig.serviceName,
					model.modelName,
					result._id
				),
				JSON.stringify(result)
			);
		} catch (error) {
			log(`postHandler error:: ${error.message}`);
		}
	}
}

/**
 * putHandler - Updates Document
 * @param {Request} req Request
 * @param {Response} res Response
 * @param {NextFunction} next NextFunction
 */
export async function putHandler(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const model = res.app.get("collection");
	const febby = res.app.get("febby");

	const { body } = req;
	log(`putHandler - ${JSON.stringify(body)}`);

	const _id = req.params?.id;
	log(`putHandler :: ${model.modelName} :: ${_id}`);
	if (febby.redis) {
		try {
			await febby.redis.del(
				buildRedisKey(febby.appConfig.serviceName, model.modelName, _id)
			);
		} catch (error: unknown) {
			log(`putHandler redis error:: ${error}`);
		}
	}

	try {
		const result = await model.updateOne(
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
 * @param {Request} req Request
 * @param {Response} res Response
 * @param {NextFunction} next NextFunction
 */
export async function getHandler(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const model = res.app.get("collection");

	const skip = req.query?.skip ? parseInt(req.query?.skip as string, 10) : 0;
	const limit = req.query?.limit
		? parseInt(req.query?.limit as string, 10)
		: 10;
	const projection =
		((req.query?.projection as any) || "").length > 0
			? buildProjection(req.query?.projection as any)
			: {};
	try {
		const query = req.query?.query
			? JSON.parse(req.query?.query as any)
			: {};
		const [countList, value = {}] = await Promise.all([
			model.find(query, { _id: 1 }),
			model.find(query, projection, {
				skip,
				limit,
			}),
		]);
		res.status(200).send({ value, count: countList.length });
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
 * @param {string} projection projection string represents fields with + .Example : 'first_name+last_name+email'
 * @returns {string}
 */
export function buildProjection(projection: string = ""): string {
	return projection.replace("+", " ");
}
