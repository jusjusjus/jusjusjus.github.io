
'use strict'

var Hypnogram = function (element_id, annotations, self) {
  self = self || {};


  self.element_id = element_id;
  self.element = function () { return document.getElementById(self.element_id); };
  self.annotations = annotations;
  var window_start = 0.0;
  var sec2hour = 1/60/60;

  var config = {
    displayModeBar: false,
    staticPlot: true
  };

  var hash2label = [];
  for (var i=1; i<=annotations.classes.length; i++) {
    hash2label[i-1] = annotations.classes[annotations.classes.length-i];
  }
  var label2hash = {}
  for (let l in hash2label) {
    label2hash[hash2label[l]] = l;
  }

  var del = function () {
    self.element().innerHTML = "";
  }

  function create_drawing_area() {
    var txt = "";
    txt += "<div id='hypnogramDiv'>";
    txt += "<table id='hypnogramInfo'></table>";
    txt += "<div class='hypnogramDrawingArea' id='hypnogramDrawingArea' style='height:150px;width:100%;'></div>";
    txt += "<p style='text-align:right'><button class='filebutton' onclick='annotations.save()'>Download as csv</button></p>";
    txt += "</div>";
    self.element().innerHTML = txt;
  }

  function rgb(r, g, b) {
    return "rgb("+Math.round(255*r)+","+Math.round(255*g)+","+Math.round(255*b)+")";
  }

  function color_map(p) {
    p = clamp(2.0*(p-0.5), 0.0, 1.0);
    return rgb(0.94*(1.0-p), 0.9*p, 0.34*p);
  }

  function labels2curve(annotations) {
    var labels = annotations.labels,
        label = labels[0],
        next_label = null,
        probs = annotations.max_probs,
        x = [0],
        y = [label],
        c = [color_map(probs[0])];
    for (var l=1; l<labels.length; l++) {
      next_label = labels[l];
      if (next_label != label) {
        x.push(l*self.annotations.dt*sec2hour);
        y.push(label2hash[label]);
        c.push(color_map(probs[l]));
        label = next_label;
      }
      x.push(l*self.annotations.dt*sec2hour);
      y.push(label2hash[next_label]);
      c.push(color_map(probs[l]));
    }
    return {x:[x], y:[y], 'marker.color':[c]};
  }

  async function create_new_plot() {
    create_drawing_area();
    var traces = [];
    var tickvals = [];
    for(var tt in hash2label) tickvals[tt] = tt;
    var layout = {
      plot_bgcolor: rgb(0.94,0.99,0.75),
      paper_bgcolor: rgb(0.94,0.99,0.75),
      showlegend: false,
      margin: {t: 0, b: 30, l: 40, r: 20},
      yaxis: {
        tickvals: tickvals,
        ticktext: hash2label,
        zeroline: false
      },
      xaxis: { title: "relative time (hours)" }
    };
    // data
    var data = [];
    var d = labels2curve(self.annotations);
    layout.xaxis.range = [0, d.x[0][d.x[0].length-1]+0.1];
    var points = {
      type: 'scatter',
      x: d.x[0], y: d.y[0],
      mode: "markers",
      marker: {
        color: d['marker.color'][0],
        symbol: 'square',
        size: 4
      },
      yaxis: "y"
    };
    var trace = {
      type: 'scatter',
      x: d.x[0], y: d.y[0],
      mode: "lines",
      line: {
        color: 'grey',
        width: 4.0
      },
      yaxis: "y"
    };
    var vert = {
      x: [window_start, window_start], y: [-0.5, hash2label.length-0.5],
      mode: "lines", 
      line: { color: rgb(0.25,0.25,0.25), width: 2.0 },
    };
    data = [trace, points, vert];
    // layout
    await Plotly.newPlot("hypnogramDrawingArea", data, layout, config);
  }

  function set_time(t0) {
    document.getElementById("hypnogramInfo").innerHTML = prob_to_html(t0);
    t0 = t0*sec2hour || window_start;
    window_start = t0;
    var drawingArea = document.getElementById("hypnogramDrawingArea");
    Plotly.restyle(drawingArea, {'x': [[window_start, window_start]]}, 2);
  }

  function prob_to_html(t0) {
    var idx = Math.floor(t0/self.annotations.dt);
    var probs = self.annotations.probabilities[idx];
    var Pprobs = toPercent(probs);
    var label = self.annotations.labels[idx];
    var txt = "<tr>";
    for (var l in self.annotations.classes) {
      var cl = self.annotations.classes[l];
      if (label == cl) {
        txt += "<th>"+cl+"</th>";
      } else {
        txt += "<td>"+cl+"</td>";
      }
    }
    txt += "</tr><tr>";
    for (var p in probs) {
      txt += "<td style='color:"+color_map(probs[p])+"'>"+Pprobs[p]+"</td>";
    }
    return txt+"</tr>";
  }

  function slider_str(t0) {
    var idx = Math.floor(t0/self.annotations.dt);
    return "   Stage: "+self.annotations.labels[idx];
  }

  function redraw() {
    var drawingArea = document.getElementById("hypnogramDrawingArea");
    var curve = labels2curve(self.annotations);
    var layout = {'xaxis.range[1]': curve.x[0][curve.x[0].length-1]+0.1};
    Plotly.restyle(drawingArea, curve, 0);
    Plotly.restyle(drawingArea, curve, 1);
    Plotly.relayout(drawingArea, layout);
  }

  document.addEventListener("annotations_changed", redraw);

  self.del = del;
  self.redraw = redraw;
  self.set_time = set_time;
  self.hash2label = hash2label;
  self.slider_str = slider_str;
  self.labels2curve = labels2curve;
  self.create_new_plot = create_new_plot;
  return self;
}
