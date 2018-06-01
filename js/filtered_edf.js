
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

var FilteredEDF = function (self={}) {
  self = edfjs.EDF(self);
  var parent = {
    get_physical_samples: self.get_physical_samples,
    channel_by_label: self.channel_by_label
  };

  self.get_physical_samples = function(t0, dt, channels) {
    var Y = parent.get_physical_samples(t0, dt, channels);
    for (var label in Y) {
      var sr_old = self.channel_by_label[label].sampling_rate;
      var sr_new = self.sampling_rate[label];
      if (sr_old !== sr_new) {
        Y[label] = linear_downsample(Y[label], sr_old, sr_new);
      }
    }
    return Y;
  }

  return self;
}
window.FilteredEDF = FilteredEDF;
