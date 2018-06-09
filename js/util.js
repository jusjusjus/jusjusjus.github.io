
function concatenate(resultConstructor, arrays) {
  let length = 0;
  for (var i in arrays) {
    length += arrays[i].length;
  }
  let result = new resultConstructor(length);
  let offset = 0;
  for (var i in arrays) {
    result.set(arrays[i], offset);
    offset += arrays[i].length;
  }
  return result;
}

function one_hot(i, n, dtype) {
  dtype = dtype || Float32Array;
  return dtype.from(new dtype(n), (val, idx) => idx==i ? 1:0)
}

function argmax(arr) {
  var max=arr[0], imax=0;
  for (var i=1; i<arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
      imax = i;
    }
  }
  return imax;
}

function toPercentStr(arr) {
  if (arr === undefined) return "";
  var txt = "";
  for (var v=0; v<arr.length-1; v++) {
    txt += Math.round(100*arr[v])+"%, ";
  }
  txt += Math.round(100*arr[v])+"%";
  return txt;
}
