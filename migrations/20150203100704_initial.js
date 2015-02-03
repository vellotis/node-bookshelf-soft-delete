'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('test', function (t) {
    t.increments('id').primary();
    t.datetime('restored_at').nullable();
    t.datetime('deleted_at').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('test');
};
