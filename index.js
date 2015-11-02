'use strict';

var softActivated = false;
var softFields = ['deleted_at', 'restored_at'];

function shouldDisable(opts) {
  return opts && opts.hasOwnProperty('softDelete') && !opts.softDelete;
}

function addDeletionCheck(syncable) {
  var deletedAtField = softFields[0];
  var restoredAtField = softFields[1];

  /*eslint-disable no-underscore-dangle*/
  if (syncable._knex) {
    var table = syncable._knex._single.table;
    /*eslint-enable no-underscore-dangle*/

    deletedAtField = table + '.' + softFields[0];
    restoredAtField = table + '.' + softFields[1];
  }

  syncable.query(function (qb) {
    qb.where(function () {
      this.whereNull(deletedAtField).orWhereNotNull(restoredAtField);
    });
  });
}

module.exports = function (Bookshelf) {

  var mProto = Bookshelf.Model.prototype,
    cProto = Bookshelf.Collection.prototype;

  Bookshelf.Model = Bookshelf.Model.extend({

    initialize: function () {
      if (Array.isArray(this.soft)) {
        softFields = this.soft;
        softActivated = true;
      } else if (this.soft === true) {
        softActivated = true;
      }
      return mProto.initialize.apply(this, arguments);
    },

    fetch: function (opts) {
      if (softActivated && !shouldDisable(opts)) {
        addDeletionCheck(this);
      }
      return mProto.fetch.apply(this, arguments);
    },

    fetchAll: function (opts) {
      if (softActivated && !shouldDisable(opts)) {
        addDeletionCheck(this);
      }
      return mProto.fetchAll.apply(this, arguments);
    },

    restore: function () {
      if (softActivated) {
        if (this.get(softFields[0])) {
          this.set(softFields[1], new Date());
          return this.save();
        }
      }
      else {
        throw new TypeError('restore cannont be used if the model does not ' +
        'have soft delete enabled');
      }
    },

    destroy: function (opts) {
      if (softActivated && !shouldDisable(opts)) {
        this.set(softFields[1], null);
        this.set(softFields[0], new Date());
        return this.save()
          .tap(function (model) {
            return model.triggerThen('destroying', model, opts);
          })
          .then(function (model) {
            return model.triggerThen('destroyed', model, undefined, opts);
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
