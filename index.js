

var restify = require('restify');
var rp = require('request-promise');

const server = restify.createServer({
    name: 'pingtest',
    version: '1.0.0'
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.get('/ping', function (req, res, next) {

    if (!process.env.WEBCHAT_SECRET) {
        res.send(400, "BOT_SECRET env variable is missing");
        return next();
    }
    if (!req.query.utterance) {
        res.send(400, "utterance query param is missing");
        return next();
    }
    rp(
        {
            method: 'POST',
            uri: 'https://directline.botframework.com/v3/directline/conversations',
            headers:
            {
                Authorization: "Bearer " +  process.env.WEBCHAT_SECRET
            },
            json: true
        }
    ).then(function (data) {
        console.log("conversation Id " + data.conversationId);
        var uri = "https://directline.botframework.com/v3/directline/conversations/{id}/activities";
        uri = uri.replace("{id}", data.conversationId);
        return rp(
            {
                uri: uri, method: "POST",
                headers: {
                    Authorization: "Bearer " +  process.env.WEBCHAT_SECRET
                },
                body: {
                    "type": "message",
                    "from": {
                        "id": "user1"
                    },
                    "text": req.query.utterance
                },
                json: true
            }).then(function (data2) {
                var uri = "https://directline.botframework.com/v3/directline/conversations/{id}/activities";
                uri = uri.replace("{id}", data.conversationId);
                setTimeout(function () {
                    return rp({
                        uri: uri,
                        method: "GET",
                        headers: {
                            Authorization: "Bearer " +  process.env.WEBCHAT_SECRET
                        },
                        json: true
                    }).then(function (data3) {
                        res.send(200, data3.activities[1].text);
                    })
                }, 5000);
            })
    }).catch(function (err) {
        res.send(400, err.message);
    });
    return next();
});

    

server.listen(process.env.PORT || 3000, function () {
    console.log('%s listening at %s', server.name, server.url);
});
