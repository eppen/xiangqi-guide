(function (global) {
  'use strict';

  var ctx = null;
  var enabled = true;
  var STORAGE_KEY = 'xiangqi-play-sound';

  function loadEnabled() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === '0') enabled = false;
      if (stored === '1') enabled = true;
    } catch (err) {
      enabled = true;
    }
  }

  function saveEnabled() {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    } catch (err) {
      /* ignore */
    }
  }

  function ensureContext() {
    if (!global.AudioContext && !global.webkitAudioContext) return null;
    if (!ctx) {
      try {
        ctx = new (global.AudioContext || global.webkitAudioContext)();
      } catch (err) {
        return null;
      }
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function playIfEnabled(fn) {
    if (!enabled) return;
    var ac = ensureContext();
    if (!ac) return;
    fn(ac, ac.currentTime);
  }

  function woodTap(ac, t, volume) {
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.07);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  function noiseBurst(ac, t, volume, duration) {
    var bufferSize = Math.floor(ac.sampleRate * duration);
    var buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    var source = ac.createBufferSource();
    var filter = ac.createBiquadFilter();
    var gain = ac.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t);
    filter.Q.setValueAtTime(0.6, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    source.start(t);
    source.stop(t + duration + 0.01);
  }

  function tone(ac, t, freq, duration, volume, type) {
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  loadEnabled();

  global.XQSound = {
    isEnabled: function () {
      return enabled;
    },
    setEnabled: function (value) {
      enabled = !!value;
      saveEnabled();
    },
    ensureContext: ensureContext,
    playSelect: function () {
      playIfEnabled(function (ac, t) {
        tone(ac, t, 520, 0.04, 0.06, 'triangle');
      });
    },
    playMove: function () {
      playIfEnabled(function (ac, t) {
        woodTap(ac, t, 0.14);
      });
    },
    playCapture: function () {
      playIfEnabled(function (ac, t) {
        woodTap(ac, t, 0.1);
        noiseBurst(ac, t, 0.12, 0.08);
        tone(ac, t + 0.02, 140, 0.06, 0.08, 'square');
      });
    },
    playCheck: function () {
      playIfEnabled(function (ac, t) {
        tone(ac, t, 660, 0.08, 0.1, 'sine');
        tone(ac, t + 0.1, 880, 0.12, 0.1, 'sine');
      });
    },
    playWin: function () {
      playIfEnabled(function (ac, t) {
        tone(ac, t, 523, 0.12, 0.1, 'sine');
        tone(ac, t + 0.12, 659, 0.12, 0.1, 'sine');
        tone(ac, t + 0.24, 784, 0.2, 0.1, 'sine');
      });
    },
    playLose: function () {
      playIfEnabled(function (ac, t) {
        tone(ac, t, 392, 0.15, 0.09, 'sine');
        tone(ac, t + 0.15, 330, 0.15, 0.09, 'sine');
        tone(ac, t + 0.3, 262, 0.25, 0.08, 'sine');
      });
    },
    playDraw: function () {
      playIfEnabled(function (ac, t) {
        tone(ac, t, 440, 0.15, 0.08, 'sine');
        tone(ac, t + 0.15, 440, 0.15, 0.08, 'sine');
      });
    }
  };
})(typeof window !== 'undefined' ? window : self);
