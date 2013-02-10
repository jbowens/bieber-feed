// Generated by CoffeeScript 1.3.1
(function() {
  var MongoClient, T, Twit, app, connectDB, crossDomain, debug, express, getTweets, logRequest, port;

  express = require('express');

  debug = require('debug')('cs132:Bieber');

  MongoClient = require('mongodb').MongoClient;

  Twit = require('twit');

  T = new Twit({
    consumer_key: 'syGpfR9NdgPkiVnn6Qmvg',
    consumer_secret: '7HmHD2jyjootGg8AAQUVmi5NROsF4MlJ91AIIfe60A',
    access_token: '15153270-QjPbYSisbGuZTM8NFZjc8uFA85HgY2oy6omYdyewq',
    access_token_secret: 'GPPgGWCXWyGP1JLAoM2xRggnPrN4KPVXdYNzDnPWJzI'
  });

  debug("authenticated with twitter: " + T);

  app = express();

  crossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    return next();
  };

  app.tweets = [];

  app.numTweets = 0;

  app.terms = ['bieber', 'justin bieber', '@justinbieber'];

  app.stream = T.stream('statuses/filter', {
    track: app.terms.join()
  });

  app.stream.on('tweet', function(tweet) {
    if (tweet && tweet.text && tweet.id) {
      app.tweets.push(tweet);
      if (app.tweets.length > 50) {
        app.tweets = app.tweets.slice(25);
      }
      return app.numTweets = app.tweets.length;
    } else {
      return debug("tweet invalid: " + tweet);
    }
  });

  app.use(crossDomain);

  app.use(express.logger());

  app.use(express.bodyParser());

  app.use(express.cookieParser());

  app.use(app.router);

  app.use(express.cookieSession({
    secret: 'cs132-bieber'
  }));

  connectDB = function(cb) {
    debug("connecting to database");
    return MongoClient.connect('mongodb://justin:bieber@linus.mongohq.com:10053/bieber-feed', function(err, db) {
      if (err) {
        debug("error connect to DB");
        return cb(err, null);
      } else {
        return db.collection('connections', function(err, connections) {
          if (err || !connections) {
            debug("error retrieving collection on db");
            return cb(err, null);
          } else {
            debug("successfully connected to DB");
            return cb(null, connections);
          }
        });
      }
    });
  };

  port = process.env.port || '/var/run/bieber.sock';

  logRequest = function(req, res, next, login) {
    if (req.session == null) {
      req.session = {};
    }
    if (req.session.login && req.session.login === !login) {
      res.send(403, "You've made requests from multiple logins in the same session");
      return next(403);
    } else {
      req.session.login = login;
      return connectDB(function(err, connections) {
        if (!err) {
          return connections.insert({
            login: login,
            time: Date.now(),
            query: req.query,
            ip: req.ip,
            host: req.host,
            xhr: req.xhr,
            secure: req.secure
          }, function(err, connection) {
            if (err) {
              debug("Error logging connection: " + err);
              return next(err);
            } else {
              debug("Logged Connection: " + connection);
              return next();
            }
          });
        } else {
          console.error(err);
          return next(err);
        }
      });
    }
  };

  app.param('login', logRequest);

  getTweets = function() {
    if (app.numTweets > 25) {
      return app.tweets.slice(app.numTweets - 26);
    } else {
      return app.tweets;
    }
  };

  app.get('/feed/stats/:login', function(req, res) {
    if (!req.params.login) {
      return res.send(403, "unauthenticated");
    } else {
      return res.send(200, {
        count: app.numTweets,
        last: app.tweets[app.numTweets-1]['id'],
        terms: app.terms
      });
    }
  });

  app.get('/feed/stats', function(req, res) {
    if (!req.query.login) {
      return res.send(403, "unauthenticated");
    } else {
      return res.send(200, {
        count: app.numTweets
      });
    }
  });

  app.get('/feed/:login', function(req, res) {
    if (!req.params.login) {
      return res.send(403, "unauthenticated");
    } else {
      return res.send(200, getTweets());
    }
  });

  app.listen(port, function() {
    return console.log("[Bieber Listening] " + port);
  });

}).call(this);
