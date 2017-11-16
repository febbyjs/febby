const supertest = require('supertest');
const should = require('should');
const Febby = require('..');
var obj = {};
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
    }
};

const febby = new Febby();

febby.setConfig(config);
febby.setModels(models);
febby.setRoutes({
    '/': {
        'method': 'GET',
        'middlewares': [],
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

describe('testing basic crud', () => {
    let recId;
    it('should return welcome text', (done) => {
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

    it('insert a user document', (done) => {
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
    it('should return single document with id ', (done) => {
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
    it('should update document with id ', (done) => {
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
    it('should delete document with id ', (done) => {
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
    it('should return 404', (done) => {
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
    it('should insert a user document with username vasuvanka', (done) => {
        dbModel['users'].save({
            'username': 'vasuvanka',
            'firstname': 'vasu',
            'lastname': 'vanka'
        }).then((user) => {
            user.username.should.equal('vasuvanka');
            user.firstname.should.equal('vasu');
            user.lastname.should.equal('vanka');
            done();
        }).catch((err) => {
            console.log(err);
            throw err;
        });
    });
    it('should fail while insert a user document with username vasuvanka', (done) => {
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

    it('should return a user document with username vasuvanka', (done) => {
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

    it('should return all user documents', (done) => {
        dbModel['users'].find({}, {}, {}, 0, 0).then((users) => {
            users.length.should.not.equal(0);
            done();
        }).catch((err) => {
            throw err;
        });
    });

    it('should return all distinct usernames', (done) => {
        dbModel['users'].distinct({}, 'username').then((usernames) => {
            usernames[0].should.equal('vasuvanka');
            done();
        }).catch((err) => {
            throw err;
        });
    });

    it('should return count of all users with username as vasuvanka', (done) => {
        dbModel['users'].count({
            'username': 'vasuvanka'
        }).then((count) => {
            console.log(count);


            count.should.equal(1);
            done();
        }).catch((err) => {
            throw err;
        });
    });

    it('should return count of all users with username as vasuvanka', (done) => {
        dbModel['users'].remove({
            'username': 'vasuvanka'
        }).then(status => {
            console.log(status);
            status.n.should.equal(1);
            done();
        }).catch((err) => {
            throw err;
        });
    });


    // Tear down core after all tests are run
    after(function () {
        process.exit(0);
    });

});
// UNIT test end
