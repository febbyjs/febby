import mongoose from "mongoose";
import { Router, Handler } from "express";

export interface IAppConfig {
    port: number
    hostname?: string
    version?: string
    bodyParser?: any
    cors?: any
    db?: {
        url: string,
        options: mongoose.ConnectionOptions
    }
    cluster?: boolean
    appBaseUrl?: string
}

export interface ICrudConfig {
    crud: boolean
    middlewares?: Handler[]
    get?: Handler[]
    post?: Handler[]
    put?: Handler[]
    patch?: Handler[]
    delete?: Handler[]
}

export interface IRouteConfig {
    router?: Router
    method: string
    path: string
    middlewares?: Handler[]
    handler: Handler
}
