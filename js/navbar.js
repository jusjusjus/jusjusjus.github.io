
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
    if (figure != null) {
			var channels = figure.channels();
      for (var c in figure.channels()) {
        var C = channels[c];
        txt += "<li";
        if (C.selected) {
          txt += " class='selected'";
        } else {
          txt += " class='unselected'";
        }
        txt += " onclick='figure.switch_selection("+c+", navbar.refresh)'>"+C.label+"</li>";
      }
      txt += "<li class='clear' onclick='clear_filecache()'>Close file</li>";
    }
    self.element().innerHTML = txt;
	}

  return self;
}
window.Navbar = Navbar;
