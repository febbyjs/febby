const {
  Febby
} = require('../dist');

const config = {
  port: 3000,
  db: {
    url: 'mongodb://localhost:27017/test'
  },
  appBaseUrl: '/hello'
}
const febby = new Febby(config);

const api = febby.router('/api');

const users = febby.model('users', {
  name: {
    type: String
  },
  firstname: {
    type: String
  }
});


const logActionOnUserCrud = (req, res, next) => {
  console.log(`${req.method}:${req.url}`);
  next()
}
febby.middleware(logActionOnUserCrud, api);


febby.crud('/users', {
  crud: true,
  middlewares: [logActionOnUserCrud]
}, users, api);

febby.route({
  router: api,
  path: '/',
  method: 'get',
  handler: (req, res) => {
    const message = 'welcome to febby.!';
    res.json({
      message
    })
  }
})

febby.bootstrap(() => {
  console.log(`Server started`)
});