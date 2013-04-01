# Passport-PayPal-OAuth

[Passport](http://passportjs.org/) strategy for authenticating with [PayPal](http://www.paypal.com/)
using the OAuth 2.0 API.

This module lets you authenticate using PayPal in your Node.js applications.
By plugging into Passport, PayPal authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

    $ npm install passport-paypal-oauth

## Usage

#### Register your app with PayPal

Login to the [Developer Portal](https://devportal.x.com/sdm/myprofile) and register your application.

#### Configure Strategy

The PayPal authentication strategy authenticates users using a PayPal
account and OAuth 2.0 tokens.  The strategy requires a `verify` callback, which
accepts these credentials and calls `done` providing a user, as well as
`options` specifying a app ID, app secret, and callback URL.

    passport.use(new PayPalStrategy({
        clientID: PAYPAL_APP_ID,
        clientSecret: PAYPAL_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/paypal/callback"
      },
      function(accessToken, refreshToken, profile, done) {
        User.findOrCreate({ paypalId: profile.id }, function (err, user) {
          return done(err, user);
        });
      }
    ));

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'paypal'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

    app.get('/auth/paypal',
      passport.authenticate('paypal'));

    app.get('/auth/paypal/callback', 
      passport.authenticate('paypal', { failureRedirect: '/login' }),
      function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
      });

## Examples

For a complete, working example, refer to the [login example](https://github.com/jaredhanson/passport-paypal-oauth/tree/master/examples/login).

## Tests

    $ npm install --dev
    $ make test

[![Build Status](https://secure.travis-ci.org/jaredhanson/passport-paypal-oauth.png)](http://travis-ci.org/jaredhanson/passport-paypal-oauth)

## Credits

  - [Jared Hanson](http://github.com/jaredhanson)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2012-2013 Jared Hanson <[http://jaredhanson.net/](http://jaredhanson.net/)>
