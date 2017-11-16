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
let mod = febby.getModels();
// This agent refers to PORT where program is runninng.

const server = supertest.agent('http://localhost:3000');

// UNIT test begin

// unit test description

describe('testing basic crud', () => {
    let recId;
    before('inserting single record', (done) => {
        console.log('......');

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
                console.log(res.body, '');
                recId = res.body._id;
                done();
            });
    });
    describe('unit test cases for febby server', () => {
        // unit test for default / url
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
                    setTimeout(function () {
                        done();
                    }, 10);
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
                    setTimeout(function () {
                        done();
                    }, 10);
                });
        });
        it('should return single document with id : ', (done) => {
            console.log(recId);

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
                    return done();
                });
        });
        it('should update document with id : ', (done) => {
            console.log(recId);
            server
                .put('/api/m/users/' + recId)
                .data({
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
                    return done();
                });
        });
        it('should delete document with id : ' + recId, (done) => {
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
                    return done();
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
                    return done();
                });
        });
        // Tear down core after all tests are run
        after(function () {
            process.exit(0);
        });

    });
});
// UNIT test end
