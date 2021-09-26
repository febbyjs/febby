/*!
 * Copyright(c) 2018-2021 Vasu Vanka
 * MIT Licensed
 */
import {
	GET,
	PUT,
	POST,
	PATCH,
	DELETE,
	HttpMethod,
	CREATED,
	OK,
	BADREQUEST,
	INTERNALSERVERERROR,
	IAppConfig,
} from "../src/types";
describe("Types", () => {
	it("Get", () => {
		expect(GET).toEqual("get");
	});
	it("Get not equal to any", () => {
		expect(GET).not.toEqual("any");
	});
	it("PUT", () => {
		expect(PUT).toEqual("put");
	});
	it("PUT not equal to any", () => {
		expect(PUT).not.toEqual("any");
	});
	it("POST", () => {
		expect(POST).toEqual("post");
	});
	it("POST not equal to any", () => {
		expect(POST).not.toEqual("any");
	});
	it("PATCH", () => {
		expect(PATCH).toEqual("patch");
	});
	it("PATCH not equal to any", () => {
		expect(PATCH).not.toEqual("any");
	});
	it("DELETE", () => {
		expect(DELETE).toEqual("delete");
	});
	it("DELETE not equal to any", () => {
		expect(DELETE).not.toEqual("any");
	});
});

describe("Type HttpMethod", () => {
	it("type HttpMethod equal to get", () => {
		var value: HttpMethod = "get";
		expect(value).toEqual("get");
	});
	it("type HttpMethod equal to post", () => {
		var value: HttpMethod = "post";
		expect(value).toEqual("post");
	});
	it("type HttpMethod equal to put", () => {
		var value: HttpMethod = "put";
		expect(value).toEqual("put");
	});
	it("type HttpMethod equal to delete", () => {
		var value: HttpMethod = "delete";
		expect(value).toEqual("delete");
	});
	it("type HttpMethod equal to patch", () => {
		var value: HttpMethod = "patch";
		expect(value).toEqual("patch");
	});
	it("type HttpMethod equal to copy", () => {
		var value: HttpMethod = "copy";
		expect(value).toEqual("copy");
	});
	it("type HttpMethod equal to head", () => {
		var value: HttpMethod = "head";
		expect(value).toEqual("head");
	});
	it("type HttpMethod equal to options", () => {
		var value: HttpMethod = "options";
		expect(value).toEqual("options");
	});
	it("type HttpMethod not equal to any", () => {
		var value: HttpMethod = "post";
		expect(value).not.toEqual("any");
	});
});

describe("Http status codes", () => {
	it("created 201 ok", () => {
		expect(CREATED).toEqual(201);
	});
	it("created not any otherthan 200", () => {
		expect(CREATED).not.toEqual(400);
	});
	it("badrequest 400 ok", () => {
		expect(BADREQUEST).toEqual(400);
	});
	it("badrequest not any otherthan 400", () => {
		expect(BADREQUEST).not.toEqual(401);
	});
	it("success 200 ok", () => {
		expect(OK).toEqual(200);
	});
	it("success not any otherthan 200", () => {
		expect(BADREQUEST).not.toEqual(401);
	});
	it("internal server error 500 ok", () => {
		expect(INTERNALSERVERERROR).toEqual(500);
	});
	it("internal server error not any otherthan 200", () => {
		expect(INTERNALSERVERERROR).not.toEqual(401);
	});
});

describe("IAppConfig", () => {
	var appConfig: IAppConfig = {
		appBaseUrl: "/hello",
		port: 3000,
		version: "v01",
		hostname: "testdomain",
		db: {
			url: "mongodb://localhost:27017/test",
		},
		cors: {},
		bodyParser: {},
		clusterMode: false,
	};
	it("test property types of IAppConfig", () => {
		expect(typeof appConfig.appBaseUrl).toBe("string");
		expect(typeof appConfig.port).toBe("number");
		expect(typeof appConfig.version).toBe("string");
		expect(typeof appConfig.hostname).toBe("string");
		expect(typeof appConfig.bodyParser).toBe("object");
		expect(typeof appConfig.db).toBe("object");
		expect(typeof appConfig.clusterMode).toBe("boolean");
	});
});
