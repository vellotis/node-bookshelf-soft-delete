'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('test4', function (t) {
    t.increments('id').primary();
    t.datetime('restored_at').nullable();
    t.datetime('deleted_at').nullable();
    t.string('foo');
    t.string('qux');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('test4');
};
