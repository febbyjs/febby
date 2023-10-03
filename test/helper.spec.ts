import { Febby } from "../src/core";
import {
	validateAppConfig,
	buildRedisKey,
	register,
	getByIdHandler,
	removeByIdHandler,
	postHandler,
	putHandler,
	getHandler,
	buildProjection,
} from "../src/helper";

import { Router, Request, Response, NextFunction } from "express";

describe("validateAppConfig", () => {
	it("should validate a valid application configuration", () => {
		const validConfig = {
			port: 3000,
			// other config properties...
		};

		const result = validateAppConfig(validConfig);

		expect(result).toEqual(validConfig);
	});

	it("should set default values when properties are missing", () => {
		const configWithoutDefaults = {
			port: 3000,
			// other config properties...
		};

		const result = validateAppConfig(configWithoutDefaults);

		expect(result.loadDefaultMiddlewareOnAppCreation).toBe(true);
		expect(result.serviceName).toBe("febby");
	});
});

describe("buildRedisKey", () => {
	it("should build a valid Redis key", () => {
		const serviceName = "my-service";
		const functionName = "getUsers";
		const key = "user123";

		const result = buildRedisKey(serviceName, functionName, key);

		expect(result).toBe("my-service.getUsers.user123");
	});
});

describe("register", () => {
	// Create a mock Express Router for testing purposes.
	let mockRouter: Router;

	beforeEach(() => {
		mockRouter = {
			get: jest.fn(),
			post: jest.fn(),
			put: jest.fn(),
			delete: jest.fn(),
		} as unknown as Router;
	});

	it("should register a GET route with no middlewares", () => {
		const method = "get";
		const path = "/test";
		const middlewares: [] = [];
		const handler = (req: Request, res: Response) => {
			res.send("GET request handled");
		};

		register(mockRouter, method, path, middlewares, handler);

		expect(mockRouter.get).toHaveBeenCalledWith(path, middlewares, handler);
	});

	it("should register a POST route with middlewares", () => {
		const method = "post";
		const path = "/test";
		const middlewares = [(req: Request, res: Response, next: any) => {}];
		const handler = (req: Request, res: Response) => {
			res.send("POST request handled");
		};

		register(mockRouter, method, path, middlewares, handler);

		expect(mockRouter.post).toHaveBeenCalledWith(
			path,
			middlewares,
			handler
		);
	});
});

describe("buildProjection", () => {
	it("should build a valid projection string", () => {
		const projection = "name+email";

		const result = buildProjection(projection);

		expect(result).toBe("name email");
	});
});

describe("getByIdHandler", () => {
	it("should return a document by ID when found in the database", async () => {
		const req = {
			params: {
				id: "123",
			},
		} as unknown as Request;

		const model = {
			findById: async (id) => {
				return {
					id,
					name: "hello",
				};
			},
		};

		const mockMap = new Map();
		mockMap.set("collection", model);
		mockMap.set("febby", jest.fn());
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
			app: mockMap,
		} as unknown as Response;
		const next = {} as NextFunction;

		await getByIdHandler(req, res, next);
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it("should handle errors and return a 500 status code when an error occurs", async () => {
		const req = {
			params: {
				id: "123",
			},
		} as unknown as Request;

		const model = {
			findById: async (id) => {
				throw new Error("Database error");
			},
		};

		const mockMap = new Map();
		mockMap.set("collection", model);
		mockMap.set("febby", jest.fn());
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
			app: mockMap,
		} as unknown as Response;
		const next = {} as NextFunction;

		await getByIdHandler(req, res, next);
		expect(res.status).toHaveBeenCalledWith(500);
	});
});

describe("getHandler", () => {
	it("should return documents from the database with default skip and limit", async () => {
		// Mocking the Request and Response objects
		const req = {
			query: {},
		} as Request;

		const model = {
			find: async () => {
				return [1, 2, 3];
			},
		};

		const mockMap = new Map();
		mockMap.set("collection", model);
		mockMap.set("febby", jest.fn());
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
			app: mockMap,
		} as unknown as Response;
		const next = {} as NextFunction;

		await getHandler(req, res, next);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith({
			value: [1, 2, 3],
			count: 3,
		});
	});

	it("should return documents from the database with custom skip and limit", async () => {
		// Mocking the Request and Response objects with custom skip and limit
		const req = {
			query: {
				skip: "2",
				limit: "5",
			},
		} as unknown as Request;

		const model = {
			find: async () => {
				return [4, 5, 6];
			},
		};

		const mockMap = new Map();
		mockMap.set("collection", model);
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
			app: mockMap,
		} as unknown as Response;
		const next = {} as NextFunction;

		await getHandler(req, res, next);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith({
			value: [4, 5, 6],
			count: 3,
		});
	});

	it("should handle errors and return a 500 status code when an error occurs", async () => {
		// Mocking the Request and Response objects
		const req = {
			query: {},
		} as Request;
		const model = {
			find: async () => {
				throw new Error("Database error");
			},
		};

		const mockMap = new Map();
		mockMap.set("collection", model);
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
			app: mockMap,
		} as unknown as Response;
		const next = {} as NextFunction;

		await getHandler(req, res, next);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith({
			error: "Database error",
			code: 500,
		});
	});
});

describe("postHandler", () => {
	it("should create a document and return it with a 201 status code", async () => {
		// Mocking the Request and Response objects
		const req = {
			body: {
				name: "John",
				email: "john@example.com",
			},
		} as Request;
		const model = function (body) {
			this.body = body;
			this.save = async () => ({
				_id: "12345",
				...this.body,
			});
		};

		const mockMap = new Map();
		mockMap.set("collection", model);
		mockMap.set("febby", {} as Febby);
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
			app: mockMap,
		} as unknown as Response;
		const next = {} as NextFunction;

		await postHandler(req, res, next);

		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.send).toHaveBeenCalledWith({
			_id: "12345",
			...req.body,
		});
	});

	it("should handle errors and return a 500 status code when an error occurs", async () => {
		// Mocking the Request and Response objects
		const req = {
			body: {
				name: "John",
				email: "john@example.com",
			},
		} as Request;
		const model = function (body) {
			this.body = body;
			this.save = async () => {
				throw new Error("Database error");
			};
		};

		const mockMap = new Map();
		mockMap.set("collection", model);
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
			app: mockMap,
		} as unknown as Response;
		const next = {} as NextFunction;

		await postHandler(req, res, next);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith({
			error: "Database error",
			code: 500,
		});
	});
});

describe("putHandler", () => {
	it("should update a document and return it with a 200 status code", async () => {
		// Mocking the Request and Response objects
		const req = {
			body: {
				name: "Updated John",
				email: "updatedjohn@example.com",
			},
			params: {
				id: "12345",
			},
		} as unknown as Request;
		const model = {
			updateOne: async () => {
				return {
					acknowledged: true,
					modifiedCount: 1,
					upsertedId: null,
					upsertedCount: 0,
					matchedCount: 1,
				};
			},
		};

		const mockMap = new Map();
		mockMap.set("collection", model);
		mockMap.set("febby", jest.fn());
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
			app: mockMap,
		} as unknown as Response;
		const next = {} as NextFunction;

		await putHandler(req, res, next);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith({
			acknowledged: true,
			modifiedCount: 1,
			upsertedId: null,
			upsertedCount: 0,
			matchedCount: 1,
		});
	});

	it("should handle errors and return a 500 status code when an error occurs", async () => {
		// Mocking the Request and Response objects
		const req = {
			body: {
				name: "Updated John",
				email: "updatedjohn@example.com",
			},
			params: {
				id: "12345",
			},
		} as unknown as Request;
		const model = {
			updateOne: async () => {
				throw new Error("Database error");
			},
		};

		const mockMap = new Map();
		mockMap.set("collection", model);
		mockMap.set("febby", jest.fn());
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
			app: mockMap,
		} as unknown as Response;
		const next = {} as NextFunction;

		await putHandler(req, res, next);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith({
			error: "Database error",
			code: 500,
		});
	});
});

describe("removeByIdHandler", () => {
	it("should remove a document and return a 200 status code", async () => {
		const req = {
			params: {
				id: "123",
			},
		} as unknown as Request;

		const model = {
			deleteOne: async (id) => {
				return {
					acknowledged: true,
					deletedCount: 1,
				};
			},
		};

		const mockMap = new Map();
		mockMap.set("collection", model);
		mockMap.set("febby", jest.fn());
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
			app: mockMap,
		} as unknown as Response;
		const next = {} as NextFunction;

		await removeByIdHandler(req, res, next);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith({
			acknowledged: true,
			deletedCount: 1,
		});
	});

	it("should handle errors and return a 500 status code when an error occurs", async () => {
		// Mocking the Request and Response objects
		const req = {
			params: {
				id: "123",
			},
		} as unknown as Request;

		const model = {
			deleteOne: async (id) => {
				throw new Error("Database error");
			},
		};

		const mockMap = new Map();
		mockMap.set("collection", model);
		mockMap.set("febby", jest.fn());
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
			app: mockMap,
		} as unknown as Response;
		const next = {} as NextFunction;

		await removeByIdHandler(req, res, next);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith({
			error: "Database error",
			code: 500,
		});
	});
});
