var App = {};

(function(){

App.paneNamer = function(servername, channame){
	var i = channame.indexOf(' ');
	channame = (i != -1 ? channame.substring(0, i): channame);
	return servername.replace(/\./g,'-') + "___" + channame.replace('#','_');
}

var last_message_date = 0;
var hw_conf = [];
var sessionTK = '';
App.Views = {};
App.Models = {};
App.createdViews = {};

var init_co = _.bind(function(){

	var socket = io.connect();//window.location.protocol+ '://'+window.location.host+'/'); //+(window.location.port != 80 ? ':'+window.location.port : '')
	App.socket = socket;

	App.createdViews.LeftNav = new App.Views.LeftNav();
	App.createdViews.ChanPane = new App.Views.ChanPane();
	var print_message = function(m,pn){
		var h = hex_md5(pn+m.from+m.mdate+m.message);
		if($('#messageid_'+h).length == 0){
			var e = $('<div class="irc_line" id="messageid_'+h+'"><span class="username">'+m.from+' : </span><span class="message">'+m.message.replace(/(<([^>]+)>)/ig,"&lt;&gt;")+'</span><span class="mdate">'+moment(m.mdate).fromNow()+'</span></div>');
			var esan = e.find('span.message');
			esan.linkify({target:'_blank'});
			esan.highlight(hw_conf,{ wordsOnly: true });
			e.addClass('linkify_done').data('message',m);
			var lines = $('#'+pn + ' div.write_message .irc_line');
			var d = new Date(m.mdate);
			var inserted  = false;
			for(var i = lines.length - 1 ; i >= 0; i--){
				if(new Date($(lines[i]).data('message').mdate) < d){
					inserted = true;
					e.insertAfter(lines[i]);
					break;
				}
			}
			if(!inserted){
				$('#'+pn + ' div.write_message').prepend(e);
			}
		}
	//	$('#'+pn + ' div.write_message').append(e);
	};
	
	socket.on('connect', function(){
		console.log('refresh time');
		
		socket.emit('get_old_message', {});
		socket.emit('get_connected_users', {});
	});

	socket.on('new_message', _.bind(function (m) {
		if (m.to == m.server.nick) {
			var pn = App.paneNamer(m.server.server, m.from);
			if ($(pn).length == 0) {
				App.createdViews.LeftNav.openPrivatePane(m.from, m, pn, [m.to, m.from]);
			}
		} else {
			var pn = App.paneNamer(m.server.server, m.to);
		}
		print_message(m,pn);
	},this));
	
	socket.on('new_old_message', _.bind(function (m) {	
		var pn = m.chan_name;
		m['from'] = m.username;
		m['message'] = m.content;
		print_message(m,pn);
  	},this));

	socket.on('nicks', _.bind(function (m) {
		_.each(m, function(elt) {
			App.createdViews.LeftNav.attachNicks(elt.server, elt.chan, elt.users);
		});
	}, this));
	
	socket.on('new_message', _.bind(function (m) {	
		last_message_date = m.time;
	},this));
	
	
	$.ajax({
	  url: '/hw_conf',
	  success: _.bind(function(hw) {
		  hw_conf = hw;
	  },this)
  });
	
	$.ajax({
	  url: '/irc_conf',
	  success: function(ss) {
		  $('#chan_nav').empty();
		  $('#chan_pane').empty();
		  for(var i in ss){
			  var s = ss[i];
			  $('#chan_nav').append('<li class="nav-header">'+s.server+'</li>');
			  for(var ii in s.options.channels){
				  var c = s.options.channels[ii];
			     var y = c.indexOf(' ');
				  c = (y != -1 ? c.substring(0, y): c);
				  
				  var pane_name = App.paneNamer(s.server, c);
				  App.createdViews.LeftNav.addChannel(pane_name, c);
				  App.createdViews.ChanPane.addChannel(pane_name, s, c);
			  }
		  }
		  $().tab();
		  $('#nick-tabs .nicks-pane').css('display','none');
	  }
	});
	
	// unread count management
	socket.on('new_message', function (m) {
		var chan;
		if (m.to == m.server.nick) {
			chan = m.from;
		} else {
			chan = m.to;
		}
		var pn = App.paneNamer(m.server.server, chan);
		var ee = $('#pills_for_' + pn + ' span.badge');
		ee.text(parseInt(ee.text(),10)+1);
	});

	socket.on('join', _.bind(function (m) {
		var pn = App.paneNamer(m.server, m.channel);
		var domElt = $("#" + pn + " " + ".username_" + m.nick);
		if (domElt.length == 0) {
			$("#nicks_" + pn).append(App.htmlUserPaneDiv(m.nick));
		}
	},this));

	socket.on('left', _.bind(function (m) {
		var pn = App.paneNamer(m.server, m.channel);
		var domElt = $("#" + pn + " " + ".username_" + m.nick);
		domElt.remove();
	},this));

},this);

var login_function = _.bind(function(){
	  $('#login_modal').modal('show');
	  $('#login_modal form').submit(function(e){
		  e.stopPropagation();
		  e.preventDefault();
		  $.post("/login", $("#login_modal form").serialize(), function(data){
			  if(data.tk != undefined){
				  sessionTK= data.tk;
				  $('#login_modal').modal('hide');
				  init_co();
			  }else{
				  alert('bad login/pass');
			  }
		  }, 'json');
		  
	  });
},this);

$(_.bind(function(){
	$.ajax({
	  url: '/check_session',
	  success: init_co,
	  error : login_function
   });
}, this));


})();

