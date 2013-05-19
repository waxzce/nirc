var config = require('./conf')
  , express = require('express') 
  , microtime = require('microtime')
  , app = express()
  , server = require('http').createServer(app)
  , irc = require('irc')
  , io = require('socket.io').listen(server)
  , pg = require('pg') //native libpq bindings = `var pg = require('pg').native`
  , clientdb = new pg.Client(config.pg_config)
  , uuid = require('node-uuid')
  , sessionid = uuid.v4()
  , __ = require('underscore')
  , clients_irc = []
  , cookieParser = express.cookieParser();

io.set('log level', 1); // reduce logging

server.listen(8080);

app.configure(function() {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(cookieParser);
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));

});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

app.get('/irc_conf', function (req, res) {
	if(req.cookies.session_tk == sessionid){
	   res.json(config.servers);
	}else{
		res.status(401);
	}
	
});

app.get('/hw_conf', function (req, res) {
	if(req.cookies.session_tk == sessionid){
	   res.json(config.highlightwords);
	}else{
		res.status(401);
	}
	
});

app.post('/login', function (req, res) {
	if(req.body.inputPassword == config.pass && req.body.inputUser == config.username){
		res.cookie('session_tk', sessionid);
		res.json({tk:sessionid});
	}else{
	   res.clearCookie('session_tk');
      res.json(401,{message:'invalid'});
	}
});

app.get('/check_session', function (req, res) {
	if(req.cookies.session_tk == sessionid){
		res.json({status:'already connected'});
	}else{
	   res.clearCookie('session_tk');
      res.json(401,{message:'invalid'});
	}
});




clientdb.connect();

var new_messenger = function (from, to, message) {
	var d = microtime.nowStruct()[0];
  	 this.emit('new_message', {
		 "from" : from, 
		 "to" : to, 
		 "message" : message, 
		 "server" : this.opt,
		 "time": d,
		 "mdate": new Date(d*1000)
	 });
};

var socketsend = function (m) {
  	 io.sockets.emit('new_message', m);
};

var db_reccord = function (m) {
  clientdb.query({
  			text:'INSERT INTO message(chan_name, username, mdate, content) values($1, $2, to_timestamp('+m.time+'), $3)',
  			values:[paneNamer(m.server.server, m.to), m.from, m.message]
  		});
};

var join_channel = function(channel, nick, message) {
  new_messenger.bind(this)(nick, channel, "joined");
  io.sockets.emit("join", {"server": this.opt.server.replace(/\./g,'-'), "channel": channel, "nick": nick, "message": message });
}

var left_channel = function(channel, nick, message) {
  new_messenger.bind(this)(nick, channel, "left");
  io.sockets.emit("left", {"server": this.opt.server.replace(/\./g,'-'), "channel": channel, "nick": nick, "message": message });
}

var paneNamer = function(servername, channame){
	var i = channame.indexOf(' ');
	channame = (i != -1 ? channame.substring(0, i): channame);
	return servername.replace(/\./g,'-') + "___" + channame.replace('#','_');
};

var stream_row = function(row) {
		  this.emit('new_old_message',row);
		};


__.each(config.servers, function(s, index, list){
	clients_irc[s.server.replace(/\./g, '-')] = (new irc.Client(s.server, s.nickname, s.options));
},this);


for(var i in clients_irc){
	var c = clients_irc[i];
	c.addListener('message',new_messenger.bind(c));
	c.addListener('new_message',socketsend);
	c.addListener('new_message',db_reccord);
  c.addListener('join', join_channel.bind(c));
  c.addListener('part',left_channel);
  c.addListener('error', function(message) {
    console.log('error: ', message);
  });
}

io.set('authorization', function (data, accept) {
	
    // check if there's a cookie header
    if (data.headers.cookie) {
        // if there is, parse the cookie
		  var cookies = {};
		    data.headers.cookie && data.headers.cookie.split(';').forEach(function( cookie ) {
		      var parts = cookie.split('=');
		      cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
		    });
			 
			 if(cookies['session_tk'] == sessionid){
			    accept(null, true);
			 
			 }else{
		       return accept('Invalid token.', false);
			 
			 }
    } else {
       // if there isn't, turn down the connection with a message
       // and leave the function.
       return accept('No cookie transmitted.', false);
    }
    // accept the incoming connection
    accept(null, true);
});

io.sockets.on('connection', function (socket) {
	  	
	socket.on('publish_message', function(m){
	   var c = clients_irc[m.server.server.server.replace(/\./g, '-')];
		c.say(m.server.chat, m.message);
		c.emit('message', c.opt.nick, m.server.chat, m.message);
   });
	
	socket.on('get_old_message', function(o){
		if(o.time != undefined){
	   	var q = clientdb.query({
		   	name: 'looking for old messages',
		   	text: "SELECT * FROM message WHERE mdate > to_timestamp("+o.time+") ORDER BY mdate ASC"
			});
			q.on('row', stream_row.bind(socket));
		}else{
			__.each(config.servers, function(s, index, list){
				__.each(s.options.channels, function(c){
					var pn = paneNamer(s.server, c);
			   	var q = clientdb.query({
				   	name: 'looking for old messages without time',
				   	text: "SELECT * FROM message WHERE chan_name = $1 ORDER BY mdate DESC LIMIT 90",
						values:[pn]
					});
					q.on('row', stream_row.bind(socket));
				});
			},this);
	   	
		}
		
   });
   
	socket.on('get_30_old_message', function(o){
		if(o.to_time != undefined){
         
         
			   	var q = clientdb.query({
				   	name: 'looking for old messages with time',
				   	text: "SELECT * FROM message WHERE chan_name = $1 AND mdate < to_timestamp("+o.to_time+") ORDER BY mdate DESC LIMIT 90",
						values:[o.pn]
					});
					q.on('row', stream_row.bind(socket));
		}else{
			
	   	
		}
		
   });

  socket.on('get_connected_users', function(e){
    var nicks = [];
    __.each(config.servers, function(s, index, list){
      var serverName = s.server.replace(/\./g, '-');
      var chans = clients_irc[serverName].chans;
      __.each(__.values(chans), function(elt) {
        var temp = {"server": serverName, "chan": elt.key, "users": __.keys(elt.users)};
        nicks.push(temp);
      });
    });
    socket.emit("nicks", nicks);
  });
	
});
