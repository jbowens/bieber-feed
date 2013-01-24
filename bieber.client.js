/***
 * CS132: Bieber Feed
 * Client Javascript Plugin
 *
 * @author nbjacob
 * Spring 2013
 ***/
;(function (window, undefined) {

  function __CS132__(window, url, login, undefined) {

    var BIEBER_URL = url + '/' + login,
        ERROR_THRESHOLD = 100, err_count = 0, loop = null, callbacks = {},
        errorHandler = null,
        Bieber = window.Bieber = window.Bieber || {},
        // list the events to give
        hasOwnProperty = Object.prototype.hasOwnProperty,
        toString = Object.prototype.toString,
        noop = function() {},
        EVENTS = {
          tweet: 'tweet',
          start: 'start',
          stop: 'end',
          end: 'end'
        },
        received = {}; // ID => Tweet

    // custom error
    function BieberFeedError(msg) {
      this.name = 'BieberFeedError';
      Error.call(this, msg);
    }

    function __err__() {};
    __err__.prototype = Error.prototype;
    BieberFeedError.prototype = new __err__();
    BieberFeedError.prototype.constructor = BieberFeedError;

    // helpers
    function isFunction(fn, arity) {
      ((toString.call(fn) === '[object Function]') &&
      (arity !== undefined && fn.length >= arity));
    }


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
        if (hasOwnProperty.call(data,key)) {
          params += encodeURIComponent(key) + '=' + encodeURIComponent(data[key]) + '&';
        }
      }
      return params;
    }

    // create custom getters & setters for the events 'on' + event
    for(var evt in EVENTS) {
      if (hasOwnProperty.call(EVENTS,evt)) {
        (function(event) {
          Object.defineProperty(Bieber, 'on' + event, {
            set: function (val) {
              if (!isFunction(val,1)) {
                throw new BieberFeedError("Event listener must be a function that takes one argument. Found: " + toString.call(val) + " | takes: " + val.length + " arguments");
              }
              else {
                Bieber.addEventListener(event, val);
              }
            },
            get: function() {
            }

          });
        }(evt));

      }
    }


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
      if (EVENTS[event] && (event = EVENTS[event])) {
        callbacks[event] = callbacks[event] || [];
        callbacks[event].push(cb);

        if (event === 'error') {
          errorHandler = cb;
        }

        return callbacks[event].length;
      } else {
        throw new BieberFeedError("attempt to assign listener for nonexistent event: " + event);
      }
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

    function _callAPI() {
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

    function _emit(event, data) {
      // if you don't have a handler for this, freak out
      if (event === 'error' && errorHandler === null) {
        throw new BieberFeedError("Unhandled Bieber Error: " + data);
      }

      if (callbacks[event] && callbacks[event].length) {
        var cbs = callbacks[event], i = 0, len = cbs.length;
        for(; i < len; i++) {
          cbs(data);
        }
      }
    }

  }

  // check that the window is ok
  if (!window || !window.document) {
    throw new Error("Bieber Client is not loaded in the correct context.");
  }

  else if ( !window.BIEBER_URL || !window.STUDENT_LOGIN ) {
    throw new Error("Missing Bieber Configuration: window.BIEBER_URL and window.STUDENT_LOGIN");
  }

  // now you're good; define everything on load
  window.addEventListener('load', function (event) {
    __CS132__(window, window.BIEBER_URL, window.STUDENT_LOGIN, (void(0)));
  }, false);

}(window));
