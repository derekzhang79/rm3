/* global casper */
/*jshint expr:true */

describe('Types', function() {
  before(function() {
    casper.start('http://127.0.0.1:4000/');
  });

  after(function() {
    casper.thenOpen('http://127.0.0.1:4000/$logout/');
  });

  it('should render correctly', function() {
    casper.then(function() {
      // Index page type
      'Welcome to rm3'.should.matchTitle;
      'a[href*=login]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
      this.click('a[href*=login]');
    });

    casper.then(function() {
      'form[action*=login]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
      this.fill('form[action*=login]',
        {username: 'wirehead',
          password: 'password'}, true);
    });

    casper.then(function() {
      'a[href*=logout]'.should.be.inDOM.and.be.visible;
      'div.infomessage'.should.be.inDOM.and.contain.text('You have been logged in');
      'div.footer'.should.be.inDOM.and.be.visible;
    });

    casper.thenOpen('http://127.0.0.1:4000/users/', function() {
      // Plain page type
      'a[href*=wirehead]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.pure-u-2-3'.should.contain.text('Users go here...');
      this.click('a[href*=wirehead]');
    });

    casper.then(function() {
      // User page type
      'a[href*=wirehead]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.pure-u-1-3'.should.contain.text('Some profile text');
    });

    casper.then(function() {
      'a[href*=logout]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
    });

    casper.thenOpen('http://127.0.0.1:4000/blog/', function() {
      // Blog + Comment type
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.pure-u-2-3'.should.contain.text('Blog stuff here...');
      'div.pure-u-2-3'.should.contain.text('Comment goes here');
    });

    casper.thenOpen('http://127.0.0.1:4000/link/', function() {
      // Link type
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.pure-u-2-3'.should.contain.text('Test link');
      'div.pure-u-2-3 a'.should.contain.text('Link');
      'a[href*=example]'.should.be.inDOM.and.be.visible;
    });
  });
});
