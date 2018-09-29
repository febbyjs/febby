'use strict';

const {
  register,
  validateMethod,
  validateRouter,
  get,
  post,
  put,
  del
} = require('./router');

const Febby = require('./core.js');
const {
  Router
} = require('express');

describe('Validate Router & Method', () => {
  it('should validate method', () => {
    const m = 'put';
    const method = validateMethod(m);
    expect(method).toBeDefined();
    expect(method).toBe('put');
  });
  it('should throw an error', () => {
    const m = 'link';
    let method;
    try {
      method = validateMethod(m);
    } catch (error) {
      expect(error).toBeDefined();
    }
    expect(method).toBeUndefined();
  });
  it('should validate Router', () => {
    const febby = new Febby({});
    const api = febby.router('/');
    const validApi = validateRouter(api);
    expect(validApi).toBeDefined();
    expect(typeof validApi).toBe('function');
  });
  it('should throw error on invalid router', () => {
    let validApi;
    try {
      validApi = validateRouter({});
    } catch (error) {
      expect(error).toBeDefined();
    }
    expect(validApi).toBeUndefined();
  });
});

describe('Validate Register', () => {
  const febby = new Febby({});
  const api = febby.router('/');
  try {
    register(api, 'get', '/', [], (req, res, next) => {
      // do apply some business logic
    });
  } catch (error) {
    throw error;
  }
});

describe('Methods', () => {
  it('should register GET method on model', () => {
    const febby = new Febby({
      db: {
        url: 'mongodb://localhost:27017/test'
      }
    });
    const api = febby.router('/');
    const model = febby.model('users', {
      name: {
        type: String
      }
    });
    get('/', {}, api, model);
  });
  it('should register POST method on model', () => {
    const febby = new Febby({
      db: {
        url: 'mongodb://localhost:27017/test'
      }
    });
    const api = febby.router('/');
    const model = febby.model('users', {
      name: {
        type: String
      }
    });
    post('/', {}, api, model);
  });
  it('should register PUT method on model', () => {
    const febby = new Febby({
      db: {
        url: 'mongodb://localhost:27017/test'
      }
    });
    const api = febby.router('/');
    const model = febby.model('users', {
      name: {
        type: String
      }
    });
    put('/', {}, api, model);
  });
  it('should register DELETE method on model', () => {
    const febby = new Febby({
      db: {
        url: 'mongodb://localhost:27017/test'
      }
    });
    const api = febby.router('/');
    const model = febby.model('users', {
      name: {
        type: String
      }
    });
    del('/', {}, api, model);
  });
});
