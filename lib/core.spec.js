'use strict';
const Febby = require('./core');

const config = {
  port: 3000,
  hostname: 'vasuvanka.in',
  version: 'v1'
};

describe('Febby init', () => {
  it('should create febby instance', () => {
  const febby = new Febby(config);
    expect(febby instanceof Febby).toBe(true);
  });
});

describe('Febby#Router', () => {
  it('febby router should return express router object', () => {
  const febby = new Febby(config);
    const router = febby.router('/');
    expect(router).toBeDefined();
    expect(router instanceof Function).toBe(true);
  });
  it('should create child router', () => {
  const febby = new Febby(config);
    const router = febby.router('/');
    const api = febby.router('/api', router);
    expect(api).toBeDefined();
    expect(api instanceof Function).toBe(true);
  });
  it('should accept route options', () => {
  const febby = new Febby(config);
    const router = febby.router('/');
    const api = febby.router('/api', router, {
      caseSensitive: false,
      strict: true
    });
    expect(api).toBeDefined();
    expect(api instanceof Function).toBe(true);
  });
  it('should accept route without any params', () => {
    const febby = new Febby(config);
    const router = febby.router();
    const api = febby.router('/api', router, {
      caseSensitive: false,
      strict: true
    });
    expect(api).toBeDefined();
    expect(api instanceof Function).toBe(true);
  });
});

describe('Febby#Middleware', () => {
  it('should register a middleware', () => {
  const febby = new Febby(config);
    const router = febby.router();
    const api = febby.router('/api', router, {
      caseSensitive: false,
      strict: true
    });
    const func = (req, res, next) => {
      req.desc = 'new method desc';
      next();
    };
    febby.middleware(func, api);
    expect(api).toBeDefined();
  });

  it('should register a middleware without router', () => {
  const febby = new Febby(config);
    const router = febby.router();
    const api = febby.router('/api', router, {
      caseSensitive: false,
      strict: true
    });
    const func = (req, res, next) => {
      req.desc = 'new method desc';
      next();
    };
    febby.middleware(func);
    expect(api).toBeDefined();
  });
  it('should throw an error', () => {
  const febby = new Febby(config);
    const router = febby.router();
    const api = febby.router('/api', router, {
      caseSensitive: false,
      strict: true
    });
    const func = (req, res, next) => {
      req.desc = 'new method desc';
      next();
    };
    try {
      febby.middleware({});
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });
});
describe('Febby#Middlewares', () => {
  it('should register middlewares', () => {
  const febby = new Febby(config);
    const router = febby.router();
    const api = febby.router('/api', router, {
      caseSensitive: false,
      strict: true
    });
    const func1 = (req, res, next) => {
      req.desc = 'new method desc1';
      next();
    };
    const func2 = (req, res, next) => {
      req.desc = 'new method desc2';
      next();
    };
    febby.middlewares([func1, func2], api);
    expect(api).toBeDefined();
  });

  it('should register a middlewares without router', () => {
  const febby = new Febby(config);
  const router = febby.router();
    const api = febby.router('/api', router, {
      caseSensitive: false,
      strict: true
    });
    const func1 = (req, res, next) => {
      req.desc = 'new method desc1';
      next();
    };
    const func2 = (req, res, next) => {
      req.desc = 'new method desc2';
      next();
    };
    febby.middlewares([func1, func2]);
    expect(api).toBeDefined();
  });
});

describe('Febby#expressApp', () => {
  it('should return express app object', () => {
    const febby = new Febby(config);
    const app = febby.expressApp();
    expect(app).toBeDefined();
    expect(typeof app).toBe('function');
  });
});

describe('Febby#Bootstrap', () => {
  it('should run and listen on 3000', () => {
    const febby = new Febby(config);
    function startupCb() {
      console.log('strated');
    }
    febby.bootstrap(startupCb);
    const app = febby.expressApp();
    expect(app.get('port')).toBeDefined();
    expect(app.get('port')).toBe(3000);
    febby.shutdown();
  });
});

describe('Febby#finalMiddlewares', () => {
  it('should register final middlewares', () => {
    const febby = new Febby(config);
    function startupCb() {
      console.log('strated');
    }
    febby.bootstrap(startupCb);
    const finalFns = [(req, res, next) => {
      req.finalMessage = 'gotcha';
      next();
    }];
    febby.finalMiddlewares(finalFns);
    const app = febby.expressApp();
    expect(app.get('port')).toBeDefined();
    expect(app.get('port')).toBe(3000);
    febby.shutdown();
  });
  it('should throw error', () => {
    const febby = new Febby(config);
    function startupCb() {
      console.log('strated');
    }
    febby.bootstrap(startupCb);
    const finalFns = {};
    try {
      febby.finalMiddlewares(finalFns);
    } catch (e) {
      expect(e).toBeDefined();
    }
    febby.shutdown();
  });
});

describe('Febby#finalHandler', () => {
  it('should register final handler', () => {
    const febby = new Febby(config);
    function startupCb() {
      console.log('strated');
    }
    febby.bootstrap(startupCb);
    const finalFn = (err, req, res, next) => {
      res.status(err.status || 500).send({
        'error': err.message || 'unkown error'
      });
    };
    febby.finalHandler(finalFn);
    febby.shutdown();
  });
  it('should throw error', () => {
    const febby = new Febby(config);
    function startupCb() {
      console.log('strated');
    }
    febby.bootstrap(startupCb);
    const finalFn = {};
    try {
      febby.finalHandler(finalFns);
    } catch (e) {
      expect(e).toBeDefined();
    }
    febby.shutdown();
  });
});

describe('Febby#Connection', () => {
  const url = 'mongodb://127.0.0.1:27017/test';
  it('should connect to mongodb', async (done) => {
    const febby = new Febby(config);

    try {
      await febby.connection(url);
    } catch (error) {
      return done.fail();
    }
    febby.closeConnection();
    done();
  });
  it('should throw an error', async (done) => {
    const febby = new Febby(config);
    try {
      await febby.connection();
    } catch (error) {
      expect(error).toBeTruthy();
      return done();
    }
    done.fail();
  });
});

describe('Febby#Crud', () => {
  it('create crud on user api', async (done) => {
    const febby = new Febby(config);
    const url = 'mongodb://localhost:27017/test';
    await febby.connection(url);
    const api = febby.router('/user');
    const user = febby.model('user', {
      name: {
        type: String
      }
    });
    const configCrud = {
      crud: true
    };
    try {
      febby.crud('/', configCrud, user, api);
    } catch (error) {
      return done.fail();
    }
    febby.closeConnection();
    done();
  });
});
