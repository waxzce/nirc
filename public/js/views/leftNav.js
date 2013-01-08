App.Views.LeftNav = Backbone.View.extend({
  el: $("#main_menu"),

  events: {
  },

  initialize: function () {
  },

  addChannel: function(pane_name, c) {
    $('#chan_nav').append('<li><a href="#'+pane_name+'" data-toggle="pill" id="pills_for_'+pane_name+'">'+c+' <span class="badge">0</span></a></li>');
  }


});