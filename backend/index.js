// var express = require("express");
// var app = express();
var WebSocketServer = require('websocket').server;
var http = require('http');

// list of currently connected clients (users)
var clients = [];
var perTrackerClients = {}

let trackerData = {}

var server = http.createServer(function (request, response) {
    // process HTTP request. Since we're writing just WebSockets
    // server we don't have to implement anything.
});

server.listen(1337, function () { });

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function (request) {
    console.log("received connection request")
    var connection = request.accept(null, request.origin);
    var index = clients.push(connection) - 1;
    var trackerKey = false
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            
            if (trackerKey === false) {
                //push trackerData for this key
                trackerKey = message.utf8Data
                if (!(trackerKey in perTrackerClients)) {
                    perTrackerClients[trackerKey] = []
                }                
                perTrackerClients[trackerKey].push(connection)
                console.log("Connecting to tracker [" + trackerKey + "]")
                connection.sendUTF(getTrackerDataForKey(trackerKey))
            } else {
                // process WebSocket message
                var request;
                try {
                    request = JSON.parse(message.utf8Data)
                } catch(e) {
                    console.log("error!")
                    console.log(e)
                    return;
                }

                //toggling an item, then push to all clients
                console.log(request)
                toggleTrackerData(trackerKey, parseInt(request.player), parseInt(request.item))   
                jsonResponse = getTrackerDataForKey(trackerKey);
                perTrackerClients[trackerKey].map((connection) => {
                    connection.sendUTF(jsonResponse);
                    return true;
                })                         
            }             
        }
    });

    connection.on('close', function (connection) {
        // close user connection
        console.log("closing connection...")
        clients.splice(index, 1);
        
        for (const [key, value] of Object.entries(perTrackerClients)) {
            for (var i = 0; i < perTrackerClients[key].length; i++) {
                if(perTrackerClients[key][i] === this) {
                    perTrackerClients[key].splice(i, 1);
                    return;
                }
            }    
        }
    });
});

function getTrackerDataForKey(key) {
    if (!(key in trackerData)) {
        trackerData[key] = [0,0,0,0]
    }

    return trackerData[key]
}

function toggleTrackerData(key, player, item) {
    if (!(key in trackerData)) {
        trackerData[key] = []
    }
    
    if ((trackerData[key][player] & item) === item) {
        trackerData[key][player] = trackerData[key][player] - item
    } else {
        trackerData[key][player] = trackerData[key][player] + item;
    }
}
