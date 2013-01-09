App.Views.ChanPane = Backbone.View.extend({
  el: $("#chan_pane"),

  events: {
  },

  initialize: function () {
  },

  addChannel: function(pane_name, s, c) {
    $('#chan_pane').append('<div id="'+pane_name+'" class="tab-pane tab-message-pane"><div class="write_message"></div></div>');
    $('#nick-tabs').append('<div id="nicks_'+pane_name+'" class="nicks-pane"></div>');
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