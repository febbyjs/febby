import { readFile } from "fs/promises";
import { parseYAMLFile, processOpenApiSpecFile } from "../src/openapi";
import { join } from "path";
import assert from "assert";

describe("OpenApiSpec", () => {
	it("parseYAMLFile", async () => {
		const data = await readFile(join(__dirname, "open-api.yaml"), {
			encoding: "utf-8",
		});
		const staticJSONString = await readFile(
			join(__dirname, "open-api.json"),
			{
				encoding: "utf-8",
			}
		);
		const parsedData = await parseYAMLFile(data);
		assert.equal(staticJSONString, JSON.stringify(parsedData));
	}),
		it("processOpenApiSpecFile", async () => {
			const staticJSONString = await readFile(
				join(__dirname, "open-api.json"),
				{
					encoding: "utf-8",
				}
			);

			const middlewares = [
				{
					name: "middleware1",
					func: (req, res, next) => next(),
				},
				{
					name: "middleware2",
					func: (req, res, next) => next(),
				},
			];
			const controllers = [
				{
					name: "updatePetController",
					func: (req, res) => res.json({ message: "hello world!" }),
				},
			];

			const { pathnames } = await processOpenApiSpecFile(
				JSON.parse(staticJSONString),
				{
					controllers,
					middlewares,
					openApiValidatorOptions: {
						validateApiSpec: false,
					},
				}
			);

			assert.equal(
				JSON.stringify(["/api/v3", "/a/api"]),
				JSON.stringify(pathnames)
			);
		});
});
