var _ = require('lodash')
  , mongodb = require('mongodb')

function reduce(schema, value, opts) {
  if (!schema) schema = {};
  var i, found;
  var type = typeof value;
  var format;
  if (type === 'object') {
    if (value === null) {
      type = 'null';
    } else if (Array.isArray(value)) {
      type = 'array';
    } else if (value instanceof Date) {
      type = 'string';
      format = 'date-time';
    } else if (value instanceof RegExp) {
      type = 'string';
    } else if (value instanceof mongodb.ObjectID) {
      type = 'string';
    }
  }
  if (!schema.type || schema.type === type) {
    switch(type) {
      case 'object':
        if (!schema.properties) schema.properties = {};
        if (schema.required) {
          schema.required = _.intersection(schema.required, Object.keys(value));
        } else {
          schema.required = Object.keys(value);
        }
        for (i in value) {
          schema.properties[i] = reduce(schema.properties[i], value[i], opts);
        }
        break;
      case 'array':
        for (i = 0 ; i < value.length ; i++) {
          schema.items = reduce(schema.items, value[i], opts);
        }
        break;
      case 'string':
        if (format) {
          if (!schema.type) {
            schema.format = format;
          } else if (schema.format !== format) {
            if (schema.anyOf) {
              for (i = 0, found = false ; !found && i < schema.anyOf.length ; i++) {
                found = schema.anyOf[i].format === format;
              }
              if (!found) {
                schema.anyOf.push({
                  type: 'string',
                  format: format
                });
              }
            } else {
              var s = {
                type: 'string',
                anyOf: [
                  schema,
                  {
                    type: 'string',
                    format: format
                  }
                ]
              }
              schema = s;
            }
          }
        } else {
          if (!schema.type) {
            schema.enum = [];
          }
          if (schema.enum) {
            if (schema.enum.length < opts.maxEnum) {
              schema.enum.push(value);
              schema.enum = _.uniq(schema.enum);
            } else {
              delete schema.enum;
            }
          }
        }
        break;
    }
    schema.type = type;
  } else {
    var i;
    if (Array.isArray(schema.type)) {
      i = schema.type.indexOf(type);
      if (i === -1) {
        i = schema.type.length;
        schema.type.push(type);
        schema.anyOf.push({});
      }
    } else {
      var s = {
        type: [ schema.type, type ],
        anyOf: [ schema, { } ]
      }
      schema = s;
      i = 1;
    }
    schema.anyOf[i] = reduce(schema.anyOf[i], value, opts);
  }
  return schema;
}

module.exports = function(opts) {
  if (!opts || !opts.db || !opts.collection) {
    throw new Error('missing required options');
  }
  if (!opts.maxEnum) opts.maxEnum = 20;

  return Promise.resolve(typeof opts.db === 'object' ? db : mongodb.MongoClient.connect(opts.db)).then(function(db) {
    var schema = {};
    var cursor = db.collection(opts.collection).find(opts.q || {});
    function processNext(data) {
      if (data === null) {
        return schema;
      } else {
        schema = reduce(schema, data, opts);
        return cursor.next().then(processNext);
      }
    }
    return cursor.next().then(processNext);
  });
}