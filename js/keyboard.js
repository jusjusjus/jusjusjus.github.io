
var Keyboard = function() {
  self = {};
  keymap = {};
  self.add = function (key, callback) {
    keymap[key] = callback;
  }
  self.remove = function (key) {
    delete keymap[key];
  }
  self.remove_all = function () {
    keymap = {};
  }
  // Firefox: "keypress" works for both.
  document.addEventListener("keydown", (k)=>{
    try {
      keymap[k.key]();
    } catch {
      console.warn("Event", k, "not mapped."); 
    };
  });
  return self;
}
window.Keyboard = Keyboard;
