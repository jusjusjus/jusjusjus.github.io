
function assert(condition, msg) {
  if (!condition) console.log(msg);
}

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

var Model = function (self) {
  self = self || {};
  self.net = null;

  function load_config(filename) {
    readTextFile(filename, function(text){
        self.config = JSON.parse(text);
    });
  }

  async function load_model(num_layers=8) {
    if (self.net) { console.log("Warning re-loading net"); }
    var modelfile = '../models/humans/production/num_layers_'+num_layers+'/model/model.json'
    var configfile = '../models/humans/production/num_layers_'+num_layers+'/model/config.json'
    self.net = await tf.loadModel(modelfile);
    self.load_config(configfile);
  }

  function input_sampling_rate() {
    return self.config.input.sampling_rate;
  }

  async function predict(input) {
    if (self.net) { self.load_model(); }
    assert(input.shape.length == 3, "Wrong input shape "+input.shape);
    assert(input.shape[1] == self.config.input.length, "Wrong input shape "+input.shape);
    assert(input.shape[2] == self.config.input.channels.length, "Wrong input shape "+input.shape);
    const output = await self.net(input);
    return output;
  }
  self.load_model = load_model;
  self.load_config = load_config;
  self.predict = predict;
  return self;
}

