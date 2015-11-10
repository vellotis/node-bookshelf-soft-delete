'use strict';

var repo = require('./repo'),
  model = require('./model4');

module.exports = repo.Collection.extend({
  model: model
});
