# Bookshelf Soft Delete
This plugin works with Bookshelf.js, available here http://bookshelfjs.org, in
order to introduce a soft deletion. What this means is that items will appear
deleted to an end user, but will not in fact be removed from the database.

## Installation
  
    npm install bookshelf-soft-delete

Then in your bookshelf configuration:

    var bookshelf = require('bookshelf')(knex);
    bookshelf.plugin(require('bookshelf-soft-delete'));

## Usage

On your bookshelf Model which you would like to mark for soft deletion:

    soft: true

or, if you don't want to use the default column names (`deleted_at` and `restored_at`) :

    soft: ['deletionDate', 'restorationDate']

or, if you don't want to use `restored_at` column :

    soft: ['deleted_at']

Please note that strictly speaking any truthy value will be sufficient.  This
will override `destroy` to simply set the `deleted_at` column of the
corresponding table to the Date stamp at moment of deletion, and override the
collection `fetch` and `fetchOne` to filter out model instances where
`deleted_at` is set. Please note, that if you set this on a Model, the table
for which does not have a `deleted_at` column or an optional `restored_at` column, an
 `error` event will be emited when your model is created.

If you wish to disable soft delete for a given operation, e.g., `fetch`, simply
pass an object with `softDelete: false` to that operation.

    YourModel.where("id", searchId)
        .fetch({softDelete: false})

If you need to restore something which has been soft deleted, `model.restore`
will do this.
