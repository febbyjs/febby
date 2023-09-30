import Febby from "./core";
import { IOpenApiOptions } from "./types";
export declare function processOpenApiSpecFile(openApiJson: any, febby: Febby, options: IOpenApiOptions): Promise<void>;
export declare function parseYAMLFile(fileBuffer: string): Promise<string>;
