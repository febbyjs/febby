import { Router } from "express";
import { IOpenApiOptions } from "./types";
export declare function processOpenApiSpecFile(openApiJson: any, options: IOpenApiOptions): Promise<{
    pathnames: string[];
    router: Router;
}>;
export declare function parseYAMLFile(fileBuffer: string): Promise<object>;
