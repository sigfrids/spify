var express       = require('express');
var bodyParser    = require('body-parser');
var request       = require('request');
var dotenv        = require('dotenv');
var SpotifyWebApi = require('spotify-web-api-node');

dotenv.load();

var spotifyApi = new SpotifyWebApi({
  clientId     : process.env.SPOTIFY_KEY,
  clientSecret : process.env.SPOTIFY_SECRET,
  redirectUri  : process.env.SPOTIFY_REDIRECT_URI
});

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

var spifyBotUrl = "https://hooks.slack.com/services/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";

app.post('/play', function(req, res) {
  if (req.body.token !== process.env.SLACK_TOKEN) {
    return res.status(500).send('Sea surf!');
  }
  spotifyApi.searchTracks(req.body.text)
        .then(function(data) {
          var results = data.body.tracks.items;
          if (results.length === 0) {
            return res.send('Could not match a track lol ¯|_(ツ)_/¯');
          }
          else {
            var spifyBody = '{"attachments": [ {';
            spifyBody += '"pretext": "spify says jumba gumba to", ';
            spifyBody += '"title": "' + results[0].name + '", ';
            spifyBody += '"title_link": "' + results[0].preview_url + '", ';
            spifyBody += '"text": "' + results[0].artists[0].name + '", ';
            //spifyBody += '"text": "<' + results[0].preview_url + '|' + results[0].name + '>", ';
            //spifyBody += '"thumb_url: "' + results[0].album.images[2].url + '", ';
            spifyBody += '"color": "#2ebd59"';
            spifyBody += '}]}';

            return request.post({
              url: spifyBotUrl,
              body: spifyBody
              //body: '{"text": "<' + results[0].preview_url + '|' + results[0].name + '>"}'
              //body: '{"attachments": [ { "fallback": "Network traffic (kb/s): How does this look? @slack-ops - Sent by Julie Dodd - https://datadog.com/path/to/event"
              // , "title": "Network traffic (kb/s)", "title_link": "https://datadog.com/path/to/event", "text": "How does this look? @slack-ops - Sent by Julie Dodd",
              // "image_url": "https://datadoghq.com/snapshot/path/to/snapshot.png", "color": "#764FA5"}]}'
            }, function (error, response, body){
              if (error) {
                return res.send('Unable to publish to channel.');
              }
            });
          }
        }, function(err) {
          return res.send(err.message);
        });
});

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));
