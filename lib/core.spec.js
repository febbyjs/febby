'use strict';
const Febby = require('./core');

const config = {
  port: 3000,
  hostname: 'vasuvanka.in',
  version: 'v1'
};

let febby;
beforeEach(() => {
  febby = new Febby(config);
});
describe('Febby init', () => {
  it('should create febby instance', () => {
    expect(febby instanceof Febby).toBe(true);
  });
});

describe('Febby#Router', () => {
  it('febby router should return express router object', () => {
    const router = febby.router('/');
    expect(router).toBeDefined();
    expect(router instanceof Function).toBe(true);
  });
  it('should create child router', () => {
    const router = febby.router('/');
    const api = febby.router('/api', router);
    expect(api).toBeDefined();
    expect(api instanceof Function).toBe(true);
  });
  it('should accept route options', () => {
    const router = febby.router('/');
    const api = febby.router('/api', router, {
      caseSensitive: false,
      strict: true
    });
    expect(api).toBeDefined();
    expect(api instanceof Function).toBe(true);
  });
  it('should accept route without any params', () => {
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
    const app = febby.expressApp();
    expect(app).toBeDefined();
    expect(typeof app).toBe('function');
  });
});

describe('Febby#Bootstrap', () => {
  function startupCb() {
    console.log('strated');
  }
  it('should run and listen on 3000', () => {
    febby.bootstrap();
    const app = febby.expressApp();
    expect(app.get('port')).toBeDefined();
    expect(app.get('port')).toBe(3000);
    febby.shutdown();
  });
});

describe('Febby#Connection', () => {
  const url = 'mongodb://localhost:27017/test';
  it('should connect to mongodb', async (done) => {
    try {
      await febby.connection(url);
    } catch (error) {
      return done.fail();
    }
    febby.closeConnection();
    done();
  });
  it('should throw an error', async (done) => {
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
    const url = 'mongodb://localhost:27017/test';
    await febby.connection(url);
    const api = febby.router('/user');
    const user = febby.model('user', {
      name: {
        type: String
      }
    });
    const config = {
      crud: true
    };
    try {
      febby.crud('/', config, user, api);
    } catch (error) {
      return done.fail();
    }
    febby.closeConnection();
    done();
  });
});
