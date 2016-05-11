'use strict';

function shouldDisable(opts) {
  return opts && opts.hasOwnProperty('softDelete') && !opts.softDelete;
}

function addDeletionCheck(softFields) {
  var deletedAtField = softFields[0];
  var restoredAtField = softFields[1];

  /*eslint-disable no-underscore-dangle*/
  if (this._knex) {
    var table = this._knex._single.table;
    /*eslint-enable no-underscore-dangle*/

    deletedAtField = table + '.' + softFields[0];
    restoredAtField = table + '.' + softFields[1];
  }

  this.query(function (qb) {
    qb.where(function () {
      var query = this.whereNull(deletedAtField);
      if (softFields[1]) {
        query.orWhereNotNull(restoredAtField);
      }
    });
  });
}

function setSoftDeleteOptions(soft) {
  if (Array.isArray(soft)) {
    this.softFields = soft;
    this.softActivated = true;
  } else if (soft === true) {
    this.softFields = ['deleted_at', 'restored_at'];
    this.softActivated = true;
  } else {
    this.softFields = false;
    this.softActivated = null;
  }
}

module.exports = function (Bookshelf) {

  var mProto = Bookshelf.Model.prototype,
    cProto = Bookshelf.Collection.prototype;

  Bookshelf.Model = Bookshelf.Model.extend({

    initialize: function () {
      setSoftDeleteOptions.call(this, this.soft);
      return mProto.initialize.apply(this, arguments);
    },

    fetch: function (opts) {
      if (this.softActivated && !shouldDisable(opts)) {
        addDeletionCheck.call(this, this.softFields);
      }
      return mProto.fetch.apply(this, arguments);
    },

    restore: function (opts) {
      if (this.softActivated) {
        if (this.get(this.softFields[0])) {
          if (this.softFields[1]) {
            // Set restored_at
            this.set(this.softFields[1], new Date());
          } else {
            // If restored_at does not exist, remove the deleted_at
            this.set(this.softFields[0], null);
          }
          return this.save(null, opts);
        }
      }
      else {
        throw new TypeError('restore can not be used if the model does not ' +
        'have soft delete enabled');
      }
    },

    destroy: function (opts) {
      if (this.softActivated && !shouldDisable(opts)) {
        var model = this;
        var softFields = model.softFields;
        return model.triggerThen('destroying', model, opts)
          .then(function () {
            if (softFields[1]) {
              model.set(softFields[1], null);
            }
            model.set(softFields[0], new Date());
            return model.save(null, opts);
          })
          .then(function () {
            return model.triggerThen('destroyed', model, undefined, opts);
          });
      } else {
        return mProto.destroy.apply(this, arguments);
      }
    }
  });

  Bookshelf.Collection = Bookshelf.Collection.extend({
    fetch: function (opts) {
      var modelOpts = {};
      setSoftDeleteOptions.call(modelOpts, this.model.prototype.soft);

      if (modelOpts.softActivated && !shouldDisable(opts)) {
        addDeletionCheck.call(this, modelOpts.softFields);
      }
      return cProto.fetch.apply(this, arguments);
    },

    count: function (field, opts) {
      opts = opts || field;

      var modelOpts = {};
      setSoftDeleteOptions.call(modelOpts, this.model.prototype.soft);

      if (modelOpts.softActivated && !shouldDisable(opts)) {
        addDeletionCheck.call(this, modelOpts.softFields);
      }

      return cProto.count.apply(this, arguments);
    }
  });
};
