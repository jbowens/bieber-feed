/***
 * CS132: Bieber Feed
 * Client Javascript Plugin
 *
 * @author nbjacob
 * Spring 2013
 ***/
;(function __CS132__(window, undefined) {
  var BIEBER_URL = 'http://localhost:1337/feed/{{login}}',
      ERROR_THRESHOLD = 100, err_count = 0, loop = null, callbacks = {},
      Bieber = window.Bieber = window.Bieber || {},
      received = {}; // ID => Tweet


  function ajax (conf) {
    var request = new XMLHttpRequest(),
        params = parametize(conf.data);

    conf.method = conf.method ? conf.method.toUpperCase() : 'GET';
    conf.url += (conf.method === 'GET') ? '?' + params : '';
    request.open(conf.method, conf.url, true);

    if (conf.method === 'POST') {
      request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      request.setRequestHeader('Content-length', params.length);
      request.setRequestHeader('Connection', 'close');
      request.send(params);
    } else {
      request.send();
    }

    request.onreadystatechange = function () {
      if (request.readyState === 4) {
        if (request.status === 200) {
          conf.success(request.responseText, request);
        } else {
          conf.error(request);
        }
      }
    }
  }

  function parametize(data) {
    if (!data) return null;

    var params = '', key;
    for(key in data) {
      if (Object.prototype.hasOwnProperty.call(data,key)) {
        params += encodeURIComponent(key) + '=' + encodeURIComponent(data[key]) + '&';
      }
    }
    return params;
  }

  //
  // Bieber.ontweet
  // this sets a callback for the 'tweet' event, a faux-event that contains the data from a new tweet received from the server
  //
  Bieber.ontweet = null;

  //
  // Bieber.onerror
  //
  Bieber.onerror = null;

  // Bieber.start()
  // begin polling the server
  // @emits a start event
  Bieber.start = function (interval) {
    setTimeout(function() {
      interval = interval*1000 || 1000;
      loop = setInterval(_callAPI, interval);
      _emit('start');
    }, 10);
  };

  // Bieber.stop()
  // stop the polling :)
  // @emits a stop event
  Bieber.stop = function () {
    if (loop) {
      clearInterval(loop);
      _emit('end');
    }
  };

  // Bieber.addEventListener
  // add a listener for the given event
  Bieber.addEventListener = function (event, cb) {
    callbacks[event] = callbacks[event] || [];
    callbacks[event].push(cb);
  }

  // Bieber.done
  // made for people who are trying to do a node-esque API
  Bieber.done = function (cb) {
    Bieber.addEventListener('tweet', function (tweet) {
      cb(null, tweet);
    });

    Bieber.addEventListener('error', function (err) {
      cb(err, null);
    });
  }


  /// PRIVATE FUNCTIONS

  _callAPI = function() {
    ajax({
      method: 'GET',
      url: BIEBER_URL,
      success: function (tweets) {
        if (tweets && tweets.length) {
          var i = 0, len = tweets.length;
          for(; i < len; i++) {
            var tweet = tweets[i];
            if (tweet['id']) {
              if (!received[tweet['id']] && (received[tweet['id']] = tweet)) {
                _emit('tweet', tweets[i]);
              }
            }
          }
        }
      },
      error: function (err) {
        _emit('error', tweets[i]);
        if (++err_count > ERROR_THRESHOLD) {
          Bieber.stop(err);
        }
      }
    });
  }

  _emit = function (event, data) {
    if (callbacks[event] && callbacks[event].length) {
      var cbs = callbacks[event], i = 0, len = cbs.length;
      for(; i < len; i++) {
        cbs(data);
      }
    }

    var str = 'on' + event,
        extra = Bieber[str] != null && typeof Bieber[str] === 'function' ? Bieber[str] : function(){};

    extra.call(extra, data);
  }

}(window));
