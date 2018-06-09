
var Slider = function(element_id, figures, sec) {
  var self = {
    step: sec || 1.0,
    element_id: element_id,
    figures: figures,
    value: 0
  };

  self.register = function (el) {
    self.figures.push(el);
  }

  self.remove = function (el) {
    for (var f in self.figures) {
      if (el === self.figures[f]) {
        self.figures.splice(f, f+1);
        return;
      }
    }
  }

  self.element = function () {
    return document.getElementById(self.element_id);
  }

  self.build = function () {
    var max = parseInt(self.figures[0].duration/self.step);
    var txt = "";
    txt += "<form id='sliderFrame' class='sliderFrame'>";
    txt += "<input class='timeSlider' type='range' id='currTime' name='currTime' min='0' max='"+max+"' value='0'>";
    txt += "<output id='timeDisplay' name='timeDisplay' for='currTime'></output></form>";
    self.element().innerHTML = txt;
    // add callbacks
    var frame = document.getElementById('sliderFrame');
    frame.addEventListener('input', function (e) {
      var sli = document.getElementById('currTime');
      var displ = document.getElementById('timeDisplay');
      self.value = sli.value;
      var t0 = self.step*self.value;
      var txt = "";
      for (var f in self.figures) {
        self.figures[f].set_time(t0);
        txt += self.figures[f].slider_str(t0);
      }
      displ.value = txt;
    });
    return self;
  }

  self.del = function () {
    self.element().innerHTML = "";
  }

  return self;
}
