
'use strict'

var Navbar = function (element_id) {
  var self = {
    element_id: element_id,
    element: () => document.getElementById(element_id)
  };
  var channelList_id = 'navbar_channel_list';

  function html_item(type, idx, label, classes) {
    return "<"+type+" id='"+label+"' onclick='figure.switch_selection("+idx+", navbar.refresh)'"+(classes ? "class='"+classes+"'": "")+">"+label+"</"+type+">";
  }

  self.toggleDropdown = function () {
    document.getElementById(channelList_id).classList.toggle("show");
  }

  self.removeChannel = function (label) {
    var channels = figure.channels();
    for (var c in channels) {
      var C = channels[c];
      console.log(C.label, label);
      if (C.label == label) { C.selected = false; }
    }
    self.refresh();
  }

  self.refresh = function () {
    var txt = "";
    var selected = [];
    if (figure != null) {
      var channels = figure.channels();
      txt += "<div class='navbar-dropdown'>";
        txt += "<button onclick='navbar.toggleDropdown()' class='navbar-dropbtn'>Select Channels</button>";
        txt += "<div id='"+channelList_id+"' class='navbar-dropdown-content'>";
          txt += "<ul>";
          for (var c in channels) {
            var C = channels[c];
            if (!C.selected) {
              txt += html_item('li', c, C.label);
            } else {
              selected.push(c);
            }
          }
          txt += "</ul>";
        txt += "</div>";
        for (var i in selected) {
          txt += html_item('button', selected[i], channels[selected[i]].label, 'navbar-selected');
        }
      txt += "</div>";
      self.element().innerHTML = txt;
    }
  }

  return self;
}
window.Navbar = Navbar;
