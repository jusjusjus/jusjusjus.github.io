

// var get_filter = function (fs, fc) {
//   var iirCalculator = new Fili.CalcCascades();
//   var availableFilters = iirCalculator.available();
//   var iirFilterCoeffs = iirCalculator.lowpass({
//     order: 4, characteristic: 'butterworth',
//     Fs: fs, Fc: fc, gain: 0, preGain: false
//   });
//   return new Fili.IirFilter(iirFilterCoeffs);
// }

var linear_downsample = function (X, sr_old, sr_new) {
  var t = Float32Array.from(
    new Array(Math.round((X.length-1)*sr_new/sr_old)),
    (val, idx)=>idx*sr_old/sr_new
  );
  var I = Int32Array.from(t);
  var x = new Float32Array(t.length);
  x[0] = X[0];
  for (var i=1; i<t.length; i++) {
    var n = I[i], n1 = I[i]+1;
    x[i] = X[n1]*(t[i]-n)+X[n]*(n1-t[i]);
  }
  return x
}

function assert(condition, msg) {
  if (!condition) console.error(msg);
}

var FilteredEDF = function (self={}) {
  self = edfjs.EDF(self);
  var parent = {
    get_physical_samples: self.get_physical_samples,
    channel_by_label: self.channel_by_label
  };

  self.get_physical_samples = function(t0, dt, channels) {
    var Y = parent.get_physical_samples(t0, dt, channels);
    for (var label in Y) {
      if (label in self.sampling_rate) {
        var sr_old = self.channel_by_label[label].sampling_rate;
        var sr_new = self.sampling_rate[label];
        if (sr_old !== sr_new) {
          Y[label] = linear_downsample(Y[label], sr_old, sr_new);
        }
      }
    }
    return Y;
  }

  self.build_dataset = function(model) {
    var epoch_duration = model.config.input.duration;
    var left = model.config.input.left;
    var example_duration = left + epoch_duration + model.config.input.right;
    self.num_examples = Math.floor(self.duration/epoch_duration);
    self.model_input_channels = model.config.input.channels;
    self.samples_per_segment = model.config.input.length;
    for (var l in self.model_input_channels) {
      var label = self.model_input_channels[l]
      assert(label in self.channel_by_label, "Input channel not assigned "+label);
      self.sampling_rate[label] = model.config.input.sampling_rate;
    }
    
    self.get = function(n) {
      var t0 = epoch_duration*n-left;
      t0 = t0 < 0.0 ? 0.0: t0;
      if (t0+example_duration >= self.duration) {
        t0 = self.duration - example_duration-0.1;
      }
      return self.get_physical_samples(t0, example_duration, self.model_input_channels);
    }
    return self;
  }

  self.dataloader = function(model) {
    var obj = {};
    obj.dset = self.build_dataset(model);
    obj.length = obj.dset.num_examples;
    obj.channels = obj.dset.model_input_channels.length;
    obj.samples_per_segment = obj.dset.samples_per_segment
    obj.get = function(n) {
      assert(n < obj.length && n >= 0, "Requested sample out of bounds "+n);
      var X = concatenate(Float32Array, obj.dset.get(n));
      return tf.transpose(
        tf.tensor3d(X, [1, obj.channels, obj.samples_per_segment]),
        [0, 2, 1]);
    }
    return obj;
  }

  return self;
}
window.FilteredEDF = FilteredEDF;
