var Page = require('../lib/page');
var util = require("util");
var update = require ('./update'),
  errs = require('errs'),
  getSlug = require('speakingurl'),
  validator = require('validator'),
  textblocks = require('textblocks');

function ValidationError() {
  this.message = "Validation Error";
}
util.inherits(ValidationError, Error);
errs.register('page.validation', ValidationError);

function FieldEmptyError() {
  this.message = "Field Empty";
}
util.inherits(FieldEmptyError, ValidationError);
errs.register('page.validation.empty', FieldEmptyError);



function to_slug(url) {
  return getSlug(url, {
    separator: '_',
    truncate: 48,
    custom: {
      '-': '_'
    }
  });
}

function BaseBehaviorMixin(page) {
  page.view_router.addRoute('/GET/', function(req, res, page, next) 
  {
    var view = req.entity.view();
    view.user = req.user;
    req.scheme.render('view', view, page._renderPageResponse.bind(this, req, res));
  });
  page.command_router.addRoute('/POST/edit', function(req, res, page, db, next)
  {
    var oldent = req.entity.clone();
    req.entity.data.posting = textblocks.makeTextBlock(req.body.posting,validator.toString(req.body.textblock_format));
    req.entity.updateTimes(new Date());
    update.update_entity(db, oldent, req.entity, true, 'test', next);
  });
  page.command_router.addRoute('/GET/delete', function(req, res, page, db, next)
  {
    if (req.query.sure === 'yes') {
      update.delete_entity(db, req.entity, true, 'delete', next);
    } else {
      next();
    }
  });
  page.command_router.addRoute('/GET/create', function(req, res, page, db, next)
  {
    var now = new Date();
    req.entity.createNew(req.sitepath.down(req.body.path), page.proto, now);
    next();
  });
  page.command_router.addRoute('/POST/create', function(req, res, page, db, next)
  {
    var now = new Date();
    if (validator.isNull(req.body.title)) {
      return next(errs.create('page.validation.empty', {
        field: 'title'
      }));
    }
    if (validator.toBoolean(req.body.autogen_slug)) {
      var slug = to_slug(req.body.title);
      req.entity.createNew(req.sitepath.down(slug), page.proto, now);
    } else {
      if (validator.isNull(req.body.path)) {
        return next(errs.create('page.validation.empty', {
         field: 'path'
        }));
      }
      req.entity.createNew(req.sitepath.down(req.body.path), page.proto, now);
    }
    req.entity.data.posting = textblocks.makeTextBlock(req.body.posting, validator.toString(req.body.textblock_format));
    req.entity.summary.title = req.body.title;
    req.entity.summary.abstract = req.body.abstract;
    update.create_entity(db, req.entity, true, 'test', 
    function(err, entity_id, revision_id, revision_num) {
      if (err) {
        return next(err);
      } else {
        return res.redirect(req.sitepath.down(req.body.path).toUrl('/',1));
      }
    });
  });
  page.view_router.addRoute('/*/edit', function(req, res, page, next) 
  {
    var view = req.entity.view();
    view.user = req.user;
    view.section = 'edit';
    req.scheme.render('edit', view, page._renderPageResponse.bind(this, req, res));
  });
  page.view_router.addRoute('/*/create', function(req, res, page, next) 
  {
    var view = req.entity.view();
    view.user = req.user;
    view.section = 'create';
    view.path = req.sitepath.toDottedPath();
    req.scheme.render('create', view, page._renderPageResponse.bind(this, req, res));
  });
  page.view_router.addRoute('/*/delete', function(req, res, page, next) 
  {
    var view = {meta: {modified: null, created:null}};
    view.user = req.user;
    view.section = 'delete';
    view.message = 'deleted';
    req.scheme.render('message', view, page._renderPageResponse.bind(this, req, res));
  });
}


function HistoryViewMixin(page) {
  page.view_router.addRoute('/GET/history', function(req, res, page, next) 
  {
    var view = req.entity.view();
    view.section = 'history';
    req.scheme.render('history', view, page._renderPageResponse.bind(this, req, res));
  });
}


function BasePage() {
  Page.call(this);
  this.proto = 'base';
  BaseBehaviorMixin(this);
  HistoryViewMixin(this);
}

util.inherits(BasePage, Page);

function TempIndexClass() {
  BasePage.call(this);
  this.proto = 'index';
  this.view_router.addRoute('/GET/', function(req, res, page, next) 
  {
    var view = req.entity.view();
    view.user = req.user;
    req.scheme.render('index', view, page._renderPageResponse.bind(this, req, res));
  });
}

util.inherits(TempIndexClass, BasePage);

var Protoset = function () {
  this._pages = {};
  this._metadata = {};
  this.add_proto('base', new BasePage(), {desc: 'Default Node'});
  this.add_proto('index', new TempIndexClass(), {desc: 'Index (temp)'});
};

Protoset.prototype.add_proto = function(tag, proto, metadata) {
  this._pages[tag] = proto;
  this._metadata[tag] = metadata;
};

Protoset.prototype.get_page = function(proto) {
  return this._pages[proto];
};

Protoset.prototype.list_protos = function() {
  return this._metadata;
};

module.exports = exports = new Protoset();