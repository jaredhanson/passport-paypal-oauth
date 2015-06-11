/**
 * Module dependencies.
 */
var util = require('util')
  , OAuth2Strategy = require('passport-oauth').OAuth2Strategy
  , InternalOAuthError = require('passport-oauth').InternalOAuthError;


/**
 * `Strategy` constructor.
 *
 * The PayPal authentication strategy authenticates requests by delegating to
 * PayPal using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your application's App ID
 *   - `clientSecret`  your application's App Secret
 *   - `callbackURL`   URL to which PayPal will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new PayPalStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/paypal/callback'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://www.paypal.com/webapps/auth/protocol/openidconnect/v1/authorize';
  options.tokenURL = options.tokenURL || 'https://www.paypal.com/webapps/auth/protocol/openidconnect/v1/tokenservice';
  
  OAuth2Strategy.call(this, options, verify);
  this.name = 'paypal';
  
  this._oauth2.setAccessTokenName("oauth_token");
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Paypal user_id has the following prefix https://www.paypal.com/webapps/auth/identity/user
 * At auth0 we don't want that prefix as it has redundant information
 * and also prevents user_id(s) to be included in URLs
 * We will remove this prefix.
 */

var USER_IR_PREFIX = 'https://www.paypal.com/webapps/auth/identity/user/';

/**
 * Retrieve user profile from PayPal.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `paypal`
 *   - `id`
 *   - `displayName`
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  this._oauth2.getProtectedResource('https://www.paypal.com/webapps/auth/protocol/openidconnect/v1/userinfo?schema=openid', accessToken, function (err, body, res) {
    if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }
    
    try {
      var json = JSON.parse(body);
      
      var profile = { provider: 'paypal' };
      profile.id = json.user_id ? json.user_id.replace(USER_IR_PREFIX, '') : '';
      profile.displayName = json.name;
      profile.name = { familyName: json.family_name,
                       givenName: json.given_name,
                       formatted: json.name };
      profile.emails = [ json.email ];
      
      profile._raw = body;
      profile._json = json;
      
      done(null, profile);
    } catch(e) {
      done(e);
    }
  });
}


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
