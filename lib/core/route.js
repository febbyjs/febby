/*!
 * febby
 * Copyright(c) 2017 Vasu Vanka
 * MIT Licensed
 */
/**
 * @private
 * Class Representing Route
 */
class ProcessRoute {
    /**
     * create a Route
     * @param {Object} vanku - Vanku class obejct
     */
    constructor(vanku) {
        this.vanku = vanku;
    }

    /**
     * Process REST calls
     * @param {Object} req - Expressjs Request Obejct
     * @param {string} pModel - pluralized model name
     * @param {Function} cb - callback function of a request
     */
    processRestMethods(req, pModel, cb) {
        let id = req.params['id'] || null;
        if (!id && (req.method === 'DELETE' || req.method === 'PUT')) {
            return cb(this.vanku.error.getError(400, 'MISSING ID'));
        }
        if (id && req.method == 'POST') {
            return cb(this.vanku.error.get400());
        }
        if ((!req.body || Object.keys(req.body).length == 0) && (req.method === 'POST' || req.method === 'PUT')) {
            return cb(this.vanku.error.get400());
        }
        let skip = req.query['skip'] || 0;
        let limit = req.query['limit'] || 30;
        skip = parseInt(skip);
        limit = parseInt(limit);
        let model;
        switch (req.method) {
            case 'GET':
                if (id) {
                    model = this.vanku.dbModels[pModel].findById(id, {});
                } else {
                    model = this.vanku.dbModels[pModel]
                        .find({}, {}, {
                            'created_at': -1
                        }, skip, limit);
                }
                model.then((docs) => {
                    return cb(null, {
                        'success': true,
                        'data': docs,
                        'errors': []
                    });
                }).catch(err => {
                    return cb(this.vanku.error.getError(400, err.message));
                });
                break;
            case 'POST':
                this.vanku.dbModels[pModel].save(req.body).then(doc => {
                    return cb(null, {
                        'success': true,
                        'data': doc,
                        'errors': []
                    });
                }).catch(err => {
                    return cb(this.vanku.error.getError(400, err.message));
                });
                break;
            case 'PUT':
                this.vanku.dbModels[pModel].update({
                    _id: id
                }, req.body, false, false).then(doc => {
                    return cb(null, {
                        'success': true,
                        'data': doc,
                        'errors': []
                    });
                }).catch(err => {
                    return cb(this.vanku.error.getError(400, err.message));
                });
                break;
            case 'DELETE':
                this.vanku.dbModels[pModel]
                    .remove({
                        _id: id
                    }).then(doc => {
                        return cb(null, {
                            'success': true,
                            'data': doc,
                            'errors': []
                        });
                    }).catch(err => {
                        return cb(this.vanku.error.getError(400, err.message));
                    });
                break;
            default:
                return cb(this.vanku.error.get400());
        }
    }
}

module.exports = ProcessRoute;
