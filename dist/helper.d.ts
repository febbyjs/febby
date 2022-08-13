/*!
 * Copyright(c) 2018-2022 Vasu Vanka
 * MIT Licensed
 */
import { IAppConfig, HttpMethod } from "./types";
import { NextFunction, Handler, Request, Response, Router } from "express";
export declare function validateAppConfig(config: IAppConfig): IAppConfig;
export declare function register(router: Router, method: HttpMethod, path: string, middlewares: Handler[], handler: Handler): void;
export declare function getByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function removeByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function postHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function putHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function buildProjection(projection?: string): string;
