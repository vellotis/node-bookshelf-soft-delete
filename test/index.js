'use strict';

var lib = require('./lib'),
  knex = require('knex')(require('../knexfile').development),
  fs = require('fs'),
  path = require('path'),
  Collection = lib.Collection,
  should = require('should'),
  BPromise = require('bluebird'),
  Model = lib.Model;

describe('bookshelf soft delete', function () {
  before(function () {
    return knex.migrate.latest();
  });

  after(function () {
    fs.unlinkSync(path.join(__dirname, '../dev.sqlite3'));
  });

  describe('given a few models', function () {
    var ids;

    beforeEach(function () {
      return BPromise.all([
        Model.forge().save(),
        Model.forge().save(),
        Model.forge().save()
      ])
        .then(function (models) {
          ids = models.map(function (model) {
            return model.id;
          });
        });
    });

    afterEach(function () {
      return BPromise.map(ids, function (id) {
        return Model.forge({ id: id }).destroy({ softDelete: false });
      });
    });

    it('should not affect model.fetch()', function () {
      return Model.forge({ id: ids[1] })
        .fetch()
        .then(function (model) {
          should.exist(model);
          model.id.should.equal(ids[1]);
        });
    });
  });

  describe('A softDeleted model', function () {
    var id;

    before(function () {
      var model = Model.forge();
      return model
        .save()
        .then(function () {
          id = model.id;
          return model.destroy();
        });
    });

    it('should not be visibile in model fetch', function () {
      return Model
        .forge({ id: id })
        .fetch()
        .then(function (model) {
          should.not.exist(model);
        });
    });

    it('should not be visibile in model fetchAll', function () {
      return Model
        .forge()
        .fetchAll()
        .then(function (results) {
          results.length.should.equal(0);
        });
    });

    it(
      'should be visibile in model fetch with softDelete: false',
      function () {
        return Model
          .forge({ id: id })
          .fetch({ softDelete: false })
          .then(function (model) {
            should.exist(model);
          });
      }
    );

    it(
      'should be visibile in model fetchAll with softDelete: false',
      function () {
        return Model
          .forge()
          .fetchAll({ softDelete: false })
          .then(function (results) {
            results.length.should.equal(1);
          });
      }
    );

    it('should not be visible in fetches', function () {
      return (new Collection())
        .fetch()
        .then(function (results) {
          results.models.length.should.equal(0);
        });
    });

    it('should not be visible in fetchOne', function () {
      return (new Collection())
        .fetchOne()
        .then(function (result) {
          should.not.exist(result);
        });
    });

    it('should be be visible in softDelete: false fetchOne', function () {
      return (new Collection())
        .fetchOne({ softDelete: false })
        .then(function (result) {
          should.exist(result);
        });
    });

    it('should be be visible in softDelete: false fetches', function () {
      return (new Collection())
        .fetch({ softDelete: false })
        .then(function (results) {
          results.models.length.should.equal(1);
        });
    });

    describe('when restored', function () {
      before(function () {
        return Model
          .forge({ id: id })
          .fetch({ softDelete: false })
          .then(function (model) {
            return model.restore();
          });
      });

      it('should be visible in fetches', function () {
        return (new Collection())
          .fetch()
          .then(function (results) {
            results.models.length.should.equal(1);
          });
      });

      it('should be visible in fetchOne', function () {
        return (new Collection())
          .fetchOne()
          .then(function (result) {
            should.exist(result);
          });
      });

    });
  });
});
