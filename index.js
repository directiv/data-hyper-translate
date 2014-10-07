/**
 * Module dependencies
 */

var reduce = require('directiv-core-reduce');
hyperTranslate.requires = [
  'store-hyper',
  'store-hyper-translate'
];

var __PREFIX = '_hyper-translate';
var PENDING_KEY = __PREFIX + '-pending';
var TRANSLATION_PREFIX = __PREFIX + '-value-';
var PARAMS_PROP = __PREFIX + '-params';
var HTML_KEY = __PREFIX + '-html';

/**
 * Expose the 'hyper-translate' directive
 */

module.exports = hyperTranslate;

if (process.env.NODE_ENV === 'development') {
  function warn(str) {
    if (warn[str]) return
    console.log(warn);
    warn[str] = 1;
  }
}

/**
 * Initialize the 'hyper-translate' directive
 *
 * @param {StoreHyper} store
 */

function hyperTranslate(store, t) {
  this.compile = function(input) {
    var t = input.split(',').map(parse);
    var conf = reduce(t);
    conf.props = reduce(findProps(t));
    conf.child = findChild(t);
    return conf;
  };

  this.state = function(config, st) {
    return config(function(state, string) {
      // lookup the translation function
      var fn = t.get(string.path);

      if (!fn) return state.set(PENDING_KEY, true);

      // resolve the parameters for the translation
      var isPending = false;
      var params = fn.params(function(p, param) {
        var path = string.params[param];
        if (!path) {
          if (process.env.NODE_ENV === 'development') warn('missing key "' + param + '" for "' + string.path.join('.') + '"');
          p[param] = process.env.NODE_ENV === 'production' ? '' : '!__' + param + '__!';
          return p;
        }

        var res = store.get(path, state);
        if (!res.completed) isPending = true;
        p[param] = res.value;
        return p;
      }, {});

      if (isPending) return state.set(PENDING_KEY, true);

      return state.set(string.key, {fn: fn, params: params});
    }, st.set(PENDING_KEY, false));
  };

  this.pending = function(config, state) {
    return !!state.get(PENDING_KEY);
  };

  this.props = function(config, state, props) {
    return config.props(function(prop) {
      var out = state.get(prop.key);
      var arr = out.fn(out.params);
      var str = '';
      for (var i = 0, l = arr.length; i < l; i++) {
        str += arr[i];
      }
      return props.set(prop.target, str);
    }, props);
  };

  this.children = function(config, state, children) {
    var out = state.get(config.child.key);
    var fn = out.fn;
    var params = out.params;

    if (!children.length) return fn(params);

    for (var child, name, i = 0, l = children.length; i < l; i++) {
      child = children[i];
      if (!child.getIn) continue;
      name = child.getIn(['props', 'name']);
      if (!name) continue;
      params[name] = child.updateIn(['state', name], function() {return params[name];});
    }

    return fn(params);
  };
}

/**
 * user.name
 * user.name <- user.given-name
 * user.name <- name:user.given-name
 * user.name <- user.given-name user.family-name
 * user.name <- user.given-name -> value
 */

var re = /^([^ ]+) *(<- *([^ ]+)( *[^ ]+)*)? *(-> *.+)?$/;
hyperTranslate.parse = parse;
function parse(str) {
  var out = str.match(re);
  if (!out) return;
  var target = out[out.length - 1];

  var args = out.slice(3, -1).filter(function(arg) {
    return typeof arg !== 'undefined';
  }).reduce(function(acc, arg) {
    arg = arg.trim();
    var conf = arg.split(':');

    // they passed a name for the arg
    if (conf.length === 2) {
      acc[conf[0].trim()] = conf[1].trim().split('.');
    } else {
      conf = arg.split('.');
      acc[conf.length - 1] = conf;
    };

    return acc;
  }, {});

  var path = out[1];
  return {
    key: TRANSLATION_PREFIX + path,
    path: path.split('.'),
    params: args,
    target: target ? target.slice(3).trim() : '',
    hasTarget: !!target
  };
}

function findProps(props) {
  return props.filter(function(prop) {
    return prop.hasTarget;
  });
}

function findChild(props) {
  for (var i = 0, prop; i < props.length; i++) {
    prop = props[i];
    if (!prop.hasTarget) return prop;
  }
}
