'use strict';

var knex = require('knex')(require('../../knexfile').development),
  repository = module.exports = require('bookshelf')(knex);

repository.plugin(require('../../index'));
