App.Views.LeftNav = Backbone.View.extend({
  el: $("#main_menu"),

  events: {
    "click .icon-remove": "removePrivateChannel",
    "click .nick-pane-elt": "preOpenPrivatePane",
    "click #chan_nav a": "preOpenUserPane"
  },

  openUserPane: function(paneName) {
    // Activated tabs
    $('#chan_nav a[href="#' + paneName + '"]').find('span.badge').text(0);
    $('#chan_nav a[href="#' + paneName + '"]').css('display','block');

    // Activated nicks
    $('#nick-tabs .nicks-pane').css('display','none');
    $('#nicks_' + paneName).css('display','block');
  },

  preOpenUserPane: function(e) {
    if (!$(e.target).hasClass("icon-remove")) {
      this.openUserPane($(e.target).attr("href").substring(1));
    }
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
    $("#nicks_" + $(e.target).parent().attr("href").replace("#", "")).remove();
  },

  preOpenPrivatePane: function(e) {
    var username = $(e.target).html();
    var id = $($(e.target).parent().get(0)).attr("id");
    var paneId = "#" + id.replace("nicks_", "");
    var server = $(paneId).data("ircinfo");
    var pane_name = App.paneNamer(server.server.server, username);
    if ($('#' + pane_name).length == 0 && username !== server.server.nickname) {
      this.openPrivatePane(username, server, pane_name, [username, server.server.nickname]);
      $('#' + this.el.id + ' a[href="#' + pane_name + '"]').tab('show');
      this.openUserPane(pane_name);
    }
  },

  openPrivatePane: function(username, server, pane_name, users) {
    this.addPrivateChannel(pane_name, username);
    App.createdViews.ChanPane.addChannel(pane_name, server.server, username);
    this.attachNicks(server.server.server, username, users);
  },

  attachNicks: function(server, chan, nicks) {
    var that = this;
    var html = "";
    var domElt = "#nicks_" + App.paneNamer(server, chan);
    _.each(nicks, function(nick){
      html += that.htmlUserPaneDiv(nick);
    });
    $(domElt).html(html);
  },

  htmlUserPaneDiv: function(nick) {
    return '<div class="nick-pane-elt username_' + nick + '">' + nick + '</div>';
  }

});