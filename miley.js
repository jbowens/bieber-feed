(function() {
  var cluster, twitterTerms, debug;
  
  debug = require('debug')('cs132:Miley');
  twitterTerms = ['miley', 'miley cyrus', '@MileyCyrus'];
  
  cluster = require('cluster');

  if (cluster.isMaster) {
    var cpus, T, Twit, stream, workers;
    
    Twit = require('twit');
    T = new Twit({
      consumer_key: 'syGpfR9NdgPkiVnn6Qmvg',
      consumer_secret: '7HmHD2jyjootGg8AAQUVmi5NROsF4MlJ91AIIfe60A',
      access_token: '15153270-QjPbYSisbGuZTM8NFZjc8uFA85HgY2oy6omYdyewq',
      access_token_secret: 'GPPgGWCXWyGP1JLAoM2xRggnPrN4KPVXdYNzDnPWJzI'
    });
    debug("authenticated with twitter: " + T);

    broadcast = function(msg) {
      for (var i = 0; i < workers.length; i++) {
        workers[i].send(msg);
      }
    }

    stream = T.stream('statuses/filter', {
      track: twitterTerms.join()
    });

    stream.on('tweet', function(tweet) {
      if (tweet && tweet.text && tweet.id) {
        broadcast(tweet);
      } else {
        return debug("tweet invalid: " + tweet);
      }
    });

    workers = [];
    cpus = require('os').cpus().length;
    for (var i = 0; i < cpus; i++) {
      workers.push(cluster.fork());
    }

    cluster.on('exit', function (worker) {
      console.log("worker " + worker.id + " died, reviving now...");
      workerIndex = workers.indexOf(worker);
      if (workerIndex > -1)
        workers.splice(workerIndex, 1);
      workers.push(cluster.fork());
    });

  } else {
    var MongoClient, app, connectDB, crossDomain, express, getTweets, global_db, logRequest, port;

    express = require('express');
    MongoClient = require('mongodb').MongoClient;
    debug("starting up");

    app = express();

    crossDomain = function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
      return next();
    };

    app.tweets = [];
    app.numTweets = 0;

    process.on('message', function(tweet) {
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

    app.use(express.session({
      secret: 'cs132-miley'
    }));

    app.use(express.cookieSession({
      secret: 'cs132-miley'
    }));

    app.use(function(req, res, next) {
      return res.type('json');
    });

    global_db = null;

    connectDB = function(cb) {
      debug("connecting to database");
      return MongoClient.connect('mongodb://127.0.0.1:27017/miley', function(err, db) {
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

    port = process.env.port || 1337;

    logRequest = function(req, res, next, login) {
      if (req.session == null) {
        req.session = {};
      }
      if (req.session.login && req.session.login === !login) {
        res.send(403, "You've made requests from multiple logins in the same session");
        return next(403);
      } else {
        req.session.login = login;
        return global_db.insert({
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
          last: app.tweets[app.numTweets - 1]['id'],
          terms: tweetTerms
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

    connectDB(function(err, connections) {
      global_db = connections;
      return app.listen(port, function() {
        return console.log("[Miley Listening] " + port);
      });
    });
  }
}).call(this);
