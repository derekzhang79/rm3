var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var PredicateForm = require('../forms/predicate.js');
var update = require ('../update'),
    validator = require('validator'),
    getSlug = require('speakingurl');

function toSlug(url) {
  return getSlug(url, {
    separator: '_',
    truncate: -48,
    custom: {
      '-': '_'
    }
  });
}

function PredicatePage() {
  Page.call(this);
  this.proto = 'predicate';
  this.editTemplate = 'edit-predicate';
  this.createTemplate = 'edit-predicate';

  this.createFunc = function(now, req, res, next) {
    var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
    if (validator.toBoolean(req.body.autogenSlug)) {
      var slug = toSlug(req.body.title);
      req.entity.createNew(req.sitepath.down(slug), req.page.proto, now);
    } else {
      req.entity.createNew(req.sitepath.down(req.body.leaf), req.page.proto, now);
    }
    req.entity.summary.title = req.body.title;
    req.entity.summary.abstract = req.body.abstract;
    update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, 'test',
    function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      } else {
        return res.redirect(req.site.sitePathToUrl(req.entity.path()));
      }
    });
  };

  this.editFunc = function(oldent, now, req, res, next) {
    var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
    req.entity.summary.title = req.body.title;
    req.entity.summary.abstract = req.body.abstract;
    req.entity.updateTimes(now);
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, 'test', next);
  };

  this.validateForm = function(update, body, next) {
    var predicateForm = new PredicateForm(update);
    predicateForm.checkForm(body, next);
  };

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'index', null));
}

util.inherits(PredicatePage, Page);

module.exports = PredicatePage;