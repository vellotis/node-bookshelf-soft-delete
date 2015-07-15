'use strict';

var repository = require('./repo');

module.exports = repository.Model.extend({
  tableName: 'test2',
  soft: ['deletedAt', 'restoredAt']
});
