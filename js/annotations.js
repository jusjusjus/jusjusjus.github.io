
function assert(condition, msg) {
  if (!condition) {
    console.error(msg);
    throw msg;
  }
}

var row2col = function (rows) {
  // for (var r in rows) assert(rows[r].length == col_names.length, "Invalid length:"+rows[i]);
  var cols = {};
  for (var c in rows[0]) cols[c] = [];
  for (var r in rows) {
    var row = rows[r];
    assert(row.length == cols.length, "Invalid length:"+row);
    for (var c in row) {
      cols[c].push(row[c]);
    }
  }
  return cols;
}

var CSV = function (self) {
  self = self || {};
  self.data = null;

  var transform = function (v, c) {
    return trafo[c](v);
  }

  var trafo = {
    '#Onset': (v) => new Date(v+'Z'),
    Duration: (v) => parseFloat(v),
    Annotation: (v) => v
  }

  var colname_map = {
    '#Onset': 'start',
    'Duration': 'dt',
    'Annotation': 'label'
  }

  var oncomplete = function (callback) {
    return function (parsed) {
      var converted = row2col(parsed.data);
      self.data = {};
      for (label in converted) {
        self.data[colname_map[label]] = converted[label];
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

  self.save = function () {
    str = Papa.unparse(self.data);
    console.log(str);
  }
  return self;
}


var Annotations = function (dt, labels, self) {
  dt = dt || null;
  labels = labels || ['Wake', 'R', 'N1', 'N2', 'N3'];
  self = self || {};

  var hash2label = labels
  var label2hash = {}
  for (var l in labels) {
    label2hash[labels[l]] = l;
  }

  self.dt = dt;
  self.labels = [];
  self.start = [];
  self.t0 = [];
  self.probabilities = [];
  self.max_probs = [];

  self.stream_probs = function (probs) {
    assert(self.dt !== null, "time step `Annotations.dt` not set.");
    var t00 = self.t0.length > 0 ? self.t0[self.t0.length-1]+self.dt : 0.0;
    self.t0.push(t00);
    self.labels.push(hash2label[argmax(probs[0])]);
    self.probabilities.push(probs[0]);
    for(var i=1; i<probs.length; i++) {
      var imax = argmax(probs[i]);
      self.t0.push(self.t0[self.t0.length-1]+self.dt);
      self.labels.push(hash2label[imax]);
      self.probabilities.push(probs[i]);
      self.max_probs.push(probs[i][imax]);
    }
  }
  
  self.from_probs = function (dt, probs) {
    self.dt = dt;
    self.probabilities = probs;
    self.labels = [];
    self.max_probs = [];
    self.t0 = Float32Array.from(new Float32Array(probs.length), (val, idx)=>dt*idx);
    for(var i=0; i<probs.length; i++) {
      var imax = argmax(probs[i]);
      self.max_probs.push(probs[i][imax]);
      self.labels.push(hash2label[imax]);
    }
    return self;
  }
  
  self.load = function (file) {
    return new Promise( function (resolve, reject) {
      var filename = typeof file === "object" ? file.name : file;
      if (filename.endsWith('.csv')) {
        CSV().load(file, function (d) {
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
            self.probabilities[l] = one_hot(imax, labels.length);
            self.max_probs.push(1.0);
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
  return self;
}
