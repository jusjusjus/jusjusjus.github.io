
PlottingArea = function (div_element_id, edffile) {

  var self = {
    'element': document.getElementById(div_element_id),
    'file': edffile
  };

  var config = {
    displayModeBar: false,
    staticPlot: true
  };

  var window_start = 0.0, window_duration = 10.0; // sec.

  del = function () {
    self.element.innerHTML = '';
    delete self;
  }

  function get_selected_channels() {
    var selected_channels = [];
    for (c in self.file.channels) {
      C = self.file.channels[c];
      if (C.selected) {
        selected_channels.push(C);
      }
    }
    return selected_channels;
  }

  function switch_selection(c, callback) {
    self.file.channels[c].selected = !(self.file.channels[c].selected);
    if (callback) {callback();}
    create_new_plot();
  }
  
  function rel_date_str(millis) {
    date = self.file.relative_date(millis);
    return date.toUTCString();
  }

  function create_drawing_area() {
    var selected_channels = get_selected_channels();
    var txt = "<div class='drawingArea' id='drawingArea' style='height:"+100*selected_channels.length+"px;width:100%;'></div>";
    self.element.innerHTML = txt;
  }

  function create_new_plot() {
    var selected_channels = get_selected_channels();
    if (selected_channels.length == 0) {
      self.element.innerHTML = "";
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
    var domain = Array.from(new Array(selected_channels.length+1), (val, idx)=>idx/selected_channels.length)
    for (var c in selected_channels) {
      var c1 = Number(c)+1;
      // data
      var C = selected_channels[c];
      var y = C.get_physical_samples(window_start, window_duration);
      var dt = 1/C.sampling_rate();
      var x = Float32Array.from(new Array(y.length), (val, idx)=>idx*dt)
      var data = {
        x: x, y: y,
        mode: "lines",
        line: { color: "rgb(0.0, 0.0, 0.0)", width: 1.0 },
        yaxis: "y"+c1
      };
      // layout
      layout['xaxis'+c1] = { anchor: "y"+c1 };
      layout['yaxis'+c1] = {
        zeroline: false,
        domain: [domain[c], domain[c1]],
        title: C.label
      };
      traces.push(data);
    }
    Plotly.newPlot("drawingArea", traces, layout, config);
  }

  function set_time(time=0.0) {
    window_start = time;
    drawingArea = document.getElementById("drawingArea");
    var selected_channels = get_selected_channels();
    for (var c in selected_channels) {
      var C = selected_channels[c];
      var y = C.get_physical_samples(window_start, window_duration);
      var x = Float32Array.from(new Array(y.length), (val, idx)=>idx/C.sampling_rate())
      Plotly.restyle(drawingArea, {'x': x, 'y': y}, c);
    }
  }

  self.channels = function () { return self.file.channels; };
  self.del = del;
  self.rel_date_str = rel_date_str;
  self.create_new_plot = create_new_plot;
  self.switch_selection = switch_selection;
  self.set_time = set_time;

  return self;
}
