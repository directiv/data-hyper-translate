var t = require('../');
var should = require('should');

describe('hyper-translate', function() {
  describe('parse', function() {
    [
      ['home.welcome-home',
         ['home', 'welcome-home']],
      ['home.hello-user <- user.given-name',
         ['home', 'hello-user'], {'given-name': ['user', 'given-name']}],
      ['home.hello-user <- name:user.given-name',
         ['home', 'hello-user'], {'name': ['user', 'given-name']}],
      ['home.full-name <- user.given-name user.family-name',
         ['home', 'full-name'], {'given-name': ['user', 'given-name'], 'family-name': ['user', 'family-name']}],
      ['email.placeholder -> placeholder',
         ['email', 'placeholder'], null, 'placeholder'],
      ['post.title <- path.to.my.posts -> title',
         ['post', 'title'], {'posts': ['path', 'to', 'my', 'posts']}, 'title']
    ].forEach(function(test) {
      var str = test[0];
      it(test[0], function() {
        var out = t.parse(str);
        assert('path', out, test[1]);
        assert('params', out, test[2] || {});
        if (test[3]) assert('target', out, test[3]);
      });
    });

  });
});

function assert(prop, out, expected) {
  should.exist(out[prop]);
  out[prop].should.eql(expected);
}
