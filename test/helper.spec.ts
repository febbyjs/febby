import { register, validateAppConfig, buildProjection, getByIdHandler, getHandler, postHandler, putHandler, patchHandler, removeByIdHandler } from "../src/helper";
import { Router, Request, Response, NextFunction, Application } from "express";
import { IAppConfig, POST } from "../src/types";

// jest.mock("express");
// jest.mock("mongoose");
// const expressMock = require("express");
// const mongooseMock = require("mongoose");


describe('Helper', () => {
  it('validateAppConfig', () => {
    const config = { port: 3000 } as IAppConfig
    const validatedConfig = validateAppConfig(config)
    expect(validatedConfig.port).toEqual(config.port)
    expect(validatedConfig.bodyParser).toEqual(undefined)
    expect(validatedConfig.version).toEqual(undefined)
    expect(validatedConfig.appBaseUrl).toEqual("/")
    expect(validatedConfig.clusterMode).toEqual(undefined)
    expect(validatedConfig.cors).toEqual(undefined)
    expect(validatedConfig.db).toEqual(undefined)
  })
  it('Register', () => {
    const testRouter = Router()
    const resp = register(testRouter, POST, "/", [], (req, res, next) => { })
    expect(resp).toBe(undefined)
  })

  it('buildProjection', () => {
    const proj = buildProjection('hello+world')
    expect(proj).toBeDefined()
    expect(proj).toBe('hello world')
  })

  it('getByIdHandler', async () => {
    const req = {} as Request
    req.params = { id: 'id' }
    req.query = { projection: 'hello+world' }
    req.app = {} as Application
    req.app.locals = {
      collection: {
        findById:async (id: string, projection: string) => {
          return {
            _id: id
          }
        }
      }
    }
    const res = {
      status: (code: number) => {
        return res
      },
      send: (some: any) => { }
    } as Response
    const next = {} as NextFunction
    await getByIdHandler(req, res, next)
  })

  it('getByIdHandler Exception', async () => {
    const req = {} as Request
    req.params = { id: 'id' }
    req.query = { projection: 'hello+world' }
    req.app = {} as Application
    req.app.locals = {
      collection: {
        findById:async (id: string, projection: string) => {
          throw new Error('some error')
        }
      }
    }
    const res = {
      status: (code: number) => {
        return res
      },
      send: (some: any) => { }
    } as Response
    const next = {} as NextFunction
    await getByIdHandler(req, res, next)
  })

  it('getHandler', async () => {
    const req = {} as Request
    req.params = { skip: '0', limit: '10' }
    req.query = { projection: 'hello+world', query: JSON.stringify({ name: 'test' }) }
    req.app = {} as Application
    req.app.locals = {
      collection: {
        find: async (query: any, projection: string) => {
          return [{}]
        },
        count:async (query: number) => {
          return 1
        }
      }
    }
    const res = {
      status: (code: number) => {
        return res
      },
      send: (some: any) => { }
    } as Response
    const next = {} as NextFunction
    await getHandler(req, res, next)
  })

  it('getHandler Exception', async () => {
    const req = {} as Request
    req.params = { skip: '0', limit: '10' }
    req.query = { projection: 'hello+world', query: JSON.stringify({ name: 'test' }) }
    req.app = {} as Application
    req.app.locals = {
      collection: {
        find:async (query: any, projection: string) => {
          return [{}]
        },
        count:async (count: number) => {
          throw new Error('some error')
        }
      }
    }
    const res = {
      status: (code: number) => {
        return res
      },
      send: (some: any) => { }
    } as Response
    const next = {} as NextFunction
    await getHandler(req, res, next)
  })

  it('postHandler', async () => {
    const req = {} as Request
    req.body = { name: 'test' }
    req.app = {} as Application
    req.app.locals = {
      collection: (body: any) => {
        return {
          save:async () => {
            return { name: 'test' }
          }
        }
      }
    }
    const res = {
      status: (code: number) => {
        return res
      },
      send: (some: any) => { }
    } as Response
    const next = {} as NextFunction
    await postHandler(req, res, next)
  })

  it('postHandler Exception', async () => {
    const req = {} as Request
    req.body = { name: 'test' }
    req.app = {} as Application
    req.app.locals = {
      collection: (body: any) => {
        return {
          save: async () => {
            throw new Error('some error')
          }
        }
      }
    }
    const res = {
      status: (code: number) => {
        return res
      },
      send: (some: any) => { }
    } as Response
    const next = {} as NextFunction
    await postHandler(req, res, next)
  })

  it('putHandler', async () => {
    const req = {} as Request
    req.params = { id: 'id' }
    req.body = { name: 'test' }
    req.app = {} as Application
    req.app.locals = {
      collection: (body: any) => {
        return {
          findOneAndUpdate:async (body: any, data: any, op: any) => {
            return {id:'some id'}
          }
        }
      }
    }
    const res = {
      status: (code: number) => {
        return res
      },
      send: (some: any) => { }
    } as Response
    const next = {} as NextFunction
    await putHandler(req, res, next)
  })

  it('putHandler Exception', async () => {
    const req = {} as Request
    req.params = { id: 'id' }
    req.body = { name: 'test' }
    req.app = {} as Application
    req.app.locals = {
      collection: (body: any) => {
        return {
          findOneAndUpdate:async (body: any, data: any, op: any) => {
            throw new Error('some error')
          }
        }
      }
    }
    const res = {
      status: (code: number) => {
        return res
      },
      send: (some: any) => { }
    } as Response
    const next = {} as NextFunction
    await putHandler(req, res, next)
  })

  it('patchHandler', async () => {
    const req = {} as Request
    req.params = { id: 'id' }
    req.body = { name: 'test' }
    req.app = {} as Application
    req.app.locals = {
      collection: {
        findOneAndUpdate: async (body: any, data: any, op: any) => {
          return { name: 'test' }
        }
      }
    }
    const res = {
      status: (code: number) => {
        return res
      },
      send: (some: any) => { }
    } as Response
    const next = {} as NextFunction
    await patchHandler(req, res, next)
  })

  it('patchHandler exception', async () => {
    const req = {} as Request
    req.params = { id: 'id' }
    req.body = { name: 'test' }
    req.app = {} as Application
    req.app.locals = {
      collection: (body: any) => {
        return {
          findOneAndUpdate: async (body: any, data: any, op: any) => {
            throw new Error('some error')
          }
        }
      }
    }
    const res = {
      status: (code: number) => {
        return res
      },
      send: (some: any) => { }
    } as Response
    const next = {} as NextFunction
    await patchHandler(req, res, next)
  })

  it('removeByIdHandler', async () => {
    const req = {} as Request
    req.params = { id: 'id' }
    req.query = { projection: 'hello+world' }
    req.app = {} as Application
    req.app.locals = {
      collection: {
        findOneAndRemove: (id: string) => {
          return {}
        }
      }
    }
    const res = {
      status: (code: number) => {
        return res
      },
      send: (some: any) => { }
    } as Response
    const next = {} as NextFunction
    await removeByIdHandler(req, res, next)
  })

  it('removeByIdHandler', async () => {
    const req = {} as Request
    req.params = { id: 'id' }
    req.query = { projection: 'hello+world' }
    req.app = {} as Application
    req.app.locals = {
      collection: {
        findOneAndRemove: (id: string) => {
          throw new Error('some error')
        }
      }
    }
    const res = {
      status: (code: number) => {
        return res
      },
      send: (some: any) => { }
    } as Response
    const next = {} as NextFunction
    await removeByIdHandler(req, res, next)
  })
})


