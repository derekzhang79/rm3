var update = require ('./update'),
    logging = require('./logging'),
    query = require('./query'),
    fs = require('fs'),
    path = require('path');

function scramblePath(entityPath, revisionId, blobPath) {
  return entityPath + '-' + revisionId + '-' + blobPath;
}

var FileBlobStore = function(config, db, cache) {
  this._config = config;
  this._db = db;
  this._cache = cache;
};

FileBlobStore.prototype.authorize = function(next) {
  next();
};

FileBlobStore.prototype.addBlob = function(ctx, entityPath, blobPath, revisionId, source, temporary, data, next) {
  var self = this;
  var urlPath = scramblePath(entityPath, revisionId, blobPath);
  var filePath = path.join(this._config.path, urlPath);
  fs.writeFile(filePath, data, function(err) {
    if (err) {
      return next(err);
    }
    update.addBlob(self._db, ctx, self._config.category, 'fileblobstore', entityPath, blobPath, revisionId, source,
      temporary, {filePath: filePath, urlPath: urlPath}, next);
  });
};

FileBlobStore.prototype.aliasUnchangedBlob = function(ctx, entityPath, blobPath, revisionId, source, temporary, oldRevisionId, next) {
  var self = this;
  query.findBlob(this._db, this._cache, ctx, this._config.category, 'fileblobstore', entityPath, blobPath, oldRevisionId, function(err, details) {
    if (err) {
      return next(err);
    }
    var urlPath = details.urlPath;
    var filePath = details.filePath;
    update.addBlob(self._db, ctx, self._config.category, 'fileblobstore', entityPath, blobPath, revisionId, source,
      temporary, {filePath: filePath, alias: oldRevisionId, urlPath: urlPath}, next);
  });
};

FileBlobStore.prototype.getBlob = function(ctx, entityPath, blobPath, revisionId, next) {
  var self = this;
  query.findBlob(this._db, this._cache, ctx, this._config.category, 'fileblobstore', entityPath, blobPath, revisionId, function(err, details) {
    if (err) {
      return next(err);
    }
    var filePath = details.filePath;
    fs.readFile(filePath, next);
  });
};

FileBlobStore.prototype.getBlobUrl = function(ctx, entityPath, blobPath, revisionId, next) {
  var self = this;
  query.findBlob(this._db, this._cache, ctx, this._config.category, 'fileblobstore', entityPath, blobPath, revisionId, function(err, details) {
    if (err) {
      return next(err);
    }
    var urlPath = self._config.urlroot + details.urlPath;
    next(null, urlPath);
  });
};

FileBlobStore.prototype.doesBlobExist = function(ctx, entityPath, blobPath, revisionId, next) {
  var self = this;
  query.findBlob(this._db, this._cache, ctx, this._config.category, 'fileblobstore', entityPath, blobPath, revisionId, function(err, details) {
    if (err) {
      if (err.name === 'BlobNotFoundError') {
        return next(null, false);
      } else {
        return next(err);
      }
    } else {
      var filePath = details.filePath;
      fs.stat(filePath, function(err) {
        if (err) {
          return next(null, false);
        } else {
          return next(null, true);
        }
      });
    }
  });
};

FileBlobStore.prototype.deleteBlob = function(ctx, entityPath, blobPath, revisionId, next) {
  var self = this;
  query.findBlob(this._db, this._cache, ctx, this._config.category, 'fileblobstore', entityPath, blobPath, revisionId, function(err, details) {
    if (err) {
      return next(err);
    }
    if (!details.alias) {
      var filePath = details.filePath;
      update.deleteBlob(self._db, ctx, self._config.category, 'fileblobstore', entityPath, blobPath, revisionId, function(err) {
        if (err) {
          return next(err);
        }
        fs.unlink(filePath, next);
      });
    }
  });
};

exports = module.exports = FileBlobStore;
