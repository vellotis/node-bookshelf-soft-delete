'use strict';

var repo = require('./repo'),
  model = require('./model');

module.exports = repo.Collection.extend({
  model: model
});
