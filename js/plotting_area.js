
'use strict'

var PlottingArea = function (element_id, edffile, window_duration, self) {
  window_duration = window_duration || 10.0; // sec.
  self = self || {};

  self.element_id = element_id;
  self.element = function () { return document.getElementById(self.element_id); };
  self.file = edffile;

  var config = {
    displayModeBar: false,
    staticPlot: true
  };

  var window_start = 0.0; // sec.

  var del = function () {
    self.element().innerHTML = '';
  }

  function set_window_duration(dt) {
    window_duration = dt;
    self.set_time(0.0);
  }

  function get_selected_labels() {
    var selected_labels = [];
    for (var c in self.file.channels) {
      var C = self.file.channels[c];
      if (C.selected) {
        selected_labels.push(C.label);
      }
    }
    return selected_labels;
  }

  function switch_selection(c, callback) {
    self.file.channels[c].selected = !(self.file.channels[c].selected);
    if (callback) { callback(); }
    create_new_plot();
  }
  
  function slider_str(millis) {
    var date = self.file.relative_date(1000*millis);
    return date.toUTCString();
  }

  function create_drawing_area() {
    var selected_labels = get_selected_labels();
    var txt = "<div class='drawingArea' id='drawingArea' style='height:"+100*selected_labels.length+"px;width:100%;'></div>";
    self.element().innerHTML = txt;
  }

  async function create_new_plot() {
    var selected_labels = get_selected_labels();
    if (selected_labels.length == 0) {
      self.element().innerHTML = "";
      return;
    }
    create_drawing_area();
    var traces = [];
    var layout = {
      hovermode: false,
      plot_bgcolor: "rgb(0.94,0.99,0.75)",
      paper_bgcolor: "rgb(0.94,0.99,0.75)",
      showlegend: false,
      xaxis: {title: "relative time (sec.)"},
      margin: { t: 0, b: 30, l: 40, r: 20 }
    };
    var domain = Array.from(new Array(selected_labels.length+1), (val, idx)=>idx/selected_labels.length)
    var Y = await self.file.get_physical_samples(window_start, window_duration, selected_labels);
    for (var c in selected_labels) {
      var c1 = Number(c)+1;
      // data
      var l = selected_labels[c];
      var sr = self.file.sampling_rate[l];
      var x = Float32Array.from(new Array(Y[l].length), (val, idx)=>idx/sr);
      var data = {
        x: x, y: Y[l],
        mode: "lines",
        line: { color: "rgb(0.0, 0.0, 0.0)", width: 1.0 },
        yaxis: "y"+c1
      };
      // layout
      layout['xaxis'+c1] = { anchor: "y"+c1 };
      layout['yaxis'+c1] = {
        zeroline: false,
        domain: [domain[c], domain[c1]],
        title: l
      };
      traces.push(data);
    }
    Plotly.newPlot("drawingArea", traces, layout, config);
  }

  async function set_time(t0) {
    t0 = t0 || window_start;
    window_start = t0;
    var drawingArea = document.getElementById("drawingArea");
    var selected_labels = get_selected_labels();
    var Y = await self.file.get_physical_samples(window_start, window_duration, selected_labels);
    var update = {x: [], y: []};
    for (var c in selected_labels) {
      var l = selected_labels[c];
      var sr = self.file.sampling_rate[l];
      update.x[c] = Float32Array.from(new Array(Y[l].length), (val, idx)=>idx/sr);
      update.y[c] = Y[l];
    }
    Plotly.restyle(drawingArea, update);
  }

  self.channels = function () { return self.file.channels; };
  self.del = del;
  self.slider_str = slider_str;
  self.duration = self.file.duration;
  self.create_new_plot = create_new_plot;
  self.switch_selection = switch_selection;
  self.set_time = set_time;

  return self;
}
