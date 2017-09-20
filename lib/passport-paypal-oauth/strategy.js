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
    options = options || {sandbox: false};
    options.authorizationURL = options.authorizationURL || 'https://www.paypal.com/webapps/auth/protocol/openidconnect/v1/authorize';
    options.tokenURL = options.tokenURL || 'https://api.paypal.com/v1/identity/openidconnect/tokenservice';
    if (options.sandbox !== false) {
        options.authorizationURL = 'https://www.sandbox.paypal.com/webapps/auth/protocol/openidconnect/v1/authorize';
        options.tokenURL = 'https://api.sandbox.paypal.com/v1/identity/openidconnect/tokenservice';
    }
    this.sandbox = options.sandbox;

    OAuth2Strategy.call(this, options, verify);
    this.name = 'paypal';

    this._oauth2.setAccessTokenName("access_token");
    this._oauth2.setAuthMethod('Bearer');
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);


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
Strategy.prototype.userProfile = function (accessToken, done) {
    var profileUrl = 'https://api.paypal.com/v1/identity/openidconnect/userinfo?schema=openid';

    if (this.sandbox !== false) {
        profileUrl = 'https://api.sandbox.paypal.com/v1/identity/openidconnect/userinfo?schema=openid';
    }
    this._oauth2.getProtectedResource(profileUrl, accessToken, function (err, body, res) {
        if (err) {
            return done(new InternalOAuthError('failed to fetch user profile', err));
        }

        try {
            var json = JSON.parse(body);

            var profile = json;
            profile.provider = 'paypal';
            profile.id = (profile.user_id) ? profile.user_id : '';
            if (profile.given_name) {
                profile.displayName = profile.given_name + " " + profile.family_name;
                profile.name = {
                    familyName: profile.family_name,
                    givenName: profile.given_name,
                    formatted: profile.displayName
                };
            }
            profile.emails = [profile.email];

            profile._raw = body;
            profile._json = json;

            done(null, profile);
        } catch (e) {
            done(e);
        }
    });
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
