'use strict';

function shouldDisable (opts) {
  return opts && opts.hasOwnProperty('softDelete') && !opts.softDelete;
}

function isDeleted (model) {
  return model.get('deleted_at') && !model.get('restored_at');
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
            return BPromise.all([
              Bookshelf.knex.schema.hasColumn(self.tableName, 'deleted_at'),
              Bookshelf.knex.schema.hasColumn(self.tableName, 'restored_at')
            ])
              .spread(function (deletedPresence, restoredPresence) {
                if (!deletedPresence && !restoredPresence) {
                  throw new BPromise.CancellationError('missing columns deleted_at & restored_at');
                }
                if (!deletedPresence) {
                  throw new BPromise.CancellationError('missing column deleted_at');
                }
                if (!restoredPresence) {
                  throw new BPromise.CancellationError('missing column restored_at');
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

    restore: function () {
      if (this.soft) {
        if (this.get('deleted_at')) {
          this.set('restored_at', new Date());
          return this.save();
        }
      }
      else {
        throw new TypeError('restore cannont be used if the model does not ' +
          'have soft delete enabled');
      }
    },

    destroy: function (opts) {
      if (this.soft && !shouldDisable(opts)) {
        this.set('restored_at', null);
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
              return isDeleted(item);
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
            if (vanilla && isDeleted(vanilla)) {
              return null;
            } else {
              return vanilla;
            }
          }
        });
    }
  });
};
