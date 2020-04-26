/*!
 * febby
 * Copyright(c) 2018-2020 Vasu Vanka
 * MIT Licensed
 */
import { IAppConfig, HttpMethod } from "./types";
import { NextFunction, Handler, Request, Response, Router } from "express";
/**
 * @private
 * @param config Validates application configuration
 */
export declare function validateAppConfig(config: IAppConfig): IAppConfig;
/**
 * @private
 * Route Registration
 * @param router Application Router
 * @param method Http methgod
 * @param path Url path
 * @param middlewares Middleware functions
 * @param handler request handler
 */
export declare function register(router: Router, method: HttpMethod, path: string, middlewares: Handler[], handler: Handler): void;
/**
 * getByIdHandler - Get document by id, supports projection now. just pass projection in query params. ex: projection=name+mobile+email
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export declare function getByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * removeByIdHandler - Remove document by id
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export declare function removeByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * postHandler - Creates Document
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export declare function postHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * putHandler - Updates Document
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export declare function putHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * patchHandler - Updates Document
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export declare function patchHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * getHandler - Get Documents, supports projection , skip and limit. skip defaulted to 0 and limit defaulted to 10
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export declare function getHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * buildProjection - builds Projection
 * @param projection projection string represents fields with + .Example : 'first_name+last_name+email'
 */
export declare function buildProjection(projection?: string): string;
