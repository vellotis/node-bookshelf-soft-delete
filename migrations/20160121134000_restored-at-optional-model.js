'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('test5', function (t) {
    t.increments('id').primary();
    t.datetime('deleted_at').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('test5');
};
