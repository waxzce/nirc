(function(){
var paneNamer = function(servername, channame){
	return servername.replace(/\./g,'-') + "___" + channame.replace('#','_');
}

var last_message_date = 0;
var hw_conf = [];
var sessionTK = '';

var print_message = function(m,pn){
	var h = hex_md5(pn+m.from+m.mdate+m.message);
	if($('#messageid_'+h).length == 0){
	var e = $('<div class="irc_line" id="messageid_'+h+'"><span class="username">'+m.from+' : </span><span class="message">'+m.message+'</span><span class="mdate">'+moment(m.mdate).fromNow()+'</span></div>');
	var esan = e.find('span.message');
//	$('#'+pn + ' div.write_message').append('<div class="irc_line"><span class="username">'+m.from+' : </span><span class="message">'+m.message+'</span></div>');
//	$('#'+pn + ' div.write_message .irc_line:not(.linkify_done) span.message').highlight(hw_conf,{ wordsOnly: true });
	esan.highlight(hw_conf,{ wordsOnly: true });
	esan.linkify({target:'_blank'});
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

var init_co = _.bind(function(){
	var socket = io.connect();//window.location.protocol+ '://'+window.location.host+'/'); //+(window.location.port != 80 ? ':'+window.location.port : '')
	
	socket.on('connect', function(){
		console.log('refresh time');
		
		socket.emit('get_old_message', {});
	});
	socket.on('new_message', _.bind(function (m) {	
		var pn = paneNamer(m.server.server, m.to);
		print_message(m,pn);
	},this));
	
	socket.on('new_old_message', _.bind(function (m) {	
		var pn = m.chan_name;
		m['from'] = m.username; 
		m['message'] = m.content; 
		print_message(m,pn);
  	},this));
	
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
				  var pane_name = paneNamer(s.server, c);
				  $('#chan_nav').append('<li><a href="#'+pane_name+'" data-toggle="pill" id="pills_for_'+pane_name+'">'+c+' <span class="badge">0</span></a></li>');
				  $('#chan_pane').append('<div id="'+pane_name+'" class="tab-pane tab-message-pane"><div class="write_message"></div></div>');
				  $('#chan_pane div.tab-pane:last').append($('.wellhidden .send_message').clone());
				  $('#chan_pane div.tab-pane:last').data('ircinfo',{server:s,chat:c});
			  }
		  }
		  $('.send_message form').submit(function(e){
			  e.stopPropagation();
			  e.preventDefault();
			  var newmesstag = $(e.target).find('input.sended_message');
			  if(newmesstag.val() != ''){
			  	var y = $(e.target).parents('div.tab-pane').data('ircinfo');
			  	socket.emit('publish_message', {
					  message:newmesstag.val(),
				  	  server:y
				});
			   newmesstag.val('');
			  }
		  });
		  $().tab();
	     $('a[data-toggle="pill"]').on('shown', function (e) {
	     		$(e.target).find('span.badge').text(0); // activated tab
		  })	
	  }
	});
	
	
	
	// unread count management
	socket.on('new_message', function (m) {	
		var pn = paneNamer(m.server.server, m.to);
		var ee = $('#pills_for_' + pn + ' span.badge');
		ee.text(parseInt(ee.text(),10)+1);
	});
	
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

