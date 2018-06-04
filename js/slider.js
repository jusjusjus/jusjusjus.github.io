
var Slider = function(element_id, figure, sec) {
  var self = {
    'step': sec || 1.0,
    'element_id': element_id,
    'figure': figure
  };

  self.element = function () {
    return document.getElementById(self.element_id);
  }

  self.build = function () {
    var max = parseInt(self.figure.duration/self.step);
    var txt = "";
    txt += "<form id='sliderFrame' class='sliderFrame'>";
    txt += "<input class='timeSlider' type='range' id='currTime' name='currTime' min='0' max='"+max+"' value='0'>";
    txt += "<output id='timeDisplay' name='timeDisplay' for='currTime'></output></form>";
    self.element().innerHTML = txt;
    // add callbacks
    var frame = document.getElementById('sliderFrame');
    frame.addEventListener('input', function (e) {
      var time = document.getElementById('currTime');
      var displ = document.getElementById('timeDisplay');
      var t0 = self.step*time.value;
      self.figure.set_time(t0);
      displ.value = self.figure.rel_date_str(t0);
    });
    return self;
  }

  self.del = function () {
    self.element().innerHTML = "";
  }

  return self;
}
