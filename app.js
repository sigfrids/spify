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
        var randomNum = Math.floor((Math.random() * data.body.tracks.limit));

        var spifyBody = '{"attachments": [ {';
        spifyBody += '"pretext": "Ok anon, here is some ' + req.body.text + ' for you:", ';
        spifyBody += '"title": "' + results[randomNum].name + '", ';
        spifyBody += '"title_link": "' + results[randomNum].preview_url + '", ';
        spifyBody += '"text": "' + 'Artist: ' + results[randomNum].artists[0].name + '\\nAlbum: ' + results[randomNum].album.name + '", ';
        spifyBody += '"thumb_url": "' + results[randomNum].album.images[1].url + '", ';
        spifyBody += '"color": "#1ED760"';
        spifyBody += '}]}';        

        return request.post({
          url: spifyBotUrl,
          body: spifyBody
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
