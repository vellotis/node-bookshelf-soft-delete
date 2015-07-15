'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('test2', function (t) {
    t.increments('id').primary();
    t.datetime('restoredAt').nullable();
    t.datetime('deletedAt').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('test2');
};
