'use strict';

function shouldDisable (opts) {
  return opts && opts.hasOwnProperty('softDelete') && !opts.softDelete;
}

var lazy = require('lazy.js'),
  BPromise = require('bluebird');

module.exports = function (Bookshelf) {

  var mProto = Bookshelf.Model.prototype,
    cProto = Bookshelf.Collection.prototype;



  Bookshelf.Model = Bookshelf.Model.extend({
    constructor: function () {
      mProto.constructor.apply(this, arguments);
      var self = this;
      BPromise.resolve()
        .then(function () {
          if (!self.soft) {
            throw new BPromise.CancellationError('soft delete not set');
          } else {
            return Bookshelf
              .knex.schema.hasColumn(self.tableName, 'deleted_at')
              .then(function (deletedPresence) {
                if (!deletedPresence) {
                  throw new BPromise.CancellationError('missing column deleted_at');
                }
              });
          }
        })
        .catch(BPromise.CancellationError, function (err) {
          if (err.message !== 'soft delete not set') {
            throw err;
          }
        });
    },
    destroy: function (opts) {
      if (this.soft && !shouldDisable(opts)) {
        this.set('deleted_at', new Date());
        return this.save()
          .tap(function (model) {
            return model.triggerThen('destroying');
          })
          .then(function (model) {
            return model.triggerThen('destroyed');
          });
      } else {
        return mProto.destroy.apply(this, arguments);
      }
    }
  });

  Bookshelf.Collection = Bookshelf.Collection.extend({
    fetch: function (options) {
      return cProto.fetch.apply(this, arguments)
        .then(function (vanilla) {
          options = options || {};
          if (shouldDisable(options)) {
            return vanilla;
          } else {
            vanilla.models = lazy(vanilla.models).reject(function (item) {
              return item.get('deleted_at');
            }).value();
            return vanilla;
          }
        });
    },
    fetchOne: function (options) {
      return cProto.fetchOne.apply(this, arguments)
        .then(function (vanilla) {
          options = options || {};
          if (shouldDisable(options)) {
            return vanilla;
          } else {
            if (vanilla && vanilla.get('deleted_at')) {
              return null;
            } else {
              return vanilla;
            }
          }
        });
    }
  });
};
