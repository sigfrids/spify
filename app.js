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

var spifyBotUrl = 'https://hooks.slack.com/services/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';

app.get('/', function(req, res) {
  if (spotifyApi.getAccessToken()) {
    return res.send('You are logged in.');
  }
  return res.send('<a href="/authorise">Authorise</a>');
});

app.get('/authorise', function(req, res) {
  var scopes = ['playlist-modify-public', 'playlist-modify-private'];
  var state  = new Date().getTime();
  var authoriseURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authoriseURL);
});

app.get('/callback', function(req, res) {
  spotifyApi.authorizationCodeGrant(req.query.code)
    .then(function(data) {
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
      return res.redirect('/');
    }, function(err) {
      return res.send(err);
    });
});

app.use('/play', function(req, res, next) {
  if (req.body.token !== process.env.SLACK_TOKEN) {
    return res.status(500).send('Sea surf!');
  }
  next();
});

var makeSlackResponse = function(artist, preview, uri) {
  var spotifyLink = "https://open.spotify.com/track/";
  var textResponse = 'Matched ' + '"' + artist + '": ' + '\n' +
      preview+ '\n' +
      uri;
  return {'text' : textResponse};
};

app.post('/play', function(req, res) {
  spotifyApi.refreshAccessToken()
    .then(function(data) {
      spotifyApi.searchTracks(req.body.text)
        .then(function(data) {
          var results = data.body.tracks.items;
          if (results.length === 0) {
            return res.send('Could not match a track lol ¯|_(ツ)_/¯');
          }
          else {
            var match = res.json(makeSlackResponse(results[0].name, results[0].preview_url, results[0].uri));
            return request.post({
              url: spifyBotUrl,
              body: 'payload=' + match,
            }, function (error, response, body){

            });

            //res.send(
            //  'Matched ' + '"' + results[0].name + '": ' + '\n' +
            //  results[0].preview_url + '\n' +
            //  results[0].uri);
          }
        }, function(err) {
          return res.send(err.message);
        });
    }, function(err) {
      return res.send('Could not referesh access token, try reauthenticating.');
    });
});

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));
