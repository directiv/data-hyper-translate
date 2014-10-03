var t = require('../');
var should = require('should');

describe('hyper-translate', function() {
  describe('parse', function() {
    [
      ['home.welcome-home',
         'home.welcome-home', null, null],
      ['home.hello-user <- user.given-name',
         'home.hello-user', [{target: 'given-name', path: ['user', 'given-name']}], null],
      ['home.hello-user <- name:user.given-name',
         'home.hello-user', [{target: 'name', path: ['user', 'given-name']}], null],
      ['home.full-name <- user.given-name user.family-name',
         'home.full-name', [{target: 'given-name', path: ['user', 'given-name']}, {target: 'family-name', path: ['user', 'family-name']}], null],
      ['email.placeholder -> placeholder',
         'email.placeholder', null, 'placeholder'],
      ['post.title <- path.to.my.posts -> title',
         'post.title', [{target: 'posts', path: ['path', 'to', 'my', 'posts']}], 'title']
    ].forEach(function(test) {
      var str = test[0];
      it(test[0], function() {
        var out = t.parse(str);
        should.exist(out);
        out.should.eql(test.slice(1));
      });
    });

  });
});
