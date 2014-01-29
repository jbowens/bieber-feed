express = require 'express'
debug = require('debug')('cs132:Miley')
MongoClient = require('mongodb').MongoClient
Twit = require 'twit'


T = new Twit {
  consumer_key: 'syGpfR9NdgPkiVnn6Qmvg'
  consumer_secret: '7HmHD2jyjootGg8AAQUVmi5NROsF4MlJ91AIIfe60A'
  access_token: '15153270-QjPbYSisbGuZTM8NFZjc8uFA85HgY2oy6omYdyewq'
  access_token_secret: 'GPPgGWCXWyGP1JLAoM2xRggnPrN4KPVXdYNzDnPWJzI'
}

debug "authenticated with twitter: #{ T }"

app = express()

crossDomain = (req, res, next) ->
  res.header 'Access-Control-Allow-Origin', '*'
  res.header 'Access-Control-Allow-Methods', 'GET,POST,OPTIONS'
  res.header 'Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With'
  next()


app.tweets = []
app.numTweets = 0
app.terms = [ 'miley', 'miley cyrus', '@MileyCyrus' ]

app.stream = T.stream 'statuses/filter', { track: app.terms.join() }
app.stream.on 'tweet', (tweet) ->
  if tweet and tweet.text and tweet.id
    app.tweets.push tweet
    app.tweets = app.tweets.slice 25 if app.tweets.length > 50 # keep it short
    app.numTweets = app.tweets.length
  else
    debug "tweet invalid: #{ tweet }"


app.use crossDomain
app.use express.logger()
app.use express.bodyParser()
app.use express.cookieParser()
app.use app.router
app.use( express.session { secret: 'cs132-bieber' })
app.use express.cookieSession {
  secret: 'cs132-miley'
}

app.use (req, res, next) ->
  res.type 'json'

connectDB = (cb) ->
  debug("connecting to database")
  MongoClient.connect('mongodb://justin:bieber@linus.mongohq.com:10053/bieber-feed', (err, db) ->
    if err
      debug "error connect to DB"
      cb(err, null)
    else
      db.collection 'connections', (err, connections) ->
        if err or not connections
          debug "error retrieving collection on db"
          cb(err, null)
        else
          debug "successfully connected to DB"
          cb(null, connections)
  )


port = process.env.port || 1337


## logging function
logRequest = (req, res, next, login) ->
  req.session ?= {}

  if req.session.login and req.session.login is not login
    res.send 403, "You've made requests from multiple logins in the same session"
    next(403)
  else
    req.session.login = login
    connectDB (err, connections) ->
      if not err
        connections.insert({
          login: login
          time: Date.now()
          query: req.query
          ip: req.ip
          host: req.host
          xhr: req.xhr
          secure: req.secure
        }, (err, connection) ->
          if err
            debug "Error logging connection: #{ err }"
            next(err)
          else
            debug "Logged Connection: #{ connection }"
            next()

        )
      else
        console.error err
        next(err)


app.param('login', logRequest)

getTweets = () ->
  if app.numTweets > 25
    app.tweets.slice(app.numTweets - 26)
  else
    app.tweets


app.get '/feed/stats/:login', (req, res) ->
  if not req.params.login
    res.send 403, "unauthenticated"
  else
    res.send 200, { count: app.numTweets, last: app.tweets[app.numTweets -1]['id'], terms: app.terms }

app.get '/feed/stats', (req, res) ->
  if not req.query.login
    res.send 403, "unauthenticated"
  else
    res.send 200, { count: app.numTweets }

app.get '/feed/:login', (req, res) ->
  if not req.params.login
    res.send 403, "unauthenticated"
  else
    res.send 200, getTweets()

app.listen port, () ->
  console.log "[Miley Listening] #{ port }"
