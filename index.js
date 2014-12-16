(function () {
  'use strict';

  module.exports = function (Bookshelf) {

    var Lazy = require('lazy.js'),
      Promise = require('bluebird'),
      mProto = Bookshelf.Model.prototype,
      cProto = Bookshelf.Collection.prototype;


  
    Bookshelf.Model = Bookshelf.Model.extend({
      constructor: function () {
        mProto.constructor.apply(this, arguments);
        var self = this,
          parentPromise = Promise.resolve()
            .then(function () {
              if (!self.soft) {
                throw new Promise.CancellationError('soft delete not set');
              } else {
                return Bookshelf
                  .knex.schema.hasColumn(self.tableName, 'deleted_at')
                  .then(function (deletedPresence) {
                    if (!deletedPresence) {
                      throw new Promise.CancellationError('missing column deleted_at');
                    } 
                  });
              }
            })
            .catch(Promise.CancellationError, function (err) {
               if (err.message !== 'soft delete not set') {
                throw err;
              }
            })
      },
      destroy: function () {
        if (this.soft) {
          this.set('deleted_at', new Date());
          return this.save();
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
            if (options.force) {
              return vanilla;    
            } else {
              vanilla.models = Lazy(vanilla.models).reject(function (item) {
                return item.get('deleted_at')
              }).value();
              return vanilla;
            }
          });
      },
      fetchOne: function (options) {
        return cProto.fetchOne.apply(this, arguments)
          .then(function (vanilla) {
            options = options || {};
            if (options.force) {
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
  }
})();
