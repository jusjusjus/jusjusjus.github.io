
function assert(condition, msg) {
  if (!condition) {
    console.error(msg);
    throw msg;
  }
}

function readPlainText(file) {
  return new Promise(function (resolve, reject) {
    var response = null;
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            resolve(rawFile.responseText);
        }
    }
    rawFile.send(null);
  });
}

var Model = function (self) {
  self = self || {};
  self.config = null;
  self.net = null;

  function load_config(filename) {
    return new Promise(function (resolve, reject) {
      readPlainText(filename).then( function (txt) {
        var txt = JSON.parse(txt);
        resolve(txt);
      });
    });
  }

  async function load_model(num_layers=8) {
    assert(self.net === null, "Warning re-loading net");
    var modelfile = '../models/humans/aasm/model.json'
    var configfile = '../models/humans/aasm/config.json'
    self.config = await load_config(configfile);
    self.net = await tf.loadModel(modelfile);
  }

  function input_sampling_rate() {
    return self.config.input.sampling_rate;
  }

  function predict(input) {
    if (self.net == null) { self.load_model(); }
    assert(input.shape.length == 3, "Wrong input shape "+input.shape);
    assert(input.shape[1] == self.config.input.length, "Wrong input shape "+input.shape);
    assert(input.shape[2] == self.config.input.channels.length, "Wrong input shape "+input.shape);
    return self.net.predictOnBatch(input);
  }

  self.load_model = load_model;
  self.predict = predict;
  return self;
}

