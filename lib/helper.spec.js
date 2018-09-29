'use strict';

const {
  validateFn,
  buildCrudConfig,
  buildConfig
} = require('./helper');

describe('Helper', () => {
  it('should build config', () => {
    const config = {};
    const co = buildConfig(config);
    expect(co.port).toBe(3636);
    expect(co.version).toBe('v1');
    expect(co.hostname).toBe('localhost');
  });
  it('should validate a function', () => {
    function sum(a, b) {
      return a + b;
    }
    let add;
    try {
      add = validateFn(sum);
    } catch (error) {
      throw error;
    }
    expect(add).toBeDefined();
    expect(typeof add).toBe('function');
  });
  it('should throw an error', () => {
    const sum = {};
    let add;
    try {
      add = validateFn(sum);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
  it('should build crud config', () => {
    const crud = buildCrudConfig({});
    expect(crud.crud).toBe(true);
    expect(crud.middlewares.length).toBe(0);
  });
  it('should build crud config with given methods', () => {
    const config = {
      crud: false,
      get: [],
      put: [],
      delete: []
    };
    const crud = buildCrudConfig(config);
    expect(crud.crud).toBe(false);
    expect(crud.middlewares.length).toBe(0);
    expect(crud.get).toBeDefined();
    expect(crud.get.length).toBe(0);
    expect(crud.del).toBeDefined();
    expect(crud.del.length).toBe(0);
  });
});
