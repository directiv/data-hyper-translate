/**
 * Module dependencies
 */

hyperTranslate.requires = ['store-hyper-translate'];

/**
 * Expose the 'hyper-translate' directive
 */

module.exports = hyperTranslate;

/**
 * Initialize the 'hyper-translate' directive
 *
 * @param {StoreHyper} store
 */

function hyperTranslate(store) {
  this.compile = function(input) {
    var translations = input.split(',');
    return translations.map(parse);
  };

  this.state = function(config, state) {
    var res = store.get(config.path, state);
    if (!res.completed) return false;
    return state.set(config.target, res.value);
  };

  this.children = function(config, state, children) {
    var value = state.get(config.target);
    if (typeof value === 'undefined') return '';
    return value;
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
  }).map(function(arg) {
    arg = arg.trim();
    var conf = arg.split(':');

    // they passed a name for the arg
    if (conf.length === 2) return {
      target: conf[0],
      path: conf[1].split('.')
    };

    conf = arg.split('.');
    return {
      target: conf[conf.length - 1],
      path: conf
    };
  });

  return [
    out[1],
    args.length === 0 ? undefined : args,
    target ? target.slice(3).trim() : undefined
  ];
};
