App.Views.ChanPane = Backbone.View.extend({
  el: $("#chan_pane"),

  events: {
    "click .nick-pane-elt": "preOpenPrivatePane"
  },

  initialize: function () {
  },

  preOpenPrivatePane: function(e) {
    var username = $(e.target).html();
    var server = $(e.target).parent().parent().data("ircinfo");
    var pane_name = App.paneNamer(server.server.server, username);
    this.openPrivatePane(username, server, pane_name, [username, server.server.nickname]);
    $('#chan_nav a[href="#' + pane_name + '"]').tab('show');
  },

  openPrivatePane: function(username, server, pane_name, users) {
    if ($('#' + pane_name).length == 0 && username !== server.server.nickname) {
      App.createdViews.LeftNav.addPrivateChannel(pane_name, username);
      this.addChannel(pane_name, server.server, username);
      App.attachNicks(server.server.server, username, users);
    }
    
  },

  addChannel: function(pane_name, s, c) {
    $('#chan_pane').append('<div id="'+pane_name+'" class="tab-pane tab-message-pane"><div class="write_message"></div><div class="nicks-pane"></div></div>');
    $('#chan_pane div.tab-pane:last').append($('.wellhidden .send_message').clone());
    $('#chan_pane div.tab-pane:last').data('ircinfo',{server:s,chat:c});
    $('#' + pane_name + ' .send_message form').submit(function(e){
      e.stopPropagation();
      e.preventDefault();
      var newmesstag = $(e.target).find('input.sended_message');
      if(newmesstag.val() != ''){
        var y = $(e.target).parents('div.tab-pane').data('ircinfo');
        App.socket.emit('publish_message', {
          message:newmesstag.val(),
          server:y
        });
       newmesstag.val('');
      }
    });
  }

});