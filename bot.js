var events = require('events');
var eventEmitter = new events.EventEmitter();
var idCounter = 1;

// add this per connection
connectToSlack('bot_1', "xoxb-37496795361-H51MDV35D8iGs1hy9UeUEKgc");

function connectToSlack(connection_id, token_id) {
    var http = require('https');

    var options = {
        host: 'slack.com',
        port: 443,
        path: '/api/rtm.start?token=' + token_id,
        method: 'GET'
    };

    var req = http.get(options, function (res) {
        res.setEncoding('utf8');
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            var slackResponse = JSON.parse(body);
            var WebSocket = require('ws');

            var ws = new WebSocket(slackResponse.url);

            ws.on('message', function(data, flags) {
                console.log("<<", connection_id, data);

                var messageData = JSON.parse(data);
                eventEmitter.emit("rawmessage", {"connection_id": connection_id, "message": messageData, "ws": ws});
            });

            ws.on('close', function close() {
                console.log("<<", connection_id, 'disconnected');
            });

        });
    });
}

function sendToSlack(socket, message) {
    console.log(">>>", message);
    socket.send(JSON.stringify(message));
    idCounter++;
}

// handle the different Slack events (message, ping, join, leave, etc)
eventEmitter.on("rawmessage", function(data)
{
    // chat message
    if(data.message.type == 'message') {
        eventEmitter.emit("chatmessage", {"connection_id": data.connection_id, "channel": data.message.channel, "text": data.message.text, "ws": data.ws});
    }

});

// Here is where the magic happens
eventEmitter.on("chatmessage", function(data)
{
    sendToSlack(data.ws, {"id": idCounter, "type": "message", "channel": data.channel, "text": "You said: " + data.text});
});

