//Trevor Lane & Jamaal Chaney
//Watch Party
//server.js written by Trevor Lane
// server.js
var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var clients = []; //number of clients 
var host;
//allows us to serve up static files like js files, css, etc. so we can add styles now
app.use(express.static(__dirname + '/public'));  
//redirect / to our index.html file
app.get('/', function(req, res, next) {  
    res.sendFile(__dirname + '/index.html');
});

//Listening on local host *3000
server.listen(3000, function(){
    console.log('listening on *:3000');
  });    
 


//every 7 seconds, check for sync
  setInterval( function() {
      io.emit('autoSync');
    }, 7000);

/*
Connect & Disconnect
*/

  io.on('connection', function(socket) {
    // Connect Socket
    clients.push(socket); //adds new connection obj to clients array
    console.log('Client %s connected',socket.id);
    var clientCount = io.engine.clientsCount;
    if(clientCount == 1)
    {
      host = socket.id;
      console.log(socket.id + 'is the first one at the party, making them the host!');
    }
      console.log("%s watching right now",clientCount);
   
    // BUG REPORT: Disconnect fixed, because it has to be socket.on not io.on
    // BUG REPORT: disconnect socket.id was undefined because i have socket as param in function, when it only needs it be in connect function
   
   //When a client disconnects, do the following
    socket.on('disconnect', function() {
    var clientCount = io.engine.clientsCount;
    console.log("Client %s disconnected",socket.id);
    if(socket.id == host)
      {
        console.log(socket.id + ' (the host) has left the throne');
        clients.splice(clients.indexOf(socket), 1); //removes disconnected socket connection obj from array of active clients
        if(clientCount > 0)
        {
        host = clients[0].id; //makes the oldest active connection the new host
        console.log('the new host is: '+ clients[0].id);
        }
        else{
          console.log('No one left to assign host to. The throne will stay empty');
          }
      }
      else{ //remove non-hosts as well
          clients.splice(clients.indexOf(socket), 1);
        }
    console.log("%s watching right now",clientCount);
  }); 
/*
End of Connect & Disconnect
*/

//Pause all videos
socket.on('cl-pause',function(){
  console.log('pausing all videos');
  //io.emit  not socket.emit
  io.emit('pause'); 
});
//Plays all videos
socket.on('cl-play',function(){
  console.log('Play');
  //io.emit not socket.emit
  io.emit('play'); 
});
//Change video
socket.on('changeVid',function(data){
  var newVideoID = data.videoID;
  console.log('changing all videos to: '+ newVideoID);
  io.emit('changeVidID',{videoID : newVideoID }) //send out message to all sockets to change video to new video ID
});
/*
Sync button functionalities
*/
socket.on('getHostID',function() //2
{
  //console.log("recieved request for hostID from client")
  //console.log("hostID = " + host);
 //io.sendto(sends a message just to the host)
 io.to(host).emit('getHostData'); //3
});

//Originally just host time, now has both time and video id
socket.on('hostData', function(data) //6
{
  console.log('Received host time: '+ data.hostTime);
  //prevents loading nothing as video ID
  if(data.hostVidID != null)
  {
    console.log('Recieved host video ID: ' + data.hostVidID);
  }
  else{
    console.log('No new video ID from Host');
  }
  
  console.log('Re-Sync!');
  socket.broadcast.emit('sync',{ hostTime: data.hostTime, hostVidID : data.hostVidID}); //7    sends to all sockets but host
});
});
