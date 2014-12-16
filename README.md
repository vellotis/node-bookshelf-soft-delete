# Bookshelf Soft Delete
This plugin works with Bookshelf.js, available here http://bookshelfjs.org, in order to introduce a soft deletion. What this means is that items will appear deleted to an end user, but will not in fact be removed from the database.

## Installation
  
    npm install bookshelf-soft-delete
    
Then in your bookshelf configuration:

    var bookshelf = require('bookshelf')(knex);
    bookshelf.plugin(require('bookshelf-soft-delete');
    
## Usage

On your bookshelf Model which you would like to mark for soft deletion:

    soft: true
    
Please note that strictly speaking any truthy value will be sufficient.
This will override `destroy` to simply set the `deleted_at` column of the corresponding table to the Date stamp at moment of deletion, and override the collection `fetch` and `fetchOne` to filter out model instances where `deleted_at` is set. Please note, that if you set this on a Model, the table for which does not have the `deleted_at` column, this will throw an exception.