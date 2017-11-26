const supertest = require('supertest');
const should = require('should');
const Febby = require('..');
var obj = {};
const log = (req, res, next, models) => {
    console.log(req.url + '-' + req.method);
    next();
};
let config = {
    'port': 3000,
    // hostname of app 
    'host': '127.0.0.1',
    // application environment
    'env': 'development',
    // Base path for models
    'restBasePath': '/api/m',
    // Route Path for user defined Routes
    'routeBasePath': '/api/r',
    // MongoDB configuration
    'db': {
        // Default maximum number of records while querying , if limit doesn't pass.
        'limit': 30,
        // mongodb url
        'url': 'mongodb://localhost:27017/test1'
    },
    // body-parser maximum body object size 
    'jsonParserSize': '100kb'
};

let models = {
    user: {
        methods: {
            all: true,
            middlewares: []
        },
        schema: {
            username: {
                type: String,
                required: true
            },
            firstname: {
                type: String
            },
            lastname: {
                type: String
            }
        }
    },
    book: {
        methods: {
            all: false,
            middlewares: [log],
            GET: {
                middlewares: [{}]
            }
        },
        schema: {
            name: {
                type: String,
                required: true
            },
            author: {
                type: String
            },
            cost: {
                type: Number
            },
            username: {
                type: require('mongoose').Schema.Types.ObjectId,
                ref: 'users'
            }
        }
    },
    author: {
        methods: {
            all: true,
            middlewares: [{}],
        },
        schema: {
            name: {
                type: String,
                required: true
            }
        }
    }

};

const febby = new Febby();

febby.setConfig(config);
febby.setModels(models);
febby.setRoutes({
    '/': {
        'method': 'GET',
        'middlewares': [log],
        'handler': (req, res, next, models) => {
            res.json({
                'success': true,
                'data': 'welcome to febby',
                'errors': []
            });
        }
    },
    '/test': {
        'method': 'GET',
        'middlewares': [],
        'handler': {}
    },
    '/test1': {
        'method': 'GET',
        'middlewares': [{}],
        'handler': (req, res, next, models) => {
            res.json({
                'success': true,
                'data': 'welcome to febby',
                'errors': []
            });
        }
    }
});

febby.createApp();
let dbModel = febby.getModels();
// This agent refers to PORT where program is runninng.

const server = supertest.agent('http://localhost:3000');

// UNIT test begin

// unit test description

describe('unit testing febby framework', () => {
    let recId, userId, bookId;
    // unit test cases for basic routes
    it('should return welcome text', done => {
        server
            .get('/api/r/')
            .expect('Content-type', 'application/json; charset=utf-8')
            .expect(200)
            .end((err, res) => {
                res.status.should.equal(200);
                let error = JSON.stringify(res.body.errors);
                error.should.equal('[]');
                res.body.data.should.equal('welcome to febby');
                res.body.success.should.equal(true);
                done();
            });
    });
    // POST 
    it('insert a user document', done => {
        server
            .post('/api/m/users')
            .send({
                'username': 'vasuvanka',
                'firstname': 'vasu',
                'lastname': 'vanka'
            })
            .expect('Content-type', 'application/json; charset=utf-8')
            .expect(200)
            .end((err, res) => {
                res.status.should.equal(200);
                let error = JSON.stringify(res.body.errors);
                error.should.equal('[]');
                res.body.success.should.equal(true);
                recId = res.body.data._id;
                done();
            });
    });
    // POST fail with empty body
    it('insert a empty object into user', done => {
        server
            .post('/api/m/users')
            .send({})
            .expect('Content-type', 'application/json; charset=utf-8')
            .expect(400)
            .end((err, res) => {
                res.status.should.equal(400);
                let error = res.body.errors[0];
                error.should.equal('INVALID CONTENT');
                res.body.success.should.equal(false);
                done();
            });
    });
    // GET doc with Id
    it('should return single document with id ', done => {
        server
            .get('/api/m/users/' + recId)
            .expect(200)
            .end((err, res) => {
                // response should equal to 200
                res.status.should.equal(200);
                // checking the error for success case
                let error = JSON.stringify(res.body.errors);
                error.should.equal('[]');
                // response status is true if success ,on error it will return false
                res.body.success.should.equal(true);
                done();
            });
    });
    // PUT
    it('should update document with id ', done => {
        server
            .put('/api/m/users/' + recId)
            .send({
                'firstname': 'vicky',
                'lastname': 'martin'
            })
            .expect(200)
            .end((err, res) => {
                // response should equal to 200
                res.status.should.equal(200);
                // checking the error for success case
                let error = JSON.stringify(res.body.errors);
                error.should.equal('[]');
                // response status is true if success ,on error it will return false
                res.body.success.should.equal(true);
                done();
            });
    });
    // PUT fail
    it('should update fail without id ', done => {
        server
            .put('/api/m/users/')
            .send({
                'firstname': 'vicky',
                'lastname': 'martin'
            })
            .expect(400)
            .end((err, res) => {
                res.status.should.equal(400);
                let error = res.body.errors[0];
                error.should.equal('MISSING ID');
                res.body.success.should.equal(false);
                done();
            });
    });
    //PUT fail by id
    it('should fail update document with id ', done => {
        server
            .put('/api/m/users/' + recId)
            .send({})
            .expect(200)
            .end((err, res) => {
                res.status.should.equal(400);
                let error = res.body.errors[0];
                error.should.equal('INVALID CONTENT');
                res.body.success.should.equal(false);
                done();
            });
    });
    // DELETE
    it('should delete document with id ', done => {
        server
            .delete('/api/m/users/' + recId)
            .expect(200)
            .end((err, res) => {
                // response should equal to 200
                res.status.should.equal(200);
                // checking the error for success case
                let error = JSON.stringify(res.body.errors);
                error.should.equal('[]');
                // response status is true if success ,on error it will return false
                res.body.success.should.equal(true);
                done();
            });
    });
    // DELETE fail
    it('should delete fail without id ', done => {
        server
            .delete('/api/m/users/')
            .send({
                'firstname': 'vicky',
                'lastname': 'martin'
            })
            .expect(400)
            .end((err, res) => {
                res.status.should.equal(400);
                let error = res.body.errors[0];
                error.should.equal('MISSING ID');
                res.body.success.should.equal(false);
                done();
            });
    });
    it('should return 404', done => {
        server
            .get('/random')
            .expect(404)
            .end((err, res) => {
                // response should equal to 200
                res.status.should.equal(404);
                // checking the error for success case
                let error = JSON.stringify(res.body.errors);
                error.should.equal('["NOT FOUND"]');
                // response data should match welcome text
                let data = JSON.stringify(res.body.data);
                data.should.equal('{}');
                // response status is true if success ,on error it will return false
                res.body.success.should.equal(false);
                done();
            });
    });
    it('should return 405', done => {
        server
            .patch('/api/m/users/')
            .expect(405)
            .end((err, res) => {
                // response should equal to 200
                res.status.should.equal(405);
                res.body.errors[0].should.equal('METHOD NOT ALLOWED');
                res.body.success.should.equal(false);
                done();
            });
    });
    it('should return 409', done => {
        server
            .get('/api/r/test1')
            .expect(409)
            .end((err, res) => {
                res.status.should.equal(409);
                res.body.errors[0].should.equal('INVALID METHOD MIDDLEWARE DECLARATION');
                res.body.success.should.equal(false);
                done();
            });
    });
    it('should return 404 for custom route', done => {
        server
            .get('/api/r/test/test/a')
            .expect(404)
            .end((err, res) => {
                res.status.should.equal(404);
                res.body.errors[0].should.equal('NOT FOUND');
                res.body.success.should.equal(false);
                done();
            });
    });
    it('should return 409 for rest route', done => {
        server
            .get('/api/m/authors')
            .expect(409)
            .end((err, res) => {
                res.status.should.equal(409);
                res.body.errors[0].should.equal('INVALID MIDDLEWARE DECLARATION');
                res.body.success.should.equal(false);
                done();
            });
    });
    it('should return 409 for rest route', done => {
        server
            .get('/api/m/authors')
            .expect(409)
            .end((err, res) => {
                res.status.should.equal(409);
                res.body.errors[0].should.equal('INVALID MIDDLEWARE DECLARATION');
                res.body.success.should.equal(false);
                done();
            });
    });
    it('should return 409 for rest route', done => {
        server
            .get('/api/m/books')
            .expect(409)
            .end((err, res) => {
                res.status.should.equal(409);
                res.body.errors[0].should.equal('INVALID METHOD MIDDLEWARE DECLARATION');
                res.body.success.should.equal(false);
                done();
            });
    });
    it('should return 403', done => {
        server
            .get('/api/r/test')
            .expect(403)
            .end((err, res) => {
                res.status.should.equal(403);
                res.body.errors[0].should.equal('NOT A VALID REQ. HANDLER');
                res.body.success.should.equal(false);
                done();
            });
    });
    it('should return 400', done => {
        server
            .get('/api/m/vasu')
            .expect(400)
            .end((err, res) => {
                res.status.should.equal(400);
                res.body.errors[0].should.equal('\'VASU\' NOT CONFIGURED');
                res.body.success.should.equal(false);
                done();
            });
    });
    // Unit test cases for queries
    // save
    it('should insert a user document with username vasuvanka', done => {
        dbModel['users'].save({
            'username': 'vasuvanka',
            'firstname': 'vasu',
            'lastname': 'vanka'
        }).then((user) => {
            user.username.should.equal('vasuvanka');
            user.firstname.should.equal('vasu');
            user.lastname.should.equal('vanka');
            userId = user._id;
            done();
        }).catch((err) => {
            //console.log(err);
            throw err;
        });
    });
    it('should insert a book document with autor vasu vanka', done => {
        dbModel['books'].save({
            'name': 'febby framework',
            'author': 'vasu vanka',
            'cost': 0,
            'username': userId
        }).then((books) => {
            books.name.should.equal('febby framework');
            books.author.should.equal('vasu vanka');
            books.cost.should.equal(0);
            books.username.should.equal(userId);
            bookId = books._id;
            done();
        }).catch((err) => {
            throw err;
        });
    });
    // save fail
    it('should fail while insert a user document with username vasuvanka', done => {
        dbModel['users'].save({
            'firstname': 'vasu',
            'lastname': 'vanka'
        }).then((user) => {
            throw 'username is required';
        }).catch((err) => {
            err.message.should.equal('users validation failed: username: Path `username` is required.');
            done();
        });
    });
    // findOne 
    it('should return a user document with username vasuvanka using findOne', done => {
        dbModel['users'].findOne({
            'username': 'vasuvanka'
        }, {}).then((user) => {
            user.username.should.equal('vasuvanka');
            user.firstname.should.equal('vasu');
            user.lastname.should.equal('vanka');
            done();
        }).catch((err) => {
            throw err;
        });
    });
    // findOne fail
    it('should fail to get document by findOne ', done => {
        dbModel['users'].findOne({
            'username': 'vasu'
        }, {}).then((user) => {
            throw 'test passes , it should fail';
        }).catch((err) => {
            err.message.should.equal('No documents found with query {"username":"vasu"}');
            done();
        });
    });
    // find
    it('should return all user documents', done => {
        dbModel['users'].find({}, {}, {}, 0, 0).then((users) => {
            users.length.should.not.equal(0);
            done();
        }).catch((err) => {
            throw err;
        });
    });
    // findRef
    it('should return all books with user object', done => {
        dbModel['books'].findRef({}, {}, {
            'username': ['firstname']
        }, {}, 0, 0).then((books) => {
            done();
        }).catch((err) => {
            throw err;
        });
    });
    // update 
    it('should update firstname as vicky where username is vasuvanka', done => {
        dbModel['users'].update({
            'username': 'vasuvanka'
        }, {
            'firstname': 'vicky'
        }, false, false).then((user) => {
            user.username.should.equal('vasuvanka');
            user.firstname.should.equal('vicky');
            user.lastname.should.equal('vanka');
            done();
        }).catch((err) => {
            throw err;
        });
    });
    // update fail
    it('should fail to  update firstname as vicky where username is vasu', done => {
        dbModel['users'].update({
            'username': 'vasu'
        }, {
            'firstname': 'vicky'
        }, false, false).then((user) => {
            throw 'should throw error';
        }).catch((err) => {
            err.message.should.equal('No documents found with query {"username":"vasu"}');
            done();
        });
    });
    // increment
    it('should increment count by 1 where username is vasuvanka', done => {
        dbModel['books'].increment({
            '_id': bookId
        }, {
            'cost': 1
        }, false, false).then((book) => {
            book.n.should.equal(1);
            book.nModified.should.equal(1);
            book.ok.should.equal(1);
            done();
        }).catch((err) => {
            throw err.message;
        });
    });
    // increment fail
    it('should increment count by 1 where username is vasuvanka', done => {
        dbModel['books'].increment({
            '_id': bookId
        }, {
            'costs': 1
        }, false, false).then((book) => {
            throw 'it should fail';
        }).catch((err) => {
            done();
        });
    });
    // distinct
    it('should return all distinct usernames', done => {
        dbModel['users'].distinct({}, 'username').then((usernames) => {
            usernames[0].should.equal('vasuvanka');
            done();
        }).catch((err) => {
            throw err;
        });
    });
    //count
    it('should return count of all users with username as vasuvanka', done => {
        dbModel['users'].count({
            'username': 'vasuvanka'
        }).then((count) => {
            count.should.equal(1);
            done();
        }).catch((err) => {
            throw err;
        });
    });
    // remove
    it('should remove users with username as vasuvanka', done => {
        dbModel['users'].remove({
            'username': 'vasuvanka'
        }).then(status => {
            done();
        }).catch((err) => {
            throw err;
        });
    });
    it('it should use app ', done => {
        let app = febby.getApp();
        app.use((req, res, next) => {
            console.log('added middleware');
            next();
        });
        done();
    });
    it('it should use runMiddleware ', done => {
        febby.runMiddleware((req, res, next) => {
            console.log('runMiddleware used');
            next();
        });
        done();
    });
    // Tear down core after all tests are run
    after(() => process.exit(0));

});
// UNIT test end
