
var MiceModel = function (self) {
  self = self || {};
  self = Model(self);
  var parent = {
    predict: self.predict
  }

  // self.load_model = function (channel_names) {
  //   assert(self.net === null, "Warning re-loading net");
  //   assert(channel_names in ['EEG2', 'EEG2-EMG', 'EEG1-EEG2-EMG'], "No net available for channels "+channel_names);
  //   // eventually switch this to a cdn
  //   // var modelfile = 'https://cdn.rawgit.com/jusjusjus/jusjusjus.github.io/5a71936b/models/mice/'+channel_names+'/model.json';
  //   var modelfile = '../mice/humans/'+channel_names+'/model.json'
  //   var configfile = '../mice/humans/'+channel_names+'/config.json'
  //   self.config = await load_config(configfile);
  //   self.net = await tf.loadModel(modelfile);
  // }

  self.predict = function (input) {
    const mixed_logp = parent.predict(input);
    const log_stage = mixed_logp.slice([0, 0], [-1, 3]);
    const log_artif = mixed_logp.slice([0, 3], [-1, 1]);
    return tf.concat([
      tf.softmax(log_stage),
      tf.exp(log_artif)
    ], axis=1);
  }

  return self;
}

