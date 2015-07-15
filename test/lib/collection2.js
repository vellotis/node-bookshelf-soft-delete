'use strict';

var repo = require('./repo'),
  model = require('./model2');

module.exports = repo.Collection.extend({
  model: model
});
