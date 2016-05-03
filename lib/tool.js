#!/usr/bin/env node

var program = require('commander')
  , meta = require('../package.json')
  , schemer = require('./index')

program
  .version(meta.version)
  .description(meta.description)
  .option('-q, --query <query>', 'Query to filter the results', JSON.parse, {})
  .option('-m, --maxEnum <items>', 'Limit the number of enum items to <items> [20]', 20)
  .arguments('<db> <collection>')
  .action(function(db, collection) {
    var opts = {
      db: db,
      collection: collection
    };
    if (program.q) opts.q = program.q;
    if (program.maxEnum) opts.maxEnum = program.maxEnum;
    schemer(opts).then(function(schema) {
      console.log(JSON.stringify(schema, null, 2));
      process.exit(0);
    }).catch(function(err) {
      console.error('  error:', err, err.stack);
      process.exit(1);
    });
  });

program.parse(process.argv);
