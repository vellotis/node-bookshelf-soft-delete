'use strict';

var repository = require('./repo');

module.exports = repository.Model.extend({
  tableName: 'test',
  soft: true
});
