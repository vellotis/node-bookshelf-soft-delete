'use strict';

function shouldDisable (opts) {
  return opts && opts.hasOwnProperty('softDelete') && !opts.softDelete;
}

function addDeletionCheck (syncable) {
  syncable.query(function (qb) {
    qb.where(function () {
      this.whereNull('deleted_at').orWhereNotNull('restored_at');
    });
  });
}

var BPromise = require('bluebird');

module.exports = function (Bookshelf) {

  var mProto = Bookshelf.Model.prototype,
    cProto = Bookshelf.Collection.prototype;

  Bookshelf.Model = Bookshelf.Model.extend({
    constructor: function () {
      mProto.constructor.apply(this, arguments);
      var tableName = this.tableName,
        trigger = this.trigger;
      if (this.soft) {
        BPromise.all([
          Bookshelf.knex.schema.hasColumn(tableName, 'deleted_at'),
          Bookshelf.knex.schema.hasColumn(tableName, 'restored_at')
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
          })
          .catch(function (error) {
            trigger('error', error);
          });
      }
    },

    fetch: function (opts) {
      if (this.soft && !shouldDisable(opts)) {
        addDeletionCheck(this);
      }
      return mProto.fetch.apply(this, arguments);
    },

    fetchAll: function (opts) {
      if (this.soft && !shouldDisable(opts)) {
        addDeletionCheck(this);
      }
      return mProto.fetchAll.apply(this, arguments);
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
    fetch: function (opts) {
      /*eslint-disable new-cap*/
      var isSoft = (new this.model()).soft;
      /*eslint-enable new-cap*/
      if (isSoft && !shouldDisable(opts)) {
        addDeletionCheck(this);
      }
      return cProto.fetch.apply(this, arguments);
    }
  });
};
