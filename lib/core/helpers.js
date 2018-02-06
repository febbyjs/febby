const fs = require('fs');
const path = require('path');
module.exports.getSummery = (method, model) => {
    let summery;
    switch (method) {
        case 'get':
            summery = `List ${model} record(s) from ${model} collection`;
            break;
        case 'delete':
            summery = `Remove a ${model} record from the ${model} collection`;
            break;
        case 'post':
            summery = `Add a new ${model} record to the ${model} collection`;
            break;
        case 'put':
            summery = `Modify a ${model} record from the ${model} collection`;
            break;
        default:
            break;
    }
    return summery;
};

module.exports.getDataFormatTypes = (schemaPropObj) => {
    // console.log(schemaPropObj.type.schemaName);
    let typeObj = {
        'String': 'string',
        'Number': 'integer',
        'Boolean': 'boolean',
        'Object': 'object',
        'Array': 'array',
        'Date': 'date',
        'ObjectId': 'string'
    };
    let formatObj = {
        'date': 'date-time',
        'integer': 'int64'
    };
    let rObj = {
        type: typeObj[schemaPropObj.type.name],
        format: formatObj[typeObj[schemaPropObj.type.name]]
    };
    return rObj;
};

module.exports.createSwaggerJsonFile = (swagger) => {
    if (fs.existsSync(path.join(process.env.PWD, '.swagger.json'))) {
        try {
            fs.unlinkSync(path.join(process.env.PWD, '.swagger.json'));
        } catch (error) {
            throw error;
        }
    }
    fs.writeFile(path.join(process.env.PWD, '.swagger.json'), JSON.stringify(swagger), (e) => {
        if (e) throw e;
    });
};

module.exports.getMethodSummery = (method, model) => {
    let summery;
    switch (method) {
        case 'get':
            summery = `get a ${model} record by Id`;
            break;
        case 'delete':
            summery = `delete a ${model} record by Id`;
            break;
        case 'put':
            summery = `update a ${model} record by Id`;
            break;
        default:
            break;
    }
    return summery;
};

module.exports.getSchemaForModel = (model) => {
    return {
        'type': 'object',
        'properties': {
            'success': {
                'type': 'boolean',
                'default': 'true'
            },
            'data': {
                '$ref': `#/definitions/${model}`
            },
            'errors': {
                'type': 'array',
                'items': {
                    'type': 'string'
                }
            }
        }
    };
};

/**
 * Check for array of functions
 * @param {Array} middlewares -middleware array
 * @param {String} name -name of the route or model
 */
module.exports.funcCheck = (middlewares, name) => {
    for (let i = 0; i < middlewares.length; i++) {
        if (typeof middlewares[i] !== 'function')
            throw `${JSON.stringify(middlewares[i])} IS NOT A FUNCTION IN  '${name}' MIDDLEWARE DEFINITION`;
    }
};
