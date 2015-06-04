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
            spifyBody += '"pretext": "' + req.body.text + '", ';
            spifyBody += '"title": "' + results[0].name + '", ';
            spifyBody += '"title_link": "' + results[0].preview_url + '", ';
            spifyBody += '"text": "' + 'Artist: ' + results[0].artists[0].name + '\\nAlbum: ' + results[0].album.name + '", ';
            spifyBody += '"thumb_url": "' + results[0].album.images[1].url + '", ';
            spifyBody += '"color": "#1ED760"';
            spifyBody += '}]}';

            //results[0].preview_url
            //results[0].external_urls.spotify
            //results[0].uri

            var spifyBody1 = '{"text":"https://www.spotify.com","version":"1.0","thumbnail_width":300,' +
                '"height":380,"thumbnail_height":300,"title":"John De Sohn - Dance Our Tears Away - Radio Edit","width":300,' +
                '"thumbnail_url":"https://d3rt1990lpmkn.cloudfront.net/cover/35ff8ecde854e7c713dc4ffad2f31441e7bc1207",' +
                '"provider_name":"Spotify","type":"rich",' +
                '"html":"<iframe src="https://embed.spotify.com/?uri=spotify:track:298gs9ATwr2rD9tGYJKlQR"' +
                ' width="300" height="380" frameborder="0" allowtransparency="true">' +
                '</iframe' +
                '>"}';

            var spifyBody2 = '{"text":"https://embed.spotify.com/oembed/?url=http://open.spotify.com/track/298gs9ATwr2rD9tGYJKlQR"}';

            return request.post({
              url: spifyBotUrl,
              body: spifyBody2
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
