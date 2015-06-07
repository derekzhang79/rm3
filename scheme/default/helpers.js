var SitePath = require ('../../lib/sitepath');
var textblocks = require('textblocks')
var Protoset = require('../../lib/protoset');
var textblockUi = require('../../lib/textblock_ui');

exports = module.exports = function(dust, db, query) {
    dust.helpers.textblock_edit = function(chunk, context, bodies, params) {
        var textblock = context.resolve(params.field);
        return chunk.write(textblockUi.generateEditor('posting', textblock));
    }

    dust.helpers.disabled_mode = function(chunk, context, bodies, params) {
        var section = context.get('section');
        var dis = context.resolve(params[section]);
        if (dis) {
            return chunk.write('disabled')
        } else {
            return chunk.write('');
        }
    }

    dust.helpers.combo_form = function(chunk, context, bodies, params) {
        var section = context.get('section');
        var path = context.resolve(params[section]);
        return chunk.write('<form id="draft" method="post" action="' + path + '" class="pure-form pure-form-stacked">');
    }

    dust.helpers.textblock = function(chunk, context, bodies, params) {
        var textblock = context.resolve(params.field);
        return chunk.write(textblocks.outputTextBlock(textblock));
    }

    dust.helpers.admin_link = function(chunk, context, bodies, params) {
        var longstr = '<ul>';
        var sitepathquery = context.get('meta.sitePath');
        var path = new SitePath(sitepathquery);
        var baseurl = path.toUrl('/',1);
        if (baseurl === '/') {
            baseurl = '';
        }
        var path = context.resolve(params.path);
        var confirm = context.resolve(params.confirm);
        var requiresAuth = context.resolve(params.requiresAuth);
        var permission = context.resolve(params.permission);
        var sectionDisable = context.resolve(params.sectionDisable);
        var disabled = context.resolve(params.disabled);

        user = context.get('user');
        permissions = context.get('permissions');

        if (sectionDisable && context.get('section') === sectionDisable) {
            disabled = true;
        }

        if (requiresAuth && !user) {
            disabled = true;
        }

        if (permission && !permissions.hasOwnProperty(permission)) {
            disabled = true;
        }

        if (disabled) {
            chunk.write('<li class="pure-menu-disabled"><a href="#">');
        } else {
            if (confirm) {
                chunk.write('<li><a href="'+ baseurl + path + '" onclick="ConfirmChoice(\''
                        + baseurl + path + '\'); return false;">');
            } else {
                chunk.write('<li><a href="' + baseurl + path + '">');
            }
        }
        chunk.render(bodies.block, context);
        return chunk.write('</a></li>');
    }

    dust.helpers.proto_menu = function (chunk, context, bodies, params) {
        user = context.get('user');
        if (user) {
            chunk.write('<li><a href="#" data-dropdown="#dropdown-1">');
        } else {
            chunk.write('<li class="pure-menu-disabled"><a href="#">')
        }
        chunk.render(bodies.block, context);
        return chunk.write('</a></li>');
    }

    dust.helpers.user_menu = function(chunk, context, bodies, params) {
        var longstr = ''
        user = context.get('user');
        if (user) {
            longstr = longstr + '<li><a href="/$logout/">Log Out</a></li>'
        } else {
            longstr = longstr + '<li><a href="/$login/">Log In</a></li>'
        }
        return chunk.write(longstr);
    }

    dust.helpers.proto_dropdown = function(chunk, context, bodies, params) {
        var sitepathquery = context.get('meta.sitePath');
        var path = new SitePath(sitepathquery);
        var baseurl = path.toUrl('/',1);
        if (baseurl === '/') {
            baseurl = '';
        }
        var longstr = '<div id="dropdown-1" class="dropdown dropdown-tip">\
    <ul class="dropdown-menu">'
        protos = Protoset.listProtos();
        for(var proto in protos) {
            if (protos.hasOwnProperty(proto)) {
                longstr = longstr + '<li><a href="/$new' + baseurl;
                longstr = longstr + '/create.html?type='+ proto +'">'
                longstr = longstr + protos[proto].desc + '</a></li>'
            }
        }
        longstr = longstr + '</ul></div>';
        return chunk.write(longstr);
    }
    dust.helpers.basic_query = function (chunk, context, bodies, params) {
        return chunk.map(function(chunk) {
            var baseurl = context.get('meta.sitePath');
            path = new SitePath(baseurl);
            var security = {context: 'STANDARD'};
            var user = context.get('user');
            var ctx = context.get('ctx');
            if (user != undefined) {
                security.user = user.path();
            }
            var resp = query.query(db, ctx, security, path,'dir','entity',{},undefined,undefined);
            var body = bodies.block;
            var idx = 0;
            resp.on('article', function(article) {
                chunk.render(bodies.block, context.push(
                    {path: article.path.toUrl('/',1),
                     article: article,
                     '$idx': idx }));
                idx = idx + 1;
            });
            resp.on('error', function(err) {
                chunk.end();
            });
            resp.on('end', function() {
                chunk.end();
            });
        })
    }

    dust.helpers.navbar_query = function (chunk, context, bodies, params) {
        return chunk.map(function(chunk) {
            var baseurl = ['wh'];
            path = new SitePath(baseurl);
            var security = {context: 'STANDARD'};
            var user = context.get('user');
            if (user != undefined) {
                security.user = user.path();
            }
            var ctx = context.get('ctx');
            var resp = query.query(db, ctx, security, path,'dir','entity',{'navbar': true},undefined,undefined);
            var body = bodies.block;
            var idx = 0;
            resp.on('article', function(article) {
                chunk.render(bodies.block, context.push(
                    {path: article.path.toUrl('/',1),
                     article: article,
                     '$idx': idx }));
                idx = idx + 1;
            });
            resp.on('error', function(err) {
                chunk.end();
            });
            resp.on('end', function() {
                chunk.end();
            });
        })
    }

    dust.helpers.history = function (chunk, context, bodies, params) {
        return chunk.map(function(chunk) {
            var baseurl = context.get('meta.sitePath');
            var revisionId = context.get('meta.revisionId')
            path = new SitePath(baseurl);
            var security = {user: context.get('user'),
                            context: 'STANDARD'};
            var ctx = context.get('ctx');

            var resp = query.queryHistory(db, ctx, security, path);
            var body = bodies.block;

            var idx = 0;
            resp.on('article', function(article) {
                chunk.render(bodies.block, context.push(
                    {path: article.path.toUrl('/',1),
                     current: revisionId === article.revisionId,
                     rec: article,
                     '$idx': idx }));
                idx = idx + 1;
            });
            resp.on('error', function(err) {
                chunk.end();
            });
            resp.on('end', function() {
                chunk.end();
            });
        })
    }
    dust.helpers.tags = function (chunk, context, bodies, params) {
        return chunk.map(function(chunk) {
            var tags = dust.helpers.tap(params.obj, chunk, context);
            for (var predKey in tags) {
                if (tags.hasOwnProperty(predKey)) {
                    var pred = tags[predKey];
                    for (var objKey in pred) {
                        var obj = pred[objKey];
                        var predClass = obj.predClass;
                        chunk.render(bodies.block, context.push(
                            {predKey: predKey,
                             objKey: objKey,
                             predClass: predClass, 
                             obj:obj}));
                    }
                }
            }
            chunk.end();
        })
    }
}