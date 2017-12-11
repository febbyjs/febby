## Febby

Febby - Configuration based NodeJs Framework

REST with custom Route support and Method specific Middleware configuration

# Status
|Branch     |Build Status|Coverage  |Npm        |Dependencies|
|-----------|-----------|-----------|-----------|-----------|
| Master    |[![Build Status](https://travis-ci.org/febbyjs/febby.svg?branch=master)](https://travis-ci.org/febbyjs/febby)  | [![Coverage Status](https://coveralls.io/repos/github/febbyjs/febby/badge.svg?branch=master)](https://coveralls.io/github/febbyjs/febby?branch=master)|[![npm version](https://badge.fury.io/js/febby.svg?branch=master)](https://badge.fury.io/js/febby)|[![dependencies Status](https://david-dm.org/febbyjs/febby/status.svg?branch=master)](https://david-dm.org/febbyjs/febby)|
| Develop   |[![Build Status](https://travis-ci.org/febbyjs/febby.svg?branch=develop)](https://travis-ci.org/febbyjs/febby) |[![Coverage Status](https://coveralls.io/repos/github/febbyjs/febby/badge.svg?branch=develop)](https://coveralls.io/github/febbyjs/febby?branch=develop)|[![npm version](https://badge.fury.io/js/febby.svg?branch=develop)](https://badge.fury.io/js/febby)|[![dependencies Status](https://david-dm.org/febbyjs/febby/status.svg?branch=develop)](https://david-dm.org/febbyjs/febby)|

## API Documentation

API Documentation: https://febbyjs.github.io/febby

### Table of Contents

-   [Febby](#febby)
    -   [createApp](#createapp)
    -   [setConfig](#setconfig)
    -   [setModels](#setmodels)
    -   [setRoutes](#setroutes)
    -   [runMiddleware](#runmiddleware)
    -   [getModels](#getmodels)
    -   [getApp](#getapp)
-   [Query](#query)
    -   [findById](#findbyid)
    -   [findOne](#findone)
    -   [find](#find)
    -   [findRef](#findref)
    -   [save](#save)
    -   [update](#update)
    -   [increment](#increment)
    -   [distinct](#distinct)
    -   [remove](#remove)
    -   [count](#count)

**Examples**

```javascript
npm install febby --save
```

```javascript
const Febby = require('febby');
```

```javascript
const febby = new Febby();
```

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Returns Febby Object

### createApp

creates An Express App

**Examples**

```javascript
// make sure you configured models and config object before calling this method

const Febby = require('febby');

const config= require('./config');
const models = require('./models');
const routes = require('./routes');

 const febby = new Febby();

febby.setConfig(config);
febby.setModels(models);
febby.setRoutes(routes);

febby.createApp();
```

### setConfig

set Config Object before calling febby.createApp()

**Parameters**

-   `config` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

**Examples**

```javascript
let config = {
 'port': 3000,
 // Application base path
 'basePath': '/api/v1',
 // REST Path for models
 'restBasePath': '/model', // /api/v1/model
 // Route Path for user defined Routes
 'routeBasePath': '/route', // /api/v1/route
 // MongoDB configuration
 'db': {
     // mongodb url
   'url': 'mongodb://localhost:27017/test'
 },
 // app will run cluter mode if set true , default value is true
 'clusterMode': false
};

febby.setConfig(config);
```

### setModels

Set Model Object

**Parameters**

-   `models` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

**Examples**

```javascript
let user = {
    methods: {
        crud: false, // false enables user to define specific method , default value is true makes crud enable on the modal
        middlewares: [ ValidateUser ], //  will run for all enabled methods. array may contain list of functions
        get: [], // get value array represents middleware function
        post: [ hasPermission ],
        put: []
    },
     // it is mongoose schema,
     // by default createdAt , updatedAt keys of type Date is enabled to each and every model
     // date and time of document creation and update are automatically done  
    schema: {
        username: {
            type: String,
            required: true,
            unique: true
        },
        firstname: {
            type: String
        },
        lastname: {
            type: String
        },
        email: {
            type: String,
            unique: true
        }
    }
};

let models = {
     'user': user
};

febby.setModels(models);

// set models before calling febby.createApp()
```

### setRoutes

Set Routes Object

**Parameters**

-   `routes` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

**Examples**

```javascript
//For Every Route Handler will have following arguments
//models contain all database collection modals 
let loginHandler = (request, response, next, models) => { 
     let username = request.body.username
     let password = request.body.password
     // will handle user login logic here
     models.users.findOne({'username':username},{}).
         then((doc)=>{
         // validate the user and respond
         }).catch((error)=>{
             next(error);
         })
     };
 }

 let routes =  {
     '/login': {
         'post': {
             'middlewares': [],
             'handler': loginHandler
         },
         'get': {
             'middlewares': [],
             'handler': (req,res,next,models)=>{
                 res.json({'data':'hello world'});
             }
         }
     }
 };

febby.setRoutes(routes);

// set routes before calling febby.createApp()
```

### runMiddleware

Provides ability to run configure middleware functions .

**Parameters**

-   `middlewareFunc` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** 

**Examples**

```javascript
//Simple Logger

const logger = (req, res, next) => {
     console.info(req.method+' : '+req.url);
     next();
}

febby.runMiddleware(logger);

** Make Sure You must pass request object to next by calling next callback
```

### getModels

Returns Defined Models as an Object

**Examples**

```javascript
// Getting Models of an Application , Model names are always Plural

let models = febby.getModels();

models.users.findOne({'username':'vanku'},{}).then((user)=>{
 //Handle user logic
 }).catch((err)=>{
 //handle error
})

//now you can use models obejct throught application
```

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** returns Object of models

### getApp

Returns Express App Object

**Examples**

```javascript
// Returns Express App Object
let app = febby.getApp();

app.use((req, res, next) => {
     console.info(req.method+' : '+req.url);
     next();
})
```

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** App Obejct

## Query

Here is the supported methods findById, findOne, find, findRef, save, update, increment, distinct, count, remove

**Parameters**

-   `collection`  

### findById

findById query to get a document based on id field

**Parameters**

-   `id` **ObjectId** mongodb ObjectId
-   `selectionFields` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Object represents required fields and non required fields .ex: {firstname:1,lastname:0}

**Examples**

```javascript
// modelname is pluralized
// when ever you are using models , model names are always plurals.
let id  = '59f5edd03849b92e40fadf7c';
let selectedFieldsObj = {'username':1,'lastname':0};
// key with value 0 is omitted
// key with value 1 is fetched
models.users.findById(id,selectedFieldsObj).then((doc)=>{
     log(doc);
}).catch((err)=>{
     log(err);
})
```

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error))>** Collection document if found,
or an error if rejected.

### findOne

findOne query to get a document based given query

**Parameters**

-   `query` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** query object conatins user mongodb query object. ex: {'firstname':'vasu'}
-   `selectionFields` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Object represents required fields and non required fields .ex: {firstname:1,lastname:0}

**Examples**

```javascript
// modelname is pluralized
// when ever you are using models , model names are always plurals.
let query  = {'username':'vasuvanka'};
let selectedFieldsObj = {'username':1,'lastname':0};
// key with value 0 is omitted
// key with value 1 is fetched
models.users.findOne(query,selectedFieldsObj).then((doc)=>{
     log(doc);
}).catch((err)=>{
     log(err);
})
```

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error))>** Collection document if found,
or an error if rejected.

### find

find query to get the records of a collection by given mongodb query

**Parameters**

-   `query` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** mongodb query
-   `selectionFields` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** selection object
-   `sortBy` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** sort object. ex: {createdAt:-1}
-   `skip` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** skip number of records , default value is 0
-   `limit` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** limit the result of your query by default limit is set to 30

**Examples**

```javascript
// modelname is pluralized
// when ever you are using models , model names are always plurals.
let query  = {'username':'vasuvanka'};
let selectedFieldsObj = {'username':1,'lastname':0};
let skip = 0;  // skip number of records
let limit = 10; //0 to get all queried records
let sortBy = {'firstname':1}; // -1 for descending order
// key with value 0 is omitted
// key with value 1 is fetched
models.users.find(query, selectedFieldsObj, sortBy, skip, limit).then((doc)=>{
     log(doc);
}).catch((err)=>{
     log(err);
})
```

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error))>** Collection documents if found,
or an error if rejected.

### findRef

findRef query to get refrenced documents from Other collection

**Parameters**

-   `query` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** query object
-   `selectionFields` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** selection object for query
-   `refObj` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** ref object contains an array of selected fields of Other collection .
    ex: refObj = {'collection_key1':['name','email'],'collection_key2':['name','email']...}
-   `sortBy` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** sortby Object to filter result
-   `skip` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** skip number of records , by deafult it is 0
-   `limit` **[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** limit the result of your query by default limit is set to 30

**Examples**

```javascript
// modelname is pluralized
// when ever you are using models , model names are always plurals.
let query  = {'username':'vasuvanka'};
let selectedFieldsObj = {'username':1,'lastname':0};
let skip = 0;  // skip number of records
let limit = 10; //0 to get all queried records
let sortBy = {'firstname':1}; // -1 for descending order
// key with value 0 is omitted
// key with value 1 is fetched
let refObj = {'user_id':['username','firstname']}
// needed full document of other collection then just pass empty array
// refObj = {'user_id':[]}
// if i need two documents from different collections then
// refObj = {'user_id':[],'username':[]}
// ref mongoose for schema configuration
models.users.findRef(query, selectedFieldsObj, refObj, sortBy, skip, limit).then((doc)=>{
     log(doc);
}).catch((err)=>{
     log(err);
})
```

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error))>** Collection documents if found,
or an error if rejected.

### save

Save the data.

**Parameters**

-   `data` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** json object

**Examples**

```javascript
// model name is pluralized
// when ever you are using models , model names are always plurals.
let data  = {'username':'vasuvanka','firstname':'vasu','lastname':'vanka'};
models.users.save(data).then((doc)=>{
     log(doc);
}).catch((err)=>{
     log(err);
})
```

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error))>** document if saved,
or an error if rejected.

### update

Update matched Document(s);

**Parameters**

-   `query` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** query object
-   `data` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** data object
-   `isMultiple` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** if true it will update to all matched documents, if false only update to first matched document, default value is false
-   `isUpsert` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** if true it will create new record if none of the records matched .default value is false

**Examples**

```javascript
// modelname is pluralized
// when ever you are using models , model names are always plurals.
let query  = {'username':'vasuvanka'};
let data = {'firstname':'vicky','lastname':'martin'};
let isMultiple = false; // update applied to only first matched document , if true then applied all matched documents
let upsert = true; // if true then there is document matched then it will create a document , if false no record created
 models.users.update(query, data, isMultiple, upsert).then((doc)=>{
     log(doc);
}).catch((err)=>{
     log(err);
})
```

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error))>** document status if updated,
or an error if rejected.

### increment

Increment/Decrement a number by +/- any number. ex: 10 or -10

**Parameters**

-   `query` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** query object
-   `data` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** data object
-   `isMultiple` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** if true it will update to all matched documents, if false only update to first matched document, default value is false
-   `isUpsert` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** if true it will create new record if none of the records matched .default value is false

**Examples**

```javascript
// modelname is pluralized
// when ever you are using models , model names are always plurals.
let query  = {'username':'vasuvanka'};
let data = {'amount':1};
let isMultiple = false; // update applied to only first matched document , if true then applied all matched documents
let upsert = true; // if true then there is document matched then it will create a document , if false no record created
// will increment amount of matched document field by +1
 models.users.increment(query, data, isMultiple, upsert).then((doc)=>{
     log(doc);
}).catch((err)=>{
     log(err);
})
```

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error))>** document status if updated,
or an error if rejected.

### distinct

Return all distnict field values

**Parameters**

-   `query` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** query object
-   `field` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** field or key name

**Examples**

```javascript
// modelname is pluralized
// when ever you are using models , model names are always plurals.
let query  = {'username':'vasuvanka'};
let field = "firstname";
 models.users.distinct(query, field).then((doc)=>{
     log(doc);
}).catch((err)=>{
     log(err);
})
```

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error))>** documents if found,
or an error if rejected.

### remove

Remove all matched documents

**Parameters**

-   `query` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** query object

**Examples**

```javascript
// modelname is pluralized
// when ever you are using models , model names are always plurals.
let query  = {'username':'vasuvanka'};
 models.users.remove(query).then((doc)=>{
     log(doc);
}).catch((err)=>{
     log(err);
})
```

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error))>** document status if removed,
or an error if rejected.

### count

Count matched documents

**Parameters**

-   `query` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** query object

**Examples**

```javascript
// modelname is pluralized
// when ever you are using models , model names are always plurals.
let query  = {'username':'vasuvanka'};
 models.users.count(query).then((doc)=>{
     log(doc);
}).catch((err)=>{
     log(err);
})
```

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error))>** count of matched record query,
or an error if rejected.

  <script async src="https://www.googletagmanager.com/gtag/js?id=UA-109934840-1"></script>
  <script>
    window.dataLayer = window.dataLayer || [];

    function gtag() {
      dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'UA-109934840-1');

  </script>
