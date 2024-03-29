/*!
 * Copyright(c) 2018-2021 Vasu Vanka
 * MIT Licensed
 */
import { Febby } from "../src/core";
import { IAppConfig, HttpMethod } from "../src/types";
import { Schema } from "mongoose";
import { NextFunction, Request, Response } from "express";

//jest.enableAutomock();

describe("Core", () => {
	it("constructor with config", () => {
		const config: IAppConfig = {
			port: 3000,
		};
		const febby = new Febby(config);
		expect(febby).toBeDefined();
		febby.shutdown();
	});
	it("constructor with db config", () => {
		const config: IAppConfig = {
			port: 3000,
		};
		const febby = new Febby(config);
		expect(febby).toBeDefined();
		febby.closeDbConnection();
		febby.shutdown();
	});
	it("bootstrap", () => {
		const config: IAppConfig = {
			port: 3000,
		};
		const febby = new Febby(config);
		febby.bootstrap(() => console.log("server running"));
		expect(febby).toBeDefined();
		febby.shutdown();
	});

	it("route", () => {
		const config: IAppConfig = {
			port: 3000,
		};
		const febby = new Febby(config);
		febby.route({
			path: "/",
			method: "get",
			middlewares: [],
			handler: (req: Request, res: Response, next: NextFunction) => {
				res.send("hello");
			},
		});
		febby.bootstrap(() => console.log("server running"));
		expect(febby).toBeDefined();
		febby.shutdown();
	});

	it("routes", () => {
		const config: IAppConfig = {
			port: 3000,
		};
		const febby = new Febby(config);
		const method: HttpMethod = "get";
		febby.routes([
			{
				path: "/",
				method,
				middlewares: [],
				handler: (req: Request, res: Response, next: NextFunction) => {
					res.send("hello");
				},
			},
		]);
		febby.bootstrap(() => console.log("server running"));
		expect(febby).toBeDefined();
		febby.shutdown();
	});

	it("middleware", () => {
		const config: IAppConfig = {
			port: 3000,
		};
		const febby = new Febby(config);
		const middleware = (
			req: Request,
			res: Response,
			next: NextFunction
		) => {
			next();
		};
		febby.middleware(middleware);
		febby.bootstrap(() => console.log("server running"));
		expect(febby).toBeDefined();
		febby.shutdown();
	});

	it("middleware", () => {
		const config: IAppConfig = {
			port: 3000,
		};
		const febby = new Febby(config);
		const middleware = (
			req: Request,
			res: Response,
			next: NextFunction
		) => {
			next();
		};
		febby.middlewares([middleware]);
		febby.bootstrap(() => console.log("server running"));
		febby.shutdown();
		expect(febby).toBeDefined();
	});

	it("middlewares", () => {
		const config: IAppConfig = {
			port: 3000,
		};
		const febby = new Febby(config);
		const middleware = (
			req: Request,
			res: Response,
			next: NextFunction
		) => {
			next();
		};
		febby.middleware(middleware);
		febby.routes([
			{
				path: "/",
				method: "get",
				middlewares: [],
				handler: (req: Request, res: Response, next: NextFunction) => {
					res.send("hello");
				},
			},
		]);
		febby.bootstrap(() => console.log("server running"));
		expect(febby).toBeDefined();
		febby.shutdown();
	});

	it("router", () => {
		const config: IAppConfig = {
			port: 3000,
		};
		const febby = new Febby(config);
		const api = febby.router("/api");
		expect(api).toBeDefined();
	});

	it("model - models", async () => {
		const config: IAppConfig = {
			port: 3000,
		};
		const febby = new Febby(config);
		const model = await febby.model(
			"users",
			new Schema({
				name: String,
			})
		);
		expect(model).toBeDefined();
		const models = febby.models();
		expect(models).toBeDefined();
		febby.shutdown();
	});

	it("db connection exception", () => {
		const config: IAppConfig = {
			port: 3000,
			db: {
				url: "sql://localhost:27019/test",
			},
		};
		try {
			new Febby(config);
		} catch (error) {
			expect(error).toBeDefined();
		}
	});
});
