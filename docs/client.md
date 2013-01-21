# Client API
## For Non-Concentrators

## Intro
For the Bieber Feed, you're going to be receiving tweets about Bieber. Our Bieber Feed Server is set up to work with our client javascript, client.js, so that you don't have to worry about writing code to work with the server. Our Bieber client works just like the DOM, so it should seem (kind of) familiar:

## Receiving Tweets
The Bieber server is a global variable, `Bieber`. It works by emitting events (just like `click` or `submit` that you can attach listeners to:

```
Bieber.ontweet = function (tweet) {
  console.log(tweet);
}
```

alternate syntax:

```
Bieber.addEventListener('tweet', function (tweet) {
  console.log(tweet);
});
```

You'll also probably want to set up a listener for errors:

```
Bieber.onerror = function (error) {
  console.log(error); // handle an error here
}
```

alternate syntax:

```
Bieber.addEventListener('error', function (error) {
  console.log(error); // same as above
});
```

Try adding either of these event listeners in a `<script>` tag below our `<script src="bieber.client.js"></script>` tag. You'll notice that nothing happends. You haven't started Bieber yet! That's pretty easy:

```
Bieber.start(); // starts Bieber Feed
Bieber.stop(); // stops it
```

If you call `Bieber.start()` in your code after you add a `ontweet` listener, you'll notice some tweets in your console (and hopefully no errors). You can call Bieber.stop() anytime to stop it. It'd be easy to add start and stop buttons to your page:

```
document.getQuerySelector('#start-button').addEventListener('click', function (event) {
  Bieber.start(); 
}, false);

document.getQuerySelector('#stop-button').addEventListener('click', function (event) {
  Bieber.stop();
}, false);
```

In case you want to know if something in your code stopped the `Bieber`, you can also listen for the `end` event:

```
Bieber.onend = function() {
  // something caused Bieber to stop
}
```

