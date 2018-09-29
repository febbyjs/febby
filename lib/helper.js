'use strict';
const log = require('debug')('febby:helper');
/**
 * @private 
 * Validate and build config.
 * by default body - parser, helmet, cors with empty config are included.
 * to override default configuration of above specified middlewares just specify config objects with valid keys in config object.
 * @param {Object} config - represents basic app setup.
 * @param {string} config.port - represents port.
 * @param {string} config.hostname - represents hostname.
 * @param {string} config.version - represents app version, default to v1.
 * @param {Object} config.bodyParser - represents body-parser config options.
 * @param {Object} config.helmet - represents helmet config options.
 * @param {Object} config.cors - represents cors config options.
 * @param {Object} config.db - represents database configuration object.
 * @param {string} config.db.url - represents database url to connect.
 * @param {Object} config.db.options - represents  mongoose connect Options object.
 * @returns {Object} - returns config object
 * @example
 * {
 *   port: 3000,
 *   hostname: 'abc.xyz',
 *   db: {
 *          url: 'mongodb://localhost/test'
 *       },
 *   bodyParser: {},
 *   cors: {},
 *   helmet: {},
 *   version: 'v1'
 * }
 */
function buildConfig(config) {
  log('building config start');
  const c = {};
  c.port = process.env.PORT || config.port || 3636;
  c.hostname = process.env.HOSTNAME || config.hostname || 'localhost';
  c.version = process.env.VERSION || config.version || 'v1';
  c.bodyParser = config.bodyParser || {};
  c.cors = config.cors || {};
  c.helmet = config.helmet || {};
  c.db = config.db || {};
  c.cluster = !!config.cluster;
  log('building config end');
  return c;
};
/**
 * @private 
 * Build Model object.
 * @param {Object} model - represents model object.
 * @returns {Object} - returns newly built model object.
 */
function buildCrudConfig(model) {
  log('building model');
  const {
    middlewares = [],
      crud,
      get,
      put,
      post
  } = model;
  const del = model['delete'];
  const m = {};
  if (middlewares && Array.isArray(middlewares)) {
    m.middlewares = middlewares.map(fn => validateFn(fn));
  }
  m.crud = crud === undefined ? true : !!crud;
  if (get && Array.isArray(get)) {
    m.get = get.map(fn => validateFn(fn));
  }
  if (put && Array.isArray(put)) {
    m.put = put.map(fn => validateFn(fn));
  }
  if (post && Array.isArray(post)) {
    m.post = post.map(fn => validateFn(fn));
  }
  if (del && Array.isArray(del)) {
    m.del = del.map(fn => validateFn(fn));
  }
  return m;
}
/**
 * @private
 * Validate given input
 * @param {Function} fn - represents a function. it might be a callback or handler
 */
function validateFn(fn) {
  log('function validation');
  if (typeof fn !== 'function') {
    throw `${fn} is not valid middleware registration`;
  }
  return fn;
}

module.exports = {
  validateFn,
  buildCrudConfig,
  buildConfig
};
