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
        ERROR_THRESHOLD = 100,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        toString = Object.prototype.toString,
        noop = function() {},
        err_count = 0,
        loop = null,
        callbacks = {},
        errorHandler = null,
        Bieber = window.Bieber,
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
      (arity !==  undefined ? fn.length >= arity : true));
    }


    function ajax (success, error) {
      var request = new XMLHttpRequest(), json = null, toJson = JSON && JSON.parse ? JSON.parse : eval;
      request.open('GET', BIEBER_URL, true);
      request.send();

      request.onreadystatechange = function () {
        if (request.readyState === 4) {
          if (request.status === 200) {
            success(request.responseText, request);
          } else {
            error(request);
          }
        }
      }
    }

    // create custom getters & setters for the events 'on' + event
    for(var evt in EVENTS) {
      if (hasOwnProperty.call(EVENTS,evt)) {
        (function(event) {
          var cbIndex = 0;

          Object.defineProperty(Bieber, 'on' + event, {
            set: function (val) {
              if (!isFunction(val,1)) {
                throw new BieberFeedError("Event listener must be a function that takes one argument. Found: " + toString.call(val) + " | takes: " + val.length + " arguments");
              }
              else {
                cbIndex = Bieber.addEventListener(event, val);
              }
            },
            get: function() {
              return callbacks[event] && (callbacks[event].length < cbIndex) ? callbacks[event][cbIndex] : null;
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
      } else {
        throw new BieberFeedError("Attempt to stop inactive Bieber");
      }
    };

    // Bieber.addEventListener
    // add a listener for the given event
    Bieber.addEventListener = Bieber.on = function (event, cb) {
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

    Bieber.ready = function () {
      _emit('ready', Bieber);
    }


    /// PRIVATE FUNCTIONS

    function _callAPI() {
      ajax(
        // receiving success in ajax
        function (tweets) {
          if (tweets && tweets.length) {
            var i = 0, len = tweets.length, tweet = null;
            for(; i < len; (tweet = tweets[i]), i++) {
              if (tweet['id']) {
                if (!received[tweet['id']] && (received[tweet['id']] = tweet)) {
                  if (isFunction(Bieber.tpl)) {
                    _emit('tweet', Bieber.tpl(tweet), tweet);
                  } else {
                    _emit('tweet', tweets);
                  }
                }
              }
            }
          }
        },
        function (err) {
          _emit('error', tweets[i]);
          if (++err_count > ERROR_THRESHOLD) {
            Bieber.stop(err);
          }
        }

      );
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

    var variable_match = RegExp("{{([\w+\.])}}", 'g');

    function _deep_match(obj, path) {
      if (obj === undefined || !path.length) {
        return undefined;
      }
      else if (path.length > 1) {
        return _deep_match(obj[path.shift()], path);
      }

      return obj[path[0]];
    }

    function _tpl (template) {

      return function (data) {
        var match = '';
        return template.replace(variable_math, function (all, variable) {
          if (match = _deep_match(data, variable.split(".")) && match != null) {
            return match;
          } else {
            throw new BieberFeedError("template error: attribute does not exist [" + variable + "]");
          }
        });
      }
    }

    Bieber.tpl = null;
    Bieber.setTemplate = function (el) {
      el = (toString.call(el) === '[object String]') ? document.querySelector(el) : el;
      Bieber.tpl = _tpl(el.innerHTML);
    }


    return Bieber;

  }

  // check that the window is ok
  if (!window || !window.document) {
    throw new Error("Bieber Client is not loaded in the correct context.");
  }

  else if ( !window.BIEBER_URL || !window.STUDENT_LOGIN ) {
    throw new Error("Missing Bieber Configuration: window.BIEBER_URL and window.STUDENT_LOGIN");
  }

  Bieber = window.Bieber = (function (cb) {

    if (this === window) {
      return new Bieber(cb);
    }
    else {
      this.onready = cb;
    }

  });

  // now you're good; define everything on load
  window.addEventListener('load', function (event) {
    var Bieber = __CS132__(window, window.BIEBER_URL, window.STUDENT_LOGIN, (void(0)));
    Bieber.ready();
  }, false);


  // we want people to assign to Bieber.onready
  Bieber.onready = null;


}(window));
