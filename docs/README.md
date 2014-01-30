<link rel="stylesheet" href="github.css"/>
<link rel="stylesheet" href="github.md.css"/>
<script src="highlight.pack.js" type="text/javascript"></script>
<script>hljs.initHighlightingOnLoad();</script>

# Miley Feed: Api Docs
Welcome to the **Miley Feed**, a swaggy API powered by Twitter.

## Authentication
To use the API you have to add your login to the end of a url (indicated by `/:login`) in each endpoint. Requests to the API are logged and you cannot make calls with different logins during the same session.


## Endpoints

### `/feed/:login`
Get 25 tweets. Note that these might overlap with tweets you've previously received. It's your responsibility to filter out duplicate tweets. Note that tweets each have a unique `id` field. [Here's a list of the fields on a tweet object](https://dev.twitter.com/docs/platform-objects/tweets). Note that our tweets do have [entities](https://dev.twitter.com/docs/tweet-entities).

### `/feed/stats/:login`
This endpoint provides some stats on the tweets available:

    {  
      "count" : 24,  // number of tweets  
      "last" : "", // id of the last tweet  
      "terms" : [ "miley" , "miley cyrus", "@mileycyrus" ] // the search terms used to query the Twitter streaming API  
    }  

## Source
If you're interested in how the Miley Feed works, the source is available on [github](https://github.com/jbowens/miley-feed). The server is also written in JavaScript using node.js, the topic of the next project.
