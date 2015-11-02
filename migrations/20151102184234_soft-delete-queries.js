'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('test3', function (t) {
    t.increments('id').primary();
    t.integer('model1').references('test.id');
    t.integer('model2').references('test2.id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('test3');
};
