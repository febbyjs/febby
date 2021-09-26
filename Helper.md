## Febby

Get to know how to do projection ,querying and pagingation on collections.

## Projection

pass `projection` in the url query params to get the required properties.

```js
var axios = require("axios");
var config = {
  method: "get",
  url: "localhost:3000/api/users/615032bf46f470f552d74e39?projection=display_name",
  headers: {
    "Content-Type": "application/json",
  },
};

axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
  })
  .catch(function (error) {
    console.log(error);
  });
```

Response

Status 200

```js
{
  display_name: "vasu";
}
```

## query on a collection

pass `query` object in url query params to do query on defined collection

```js
var axios = require("axios");

var config = {
  method: "get",
  url: 'localhost:3000/api/users?projection=display_name&query={"name":"vasu"}',
  headers: {
    "Content-Type": "application/json",
  },
};

axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
  })
  .catch(function (error) {
    console.log(error);
  });
```

Response

Status 200

```js
{
    value:[
        {
            display_name:'vasu',
            _id:'615032bf46f470f552d74e39'
        }
    ],
    count: 1
}
```

## Pagination

Pagination will be handled using `skip` and `limit`, default limit is 20 and skip is 0

```js
var axios = require("axios");

var config = {
  method: "get",
  url: "localhost:3000/api/users?skip=1&limit=5",
  headers: {
    "Content-Type": "application/json",
  },
};

axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
  })
  .catch(function (error) {
    console.log(error);
  });
```

Response

Status 200

```js
{
    value:[
        {
            display_name:'vasu',
            _id:'615032bf46f470f552d74e39'
        }
    ],
    count: 1
}
```
