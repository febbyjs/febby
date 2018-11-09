'use strict';

const {
  validateFn
} = require('./helper');

const log = require('debug')('febby:router');

const HTTP = {
  POST: 'post',
  GET: 'get',
  PUT: 'put',
  DELETE: 'delete'
};
/**
 * @private
 * Register Route
 * @param {Object} router - represents Express Route object
 * @param {string} method - represents http method ex: get,put,post,delete
 * @param {string} path - represents url ex: /api
 * @param {Function[]} middlewares - represents middleware function list
 * @param {Function} handler - represents request handler
 */
function register(router, method, path, middlewares = [], handler) {
  log(`route registration at ${method}:${path}`);
  if (!path || !(typeof path === 'string')) {
    throw `invalid path "${path}"`;
  }
  try {
    router[validateMethod(method)](path, middlewares, validateFn(handler));
  } catch (error) {
    throw error;
  }
}
/**
 * @private
 * Validate Http Method.
 * @param {string} method - represents http method.
 * @returns {string} - returns http method.
 */
function validateMethod(method) {
  log(`validating method ${method}`);
  const valid = ['get', 'post', 'put', 'delete', 'head', 'patch', 'options', 'copy'];
  if (!method || !(typeof method === 'string')) {
    throw `"${method}" not a valid HTTP method`;
  }
  const m = valid.find(m => m === method.toLowerCase());
  if (!m) {
    throw `"${method}" not allowed`;
  }
  return m;
}
/**
 * @private
 * Get
 * @param {Object} router - represents Express Router object.
 * @param {Object} model - represents model object.
 */
function get(path = '/', config = {}, router, model) {
  log(`get registration for ${model.modelName} at ${path}`);
  register(router, HTTP.GET, `${path === '/' ? '/': path+'/'}:id`, [getCollFn(model), ...(config.middlewares || []), ...(config.get || [])], getByIdHandler);
  register(router, HTTP.GET, path, [getCollFn(model), ...(config.middlewares || []), ...(config.get || [])], getHandler);
}
/**
 * @private
 * Post
 * @param {Object} router - represents Express Router object.
 * @param {Object} model - represents model object.
 */
function post(path = '/', config = {}, router, model) {
  log(`post registration for ${model.modelName} at ${path}`);
  register(router, HTTP.POST, path, [getCollFn(model), ...(config.middlewares || []), ...(config.post || [])], postHandler);
}
/**
 * @private
 * Put
 * @param {Object} router - represents Express Router object.
 * @param {Object} model - represents model object.
 */
function put(path = '/', config = {}, router, model) {
  log(`put registration for ${model.modelName} at ${path}`);
  register(router, HTTP.PUT, `${path === '/' ? '/': path+'/'}:id`, [getCollFn(model), ...(config.middlewares || []), ...(config.put || [])], putHandler);
}
/**
 * @private
 * Delete
 * @param {Object} router - represents Express Router object.
 * @param {Object} model - represents model object.
 */
function del(path = '/', config = {}, router, model) {
  log(`delete registration for ${model.modelName} at ${path}`);
  register(router, HTTP.DELETE, `${path === '/' ? '/': path+'/'}:id`, [getCollFn(model), ...(config.middlewares || []), ...(config.post || [])], removeByIdHandler);
}
/**
 * @private
 * Binds model to req object.
 * @param {Object} model - represents model object.
 * @returns {Function} - returns middleware function.
 */
function getCollFn(model) {
  return (req, res, next) => {
    req.collection = model;
    next();
  };
}
/**
 * @private
 * Get Handler
 * @param {Object} req - Express Request object.
 * @param {Object} res - Express Response object.
 * @param {Function} next - Express Next Function
 */
async function getHandler(req, res, next) {
  log(`getHandler for ${req.collection.name}`);
  const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const projection = req.query.projection || {};

  let results, err;
  try {
    results = await req.collection.find({}, projection, {
      skip,
      limit
    });
  } catch (error) {
    const code = 400;
    err = {
      error,
      code
    };
  }
  res.status(results ? 200 : 400).send(results || err);
}
/**
 * @private
 * Get By Id Handler
 * @param {Object} req - Express Request object.
 * @param {Object} res - Express Response object.
 * @param {Function} next - Express Next Function
 */
async function getByIdHandler(req, res, next) {
  log(`getByIdHandler for ${req.collection.name}`);
  const id = req.params.id;
  const projection = req.query.projection || {};
  let result, err;
  try {
    result = await req.collection.findById(id, projection);
  } catch (error) {
    const code = 400;
    err = {
      error,
      code
    };
  }
  res.status(result ? 200 : 400).send(result || err);
}
/**
 * @private
 * Delete By Id Handler
 * @param {Object} req - Express Request object.
 * @param {Object} res - Express Response object.
 * @param {Function} next - Express Next Function
 */
async function removeByIdHandler(req, res, next) {
  const _id = req.params.id;
  let result, err;
  try {
    result = await req.collection.findOneAndRemove({
      _id
    });
  } catch (error) {
    const code = 400;
    err = {
      error,
      code
    };
  }
  res.status(result ? 200 : 400).send(result || err);
}
/**
 * @private
 * Post Handler
 * @param {Object} req - Express Request object.
 * @param {Object} res - Express Response object.
 * @param {Function} next - Express Next Function
 */
async function postHandler(req, res, next) {
  const {
    body
  } = req;
  let result, err;
  try {
    const coll = new req.collection(body);
    result = await coll.save();
  } catch (error) {
    const code = 400;
    err = {
      error,
      code
    };
  }
  res.status(result ? 200 : 400).send(result || err);
}
/**
 * @private
 * Put Handler
 * @param {Object} req - Express Request object.
 * @param {Object} res - Express Response object.
 * @param {Function} next - Express Next Function
 */
async function putHandler(req, res, next) {
  const {
    body
  } = req;
  const _id = req.params.id;
  let result, err;
  try {
    result = await req.collection.findOneAndUpdate({
      _id
    }, {
      $set: body
    }, {
      new: true
    });
  } catch (error) {
    log(`error : ${error}`);
    const code = 400;
    err = {
      error,
      code
    };
  }
  res.status(result ? 200 : 400).send(result || err);
}
/**
 * @private
 * Validates router object
 * @param {Object} router - Express Router object.
 * @returns {Object} - returns Express Router object.
 */
function validateRouter(router) {
  if (!router || !(router instanceof Function)) {
    throw `"${router}" is not defined or is not a valid router object`;
  }
  return router;
}

module.exports = {
  register,
  validateMethod,
  validateRouter,
  get,
  post,
  put,
  del
};
