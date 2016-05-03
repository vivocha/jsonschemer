# jsonschemer
Automatically guesstimate a JSON Schema from the contents of a MongoDB collection

## Installation

```bash
npm install jsonschemer
```

## Usage

```bash
jsonschemer [options] <db connection string> <collection>
```

Valid options are:
* `-q`, `--query`, filter the documents to analyze using the specified JSON query.
* `-m`, `--maxEnum`, limit the number of possible *enum* values. When encountering a *string*
type, the tool assume its possible values are fixed and starts adding each encountered
value to an *enum* clause in the schema. If more than *maxEnum* different values are found,
the *enum* is dropped from the schema.

## Example

```bash
jsonschemer -q '{ "surname":"Smith" }' mongodb://10.0.0.1:27017/my_db users
```

## Usage with Node.js

The exports of the library are a single function, accepting an options object and
returning a promise resolved to the resulting JSON Schema.

Options can have the following properties:
* `db`, required, a MongoDB database object (as returned by `MongoClient.connect`) or a
connection URI string.
* `collection`, require, the MongoDB collection to query.
* `q`, optional, a query to filter the documents in the collection.
* `maxEnum`, optional, default 20, maximum number of items in a schema enum.


### Example

```js
var schemer = require('jsonschemer');

schemer({
  db: 'mongodb://10.0.0.1:27017/my_db'
  collection: 'users',
  maxEnum: 20,
  q: { surname: 'Smith' }
}).then(function(schema) {
  console.log(JSON.stringify(schema, null, 2));
});
```