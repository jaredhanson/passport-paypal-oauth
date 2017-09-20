var vows = require('vows');
var assert = require('assert');
var util = require('util');
var PayPalStrategy = require('passport-paypal-oauth/strategy');


vows.describe('PayPalStrategy').addBatch({

  'strategy': {
    topic: function() {
      return new PayPalStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
    },

    'should be named paypal': function (strategy) {
      assert.equal(strategy.name, 'paypal');
    },
  },

  'strategy when paypal client is running on live environment (default)': {
    topic: function () {
      var strategy = new PayPalStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function () { });

      // mock
      strategy._oauth2.get = function (url, accessToken, callback) {
        assert.equal(url, 'https://api.paypal.com/v1/identity/openidconnect/userinfo/?schema=openid')
        var body = '{"user_id": "123456789","name": "Jared Hanson","given_name": "Jared","family_name": "Hanson", "email": "jaredhanson@example.com" }';

        callback(null, body, undefined);
      }

      return strategy;
    },

    'we use authorize url to live api': function (strategy) {
      // Be aware we are asserting where 'passport-oauth' saves the urls, this may change
      assert.equal(strategy._oauth2._authorizeUrl, 'https://www.paypal.com/signin/authorize')
    },

    'we use token url to live api': function (strategy) {
      // Be aware we are asserting where 'passport-oauth' saves the urls, this may change
      assert.equal(strategy._oauth2._accessTokenUrl, 'https://api.paypal.com/v1/identity/openidconnect/tokenservice');
    },

    'we use user profile url to live api': function (strategy) {
      strategy.userProfile('access-token', function () { });
    }
  },

  'strategy when paypal client is running on sandbox environment': {
    topic: function () {
      var strategy = new PayPalStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret',
        paypalEnvironment: 'sandbox'
      }, function () {});

      // mock
      strategy._oauth2.get = function (url, accessToken, callback) {
        assert.equal(url, 'https://api.sandbox.paypal.com/v1/identity/openidconnect/userinfo/?schema=openid')
        var body = '{"user_id": "123456789","name": "Jared Hanson","given_name": "Jared","family_name": "Hanson", "email": "jaredhanson@example.com" }';

        callback(null, body, undefined);
      }

      return strategy;
    },

    'we use authorize url to sandbox api': function (strategy) {
      // Be aware we are asserting where 'passport-oauth' saves the urls, this may change
      assert.equal(strategy._oauth2._authorizeUrl, 'https://www.sandbox.paypal.com/signin/authorize')
    },

    'we use token url to sandbox api': function (strategy) {
      // Be aware we are asserting where 'passport-oauth' saves the urls, this may change
      assert.equal(strategy._oauth2._accessTokenUrl, 'https://api.sandbox.paypal.com/v1/identity/openidconnect/tokenservice');
    },

    'we use user profile url to sandbox api': function (strategy) {
      strategy.userProfile('access-token', function(){});
    }
  },

  'strategy when paypal client is running on not supported environment': {
    topic: {
      clientID: 'ABC123',
      clientSecret: 'secret',
      paypalEnvironment: 'other'
    },

    'should throw an error': function (strategyOptions) {
      assert.throws(function() {
        new PayPalStrategy(strategyOptions, function () {});
      }, function (err) {
        return (err instanceof TypeError) && /paypalEnvironment option must be "sandbox", "live" or not set at all \(default to "live"\)/.test(err);
      },
      'TypeError');
    },

  },

  'strategy when loading user profile': {
    topic: function() {
      var strategy = new PayPalStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});

      // mock
      strategy._oauth2.get = function(url, accessToken, callback) {
        var body = '{"user_id": "123456789","name": "Jared Hanson","given_name": "Jared","family_name": "Hanson", "email": "jaredhanson@example.com" }';

        callback(null, body, undefined);
      }

      return strategy;
    },

    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }

        process.nextTick(function () {
          strategy.userProfile('access-token', done);
        });
      },

      'should not error' : function(err, req) {
        assert.isNull(err);
      },
      'should load profile' : function(err, profile) {
        assert.equal(profile.provider, 'paypal');
        assert.equal(profile.id, '123456789');
        assert.equal(profile._json.name, 'Jared Hanson');
        assert.equal(profile.name.familyName, 'Hanson');
        assert.equal(profile.name.givenName, 'Jared');
        assert.equal(profile.emails[0], 'jaredhanson@example.com');
      },
      'should set raw property' : function(err, profile) {
        assert.isString(profile._raw);
      },
      'should set json property' : function(err, profile) {
        assert.isObject(profile._json);
      },
    },
  },

  'strategy when loading user profile with real user_id': {
    topic: function() {
      var strategy = new PayPalStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});

      // mock
      strategy._oauth2.get = function(url, accessToken, callback) {
        var body = '{"user_id": "https://www.paypal.com/webapps/auth/identity/user/123456789","name": "Jared Hanson","given_name": "Jared","family_name": "Hanson", "email": "jaredhanson@example.com" }';

        callback(null, body, undefined);
      };

      return strategy;
    },

    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }

        process.nextTick(function () {
          strategy.userProfile('access-token', done);
        });
      },

      'should remove https://www.paypal.com/webapps/auth/identity/user/ prefix from user_id' : function(err, profile) {
        assert.equal(profile.id, '123456789');
      },
    },
  },

  'strategy when loading user profile and encountering an error': {
    topic: function() {
      var strategy = new PayPalStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});

      // mock
      strategy._oauth2.get = function(url, accessToken, callback) {
        callback(new Error('something-went-wrong'));
      }

      return strategy;
    },

    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }

        process.nextTick(function () {
          strategy.userProfile('access-token', done);
        });
      },

      'should error' : function(err, req) {
        assert.isNotNull(err);
      },
      'should wrap error in InternalOAuthError' : function(err, req) {
        assert.equal(err.constructor.name, 'InternalOAuthError');
      },
      'should not load profile' : function(err, profile) {
        assert.isUndefined(profile);
      },
    },
  },

}).export(module);
