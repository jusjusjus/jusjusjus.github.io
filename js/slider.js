
var Slider = function(element_id, figure) {
  var self = {
    'element_id': element_id,
    'figure': figure
  };

  self.element = function () {
    return document.getElementById(self.element_id);
  }

  self.build = function () {
    var txt = "";
    txt += "<form id='sliderFrame' class='sliderFrame'>";
    txt += "<input class='timeSlider' type='range' id='currTime' name='currTime' min='0' max='"+self.figure.duration+"' value='0'>";
    txt += "<output id='timeDisplay' name='timeDisplay' for='currTime'></output></form>";
    self.element().innerHTML = txt;
    // add callbacks
    var frame = document.getElementById('sliderFrame');
    frame.addEventListener('input', function (e) {
      var time = document.getElementById('currTime');
      var displ = document.getElementById('timeDisplay');
      self.figure.set_time(time.value);
      displ.value = self.figure.rel_date_str(1000*time.value);
    });
    return self;
  }

  self.del = function () {
    self.element().innerHTML = "";
  }

  return self;
}
