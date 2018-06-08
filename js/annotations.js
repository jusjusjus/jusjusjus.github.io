
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


var Annotations = function (self) {
  self = self || {};

  self.dt = null;
  self.labels = null;
  self.start = null;
  self.t0 = null;
  
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
