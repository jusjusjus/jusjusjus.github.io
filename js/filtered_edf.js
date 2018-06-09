

var _filters = {}

var get_filter = function (fs, fc) {
  var hash = fs+''+fc;
  if (_filters[hash] === undefined) {
    var iirCalculator = new Fili.CalcCascades();
    var availableFilters = iirCalculator.available();
    var iirFilterCoeffs = iirCalculator.lowpass({
      order: 4, characteristic: 'butterworth',
      Fs: fs, Fc: fc, gain: 0, preGain: false
    });
    _filters[hash] = new Fili.IirFilter(iirFilterCoeffs);
  }
  return _filters[hash];
}

var linear_downsample = function (X, sr_old, sr_new) {
  var F = get_filter(sr_old, Math.floor(0.4*sr_new));
  X = F.multiStep(X);
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

  self.get_physical_samples = async function(t0, dt, channels) {
    var Y = await parent.get_physical_samples(t0, dt, channels);
    return new Promise( function (resolve, reject) {
      for (var label in Y) {
        if (label in self.sampling_rate) {
          var sr_old = self.channel_by_label[label].sampling_rate;
          var sr_new = self.sampling_rate[label];
          if (sr_old !== sr_new) {
            Y[label] = linear_downsample(Y[label], sr_old, sr_new);
          }
        }
      }
      resolve(Y);
    });
  }

  self.set_model = function(model) {
    var E = model.config.input.duration;
    var L = model.config.input.left;
    var example_duration = L + E + model.config.input.right;
    self.num_examples = Math.floor(self.duration/E);
    self.model_input_channels = model.config.input.channels;
    self.samples_per_segment = model.config.input.length;
    for (var l in self.model_input_channels) {
      var label = self.model_input_channels[l]
      assert(label in self.channel_by_label, "Input channel not assigned "+label);
      self.sampling_rate[label] = model.config.input.sampling_rate;
    }
    self.get = function(n) {
      var t0 = E*n-L;
      t0 = t0 < 0.0 ? 0.0: t0;
      if (t0+example_duration >= self.duration) {
        t0 = self.duration - example_duration-0.1;
      }
      return self.get_physical_samples(t0, example_duration, self.model_input_channels);
    }
    return self;
  }

  self.dataloader = function() {
    var loader = {};
    var num_channels = self.model_input_channels.length;
    var samples_per_segment = self.samples_per_segment
    loader.length = self.num_examples;
    loader.get = async function(n) {
      assert((0 <= n) && (n < loader.length), "Requested sample out of bounds "+n);
      var X = concatenate(Float32Array, await self.get(n));
      return tf.transpose(
        tf.tensor3d(X, [1, num_channels, samples_per_segment]),
        [0, 2, 1]);
    }
    return loader;
  }

  return self;
}
window.FilteredEDF = FilteredEDF;
window.get_filter = get_filter;
