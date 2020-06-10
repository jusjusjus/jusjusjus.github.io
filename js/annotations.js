
var row2col = function (rows) {
  var cols = {};
  for (var c in rows[0]) cols[c] = [];
  for (var r in rows) {
    var row = rows[r];
    assert(row.length == cols.length, "row2col: Invalid length ["+row+"]");
    for (var c in row) {
      cols[c].push(row[c]);
    }
  }
  return cols;
}

var col2row = function (cols) {
  var rows = [],
      num_cols = cols.length,
      num_rows = cols[0].length,
      r, c;
  for (r=0; r < num_rows; r++) {
    rows[r] = []
    for(c=0; c < num_cols; c++) {
      rows[r][c] = cols[c][r];
    }
  }
  return rows;
}

// From:
// https://stackoverflow.com/questions/21012580/is-it-possible-to-write-data-to-file-using-only-javascript
function download(strData, strFileName, strMimeType) {
  var D = document,
      A = arguments,
      a = D.createElement("a"),
      d = A[0],
      n = A[1],
      t = A[2] || "text/plain";

  a.href = "data:" + strMimeType + "charset=utf-8," + escape(strData);

  if (window.MSBlobBuilder) {
    var bb = new MSBlobBuilder();
    bb.append(strData);
    return navigator.msSaveBlob(bb, strFileName);
  }

  if ('download' in a) {
    a.setAttribute("download", n);
    a.innerHTML = "downloading...";
    D.body.appendChild(a);
    setTimeout(function() {
      var e = D.createEvent("MouseEvent");
      e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      a.dispatchEvent(e);
      D.body.removeChild(a);
    }, 66);
    return true;
  };
  var f = D.createElement("iframe");
  D.body.appendChild(f);
  f.src = "data:" + (A[2] ? A[2] : "application/octet-stream") + (window.btoa ? ";base64" : "") + "," + (window.btoa ? window.btoa : escape)(strData);
  setTimeout(()=>{D.body.removeChild(f)}, 333);
  return true;
}


var CSV = function (self, data) {
  self = self || {};
  self.data = data || null;

  var transform = function (v, c) {
    c = c.trim().toLowerCase();
    try {
      return trafo[c](v);
    } catch {
      console.warn("string trafo of", c,"for value", v,"is not defined.");
      return v;
    }
  }

  var trafo = {
    // Start data-time of annotation
    '# start': (v) => new Date(v+'Z'),
    '#onset': (v) => new Date(v+'Z'),
    't0': (v) => new Date(v+'Z'),
    // Duration of annotation
    duration: (v) => parseFloat(v),
    'dt': (v) => parseFloat(v),
    // Label of annotation
    annotation: (v) => v,
    label: (v) => v
  }

  var colname_map = {
    '# start': 'start',
    '#onset': 'start',
    't0': 'start',
    'duration': 'dt',
    'dt': 'dt',
    'annotation': 'label',
    'label': 'label'
  }

  var oncomplete = function (callback) {
    return function (parsed) {
      var converted = row2col(parsed.data);
      self.data = {};
      for (let label in converted) {
        self.data[colname_map[label.trim().toLowerCase()]] = converted[label];
      }
      callback(self.data);
    }
  }

  self.load = function (file, callback) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: oncomplete(callback),
      transform: transform
    });
    return self;
  }

  self.save = function (filename) {
    const text = Papa.unparse(self.data);
    download(text, filename);
  }
  return self;
}


var Annotations = function (dt, classes, self) {
  dt = dt || null;
  self = self || {};
  self.classes = classes || ['Wake', 'R', 'N1', 'N2', 'N3'];

  var hash2label = self.classes
  var label2hash = {}
  for (var l in self.classes) {
    label2hash[self.classes[l]] = l;
  }

  self.dt = dt;
  self.t0 = [];
  self.start = [];
  self.labels = [];
  self.max_probs = [];
  self.probabilities = [];

  self.stream_probs = function (probs) {
    assert(self.dt !== null, "time step `Annotations.dt` not set.");
    var t00 = self.t0.length > 0 ? self.t0[self.t0.length-1]+self.dt : 0.0,
        i = 0,
        imax = argmax(probs[i]);
    self.t0.push(t00);
    self.labels.push(hash2label[imax]);
    self.probabilities.push(probs[i]);
    self.max_probs.push(probs[i][imax]);
    for(i=1; i < probs.length; i++) {
      imax = argmax(probs[i]);
      self.t0.push(self.t0[self.t0.length-1]+self.dt);
      self.labels.push(hash2label[imax]);
      self.probabilities.push(probs[i]);
      self.max_probs.push(probs[i][imax]);
    }
    document.dispatchEvent(new Event("annotations_changed"));
  }
  
  self.from_probs = function (dt, probs) {
    self.dt = dt;
    self.probabilities = probs;
    self.labels = [];
    self.max_probs = [];
    self.t0 = Float32Array.from(new Float32Array(probs.length), (val, idx)=>dt*idx);
    for(var i=0; i < probs.length; i++) {
      var imax = argmax(probs[i]);
      self.max_probs.push(probs[i][imax]);
      self.labels.push(hash2label[imax]);
    }
    return self;
  }

  self.set_stage = function (n, stage) {
    var idx = label2hash[stage]
    self.labels[n] = stage;
    self.max_probs[n] = 1;
    self.probabilities[n] = one_hot(idx, self.classes.length);
    document.dispatchEvent(new Event("annotations_changed"));
  }
  
  self.load = function (file) {
    return new Promise( function (resolve, reject) {
      var filename = typeof file === "object" ? file.name : file;
      if (filename.endsWith('.csv')) {
        CSV().load(file, function (d) {
          console.log(d);
          self.dt = d.dt[0];
          for(var i in d.dt)
            assert(d.dt[i] === self.dt, "Epoch "+i+"is too short.");
          self.start = d.start;
          self.labels = d.label;
          self.probabilities = []
          self.max_probs = []
          for (var l in self.labels) {
            var label = self.labels[l]
            var imax = label2hash[label];
            self.t0.push(l*30);
            self.max_probs.push(1);
            self.probabilities[l] = one_hot(imax, self.classes.length);
          }
          resolve(self);
        });
      } else if (filename.endsWith('.json')) {
        JSON.parse(file, function (d) {
          for (key in d)
            self[key] = d[key];
          resolve(self);
        });
      }
    })
  }

  self.save = function(filename) {
    filename = filename || 'annotation.csv';
    var fields = ['t0', 'label'];
    var dataT = [self.t0, self.labels];
    if (self.max_probs.length == self.labels.length) {
      fields.push('P');
      dataT.push(self.max_probs);
    }
    CSV(null, {
      'fields': fields,
      'data': col2row(dataT)
    }).save(filename);
  }

  return self;
}
