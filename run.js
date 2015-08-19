'use strict';

var dotenv = require('dotenv');
dotenv.config({
  silent: true
});
dotenv.load();

var WebSocket = require('ws'),
    authUrl = "https://slack.com/api/rtm.start?token=" + process.env.API_TOKEN,
    request = require("request"),
    YouTube = require('youtube-node'),
    //rp = require('request-promise'),
    errorSlackMsg = 'Hubo un error',
    _ = require('lodash');

request(authUrl, function(err, response, body) {
  if (!err && response.statusCode === 200) {
    var res = JSON.parse(body);
    if (res.ok) {
      connectWebSocketMusic(res.url);
    }
  }
});

function errorResponse(error, ws,messageChannel){
  console.log('\n'+error+'\n');
  ws.send(JSON.stringify({ channel: messageChannel, id: 1, text:errorSlackMsg, type: "message" }));
  errorSlackMsg = 'Hubo un error';
}





function connectWebSocketMusic(url) {

  var ws = new WebSocket(url);

  ws.on('open', function() {
      console.log('Connected');
  });

  ws.on('message', function(message) {
      console.log('received:', message);
      message = JSON.parse(message);
      var msgStr = message.text;

      var askingSong = _.startsWith(msgStr, "video:" );
      var askingCover  = _.startsWith(msgStr, "covereame:" );
      var videoStr;
      if (askingSong || askingCover) {
          if (askingSong){
            videoStr = _.trimLeft(msgStr,'video:');
          } else {
            videoStr = _.trim(_.trimLeft(msgStr,'covereame:')) + ' cover version';
          }

          var youTube = new YouTube();
          youTube.setKey(process.env.YOUTUBE_KEY);
          youTube.search(_.trim(videoStr), 10, function(error, result) {
            if (error) {
              console.log("\n\n ERROR:\n"+error+"\n");
            }
            else {
              var videosIds =_.map(result.items, function(item) {
                            return item.id.videoId;
                          });

              var videoInPosition = 0;
              if (askingCover){
                videoInPosition =_.random(0,0);
              }

              ws.send(JSON.stringify({ channel: message.channel, id: 1, text: "https://www.youtube.com/watch?v="+videosIds[videoInPosition], type: "message" }));
            }
          });
      }
  });
}
