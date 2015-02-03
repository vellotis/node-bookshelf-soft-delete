'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('test', function (t) {
    t.datetime('deleted_at').nullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('test');
};
