App.Views.LeftNav = Backbone.View.extend({
  el: $("#main_menu"),

  events: {
    "click .icon-remove": "removePrivateChannel"
  },

  initialize: function () {
  },

  addChannel: function(pane_name, c) {
    $('#chan_nav').append('<li><a href="#'+pane_name+'" data-toggle="pill" id="pills_for_'+pane_name+'">'+c+' <span class="badge">0</span></a></li>');
  },

  addPrivateChannel: function(pane_name, c) {
    $('#chan_nav').append('<li><a href="#'+pane_name+'" data-toggle="pill" id="pills_for_'+pane_name+'">'+c+' <span class="badge">0</span><div class="icon-remove"></div></a></li>');
  },

  removePrivateChannel: function(e) {
    $($(e.target).parent().attr("href")).remove();
    $(e.target).parent().remove();
  }


});