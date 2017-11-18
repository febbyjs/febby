/*!
 * febby
 * Copyright(c) 2017 Vasu Vanka
 * MIT Licensed
 */
const mongoose = require('mongoose');

/**
 * Represents Query - conatins customized queries on top of mongoose query object
 * @description  Here is the supported methods findById, findOne, find, findRef, save, update, increment, distinct, count, remove
 */
class Query {
    /**
     * @private
     * Will Create a Query Object for a mongoose model
     * @param {*} collection - mongoose collection name
     */
    constructor(collection) {
        this.collection = collection;
    }

    /**
     * findById query to get a document based on id field
     * @param {ObjectId} id - mongodb ObjectId
     * @param {Object} selectionFields - Object represents required fields and non required fields .ex: {firstname:1,lastname:0}
     * @returns {Promise.<Object|Error>} Collection document if found,
     * or an error if rejected.
     * @example
     *
     * // modelname is pluralized
     * // when ever you are using models , model names are always plurals.
     * let id  = '59f5edd03849b92e40fadf7c';
     * let selectedFieldsObj = {'username':1,'lastname':0};
     * // key with value 0 is omitted
     * // key with value 1 is fetched
     * models.users.findById(id,selectedFieldsObj).then((doc)=>{
     *      log(doc);
     * }).catch((err)=>{
     *      log(err);
     * })
     */
    findById(id, selectionFields) {
        let selObj = selectionFields || {};
        return new Promise((resolve, reject) => {
            let Model = mongoose.model(this.collection);
            Model.findById(id, selObj, (err, doc) => {
                if (err)
                    reject(err);
                else {
                    if (doc) {
                        resolve(doc);
                    } else {
                        reject(new Error(`No document found with given id :: ${id}`));
                    }
                }
            });
        });
    }

    /**
     * findOne query to get a document based given query
     * @param {Object} query - query object conatins user mongodb query object. ex: {'firstname':'vasu'}
     * @param {Object} selectionFields - Object represents required fields and non required fields .ex: {firstname:1,lastname:0}
     * @returns {Promise.<Object|Error>} Collection document if found,
     * or an error if rejected.
     * @example
     *
     * // modelname is pluralized
     * // when ever you are using models , model names are always plurals.
     * let query  = {'username':'vasuvanka'};
     * let selectedFieldsObj = {'username':1,'lastname':0};
     * // key with value 0 is omitted
     * // key with value 1 is fetched
     * models.users.findOne(query,selectedFieldsObj).then((doc)=>{
     *      log(doc);
     * }).catch((err)=>{
     *      log(err);
     * })
     */
    findOne(query, selectionFields) {
        let selObj = selectionFields || {};
        return new Promise((resolve, reject) => {
            let Model = mongoose.model(this.collection);
            Model.findOne(query, selObj, (err, doc) => {
                if (!err && doc)
                    resolve(doc);
                else
                    reject(err || new Error('No documents found with query ' + JSON.stringify(query)));
            });
        });
    }

    /**
     * find query to get the records of a collection by given mongodb query
     * @param {Object} query - mongodb query
     * @param {Object} selectionFields - selection object
     * @param {Object} sortBy - sort object. ex: {createdAt:-1}
     * @param {number} skip  - skip number of records , default value is 0
     * @param {number} limit - limit the result of your query by default limit is set to 30
     * @returns {Promise.<Object|Error>} Collection documents if found,
     * or an error if rejected.
     * @example
     *
     * // modelname is pluralized
     * // when ever you are using models , model names are always plurals.
     * let query  = {'username':'vasuvanka'};
     * let selectedFieldsObj = {'username':1,'lastname':0};
     * let skip = 0;  // skip number of records
     * let limit = 10; //0 to get all queried records
     * let sortBy = {'firstname':1}; // -1 for descending order
     * // key with value 0 is omitted
     * // key with value 1 is fetched
     * models.users.find(query, selectedFieldsObj, sortBy, skip, limit).then((doc)=>{
     *      log(doc);
     * }).catch((err)=>{
     *      log(err);
     * })
     */
    find(query, selectionFields, sortBy, skip, limit) {
        return new Promise((resolve, reject) => {
            let selObj = selectionFields || {};
            let Model = mongoose.model(this.collection);
            Model.find(query, selObj).sort(sortBy || {})
                .skip(skip || 0)
                .limit(limit || 0)
                .exec((err, docs) => {
                    if (!err && docs) {
                        resolve(docs);
                    } else
                        reject(err || new Error('No documents found with query ' + JSON.stringify(query)));
                });
        });
    }

    /**
     * findRef query to get refrenced documents from Other collection
     * @param {Object} query - query object
     * @param {Object} selectionFields - selection object for query
     * @param {Object} refObj - ref object contains an array of selected fields of Other collection .
     * ex: refObj = {'collection_key1':['name','email'],'collection_key2':['name','email']...}
     * @param {Object} sortBy - sortby Object to filter result
     * @param {number} skip - skip number of records , by deafult it is 0
     * @param {number} limit - limit the result of your query by default limit is set to 30
     * @returns {Promise.<Object|Error>} Collection documents if found,
     * or an error if rejected.
     * @example
     *
     * // modelname is pluralized
     * // when ever you are using models , model names are always plurals.
     * let query  = {'username':'vasuvanka'};
     * let selectedFieldsObj = {'username':1,'lastname':0};
     * let skip = 0;  // skip number of records
     * let limit = 10; //0 to get all queried records
     * let sortBy = {'firstname':1}; // -1 for descending order
     * // key with value 0 is omitted
     * // key with value 1 is fetched
     * let refObj = {'user_id':['username','firstname']}
     * // needed full document of other collection then just pass empty array
     * // refObj = {'user_id':[]}
     * // if i need two documents from different collections then
     * // refObj = {'user_id':[],'username':[]}
     * // ref mongoose for schema configuration
     * models.users.findRef(query, selectedFieldsObj, refObj, sortBy, skip, limit).then((doc)=>{
     *      log(doc);
     * }).catch((err)=>{
     *      log(err);
     * })
     */
    findRef(query, selectionFields, refObj, sortBy, skip, limit) {
        return new Promise((resolve, reject) => {
            let selObj = selectionFields || {};
            let refObjs = refObj || {};
            let Model = mongoose.model(this.collection);
            let model = Model.find(query, selObj);
            model.sort(sortBy || {})
                .skip(skip || 0)
                .limit(limit || 0);
            for (let ref in refObjs) {
                let list = refObjs[ref];
                if (list.constructor !== Array) {
                    reject(new Error('Selection fields must be an array of strings'));
                }
                if (list.length > 0)
                    model.populate(ref, list.join(' '));
                else
                    model.populate(ref);
            }
            model.exec((err, docs) => {
                if (!err && docs)
                    resolve(docs);
                else
                    reject(err || new Error('No documents found with query ' + JSON.stringify(query)));
            });
        });
    }

    /**
     * save a document to a collection
     * @param {Object} data - json object
     * @returns {Promise.<Object|Error>}  document if saved,
     * or an error if rejected.
     * @example
     *
     * // modelname is pluralized
     * // when ever you are using models , model names are always plurals.
     * let data  = {'username':'vasuvanka','firstname':'vasu','lastname':'vanka'};
     * models.users.save(data).then((doc)=>{
     *      log(doc);
     * }).catch((err)=>{
     *      log(err);
     * })
     * @description Save the data.
     */
    save(data) {
        return new Promise((resolve, reject) => {
            let Model = mongoose.model(this.collection);
            data.createdAt = Date.now();
            data.updatedAt = Date.now();
            let createDoc = new Model(data);
            createDoc.save((err, doc) => {
                if (err)
                    reject(err);
                else
                    resolve(doc);
            });
        });
    }

    /**
     * update query matched documents
     * @param {Object} query - query object
     * @param {Object} data - data object
     * @param {boolean} isMultiple - if true it will update to all matched documents, if false only update to first matched document, default value is false
     * @param {boolean} isUpsert - if true it will create new record if none of the records matched .default value is false
     * @returns {Promise.<Object|Error>}  document status if updated,
     * or an error if rejected.
     * @example
     * // modelname is pluralized
     * // when ever you are using models , model names are always plurals.
     * let query  = {'username':'vasuvanka'};
     * let data = {'firstname':'vicky','lastname':'martin'};
     * let isMultiple = false; // update applied to only first matched document , if true then applied all matched documents
     * let upsert = true; // if true then there is document matched then it will create a document , if false no record created
     *  models.users.update(query, data, isMultiple, upsert).then((doc)=>{
     *      log(doc);
     * }).catch((err)=>{
     *      log(err);
     * })
     * @description Update matched Document(s);
     */
    update(query, data, isMultiple, isUpsert) {
        return new Promise((resolve, reject) => {
            data.updatedAt = Date.now();
            let Model = mongoose.model(this.collection);
            Model.update(query, data, {
                'multi': isMultiple || false,
                'upsert': isUpsert || false
            }).exec((err, docs) => {
                if (err)
                    reject(err);
                else {
                    let strQ = JSON.stringify(query);
                    if (docs.nModified > 0 && docs.n > 0) {
                        Model.find(query, {}, (err, resultDocs) => {
                            if (!err && resultDocs) {
                                let result = resultDocs.length == 1 ? resultDocs[0] : resultDocs;
                                resolve(result);
                            } else {
                                reject(err || new Error('Error While fetching documents with query ' + strQ));
                            }
                        });
                    } else {
                        if (docs.n == 0) {
                            return reject(new Error('No documents found with query ' + strQ));
                        }
                    }
                }
            });

        });
    }

    /**
     * increment query matched documents
     * @param {Object} query - query object
     * @param {Object} data - data object
     * @param {boolean} isMultiple - if true it will update to all matched documents, if false only update to first matched document, default value is false
     * @param {boolean} isUpsert - if true it will create new record if none of the records matched .default value is false
     * @returns {Promise.<Object|Error>}  document status if updated,
     * or an error if rejected.
     * @example
     * // modelname is pluralized
     * // when ever you are using models , model names are always plurals.
     * let query  = {'username':'vasuvanka'};
     * let data = {'amount':1};
     * let isMultiple = false; // update applied to only first matched document , if true then applied all matched documents
     * let upsert = true; // if true then there is document matched then it will create a document , if false no record created
     * // will increment amount of matched document field by +1
     *  models.users.increment(query, data, isMultiple, upsert).then((doc)=>{
     *      log(doc);
     * }).catch((err)=>{
     *      log(err);
     * })
     * @description Increment/Decrement a number by +/- any number. ex: 10 or -10
     * */
    increment(query, data, isMultiple, isUpsert) {
        return new Promise((resolve, reject) => {
            let Model = mongoose.model(this.collection);
            Model.update(query, {
                $inc: data,
                updatedAt: Date.now()
            }, {
                'multi': isMultiple || false,
                'upsert': isUpsert || false
            }).exec((err, docs) => {
                if (err)
                    reject(err);
                else
                    resolve(docs);
            });
        });
    }

    /**
     * distinct key values will be returned based on given query
     * @param {Object} query - query object
     * @param {string} field - field or key name
     * @returns {Promise.<Object|Error>}  documents if found,
     * or an error if rejected.
     * @example
     * // modelname is pluralized
     * // when ever you are using models , model names are always plurals.
     * let query  = {'username':'vasuvanka'};
     * let field = "firstname";
     *  models.users.distinct(query, field).then((doc)=>{
     *      log(doc);
     * }).catch((err)=>{
     *      log(err);
     * })
     * @description Return all distnict field values
     */
    distinct(query, field) {
        return new Promise((resolve, reject) => {
            let Model = mongoose.model(this.collection);
            Model.distinct(field, query).exec((err, docs) => {
                if (err)
                    reject(err);
                else
                    resolve(docs);
            });
        });
    }

    /**
     * removes matched documents
     * @param {Object} query - query object
     * @returns {Promise.<Object|Error>}  document status if removed,
     * or an error if rejected.
     * @example
     * // modelname is pluralized
     * // when ever you are using models , model names are always plurals.
     * let query  = {'username':'vasuvanka'};
     *  models.users.remove(query).then((doc)=>{
     *      log(doc);
     * }).catch((err)=>{
     *      log(err);
     * })
     * @description Remove all matched documents
     */
    remove(query) {
        return new Promise((resolve, reject) => {
            let Model = mongoose.model(this.collection);
            Model.remove(query).exec((err, docs) => {
                if (err)
                    reject(err);
                else
                    resolve(docs);
            });
        });
    }

    /**
     * count documents
     * @param {Object} query - query object
     * @returns {Promise.<Object|Error>}  count of matched record query,
     * or an error if rejected.
     * @example
     * // modelname is pluralized
     * // when ever you are using models , model names are always plurals.
     * let query  = {'username':'vasuvanka'};
     *  models.users.count(query).then((doc)=>{
     *      log(doc);
     * }).catch((err)=>{
     *      log(err);
     * })
     * @description Count matched documents
     */
    count(query) {
        return new Promise((resolve, reject) => {
            let Model = mongoose.model(this.collection);
            Model.count(query).exec((err, count) => {
                if (err)
                    reject(err);
                else
                    resolve(count);
            });
        });
    }
}

module.exports = Query;
