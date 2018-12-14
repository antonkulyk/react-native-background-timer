import {
  DeviceEventEmitter,
  NativeAppEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

const { RNBackgroundTimer } = NativeModules;
const Emitter = new NativeEventEmitter(RNBackgroundTimer);

class BackgroundTimer {
  constructor() {
    this.uniqueId = 0;
    this.callbacks = {};

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.runBackgroundTimer = this.runBackgroundTimer.bind(this);
    this.backgroundClockMethod = this.backgroundClockMethod.bind(this);
    this.stopBackgroundTimer = this.stopBackgroundTimer.bind(this);
    this.setTimeout = this.setTimeout.bind(this);
    this.clearTimeout = this.clearTimeout.bind(this);
    this.setInterval = this.setInterval.bind(this);
    this.clearInterval = this.clearInterval.bind(this);

    Emitter.addListener('backgroundTimer.timeout', (id) => {
      if (this.callbacks[id]) {
        const callbackById = this.callbacks[id];
        const { callback } = callbackById;
        if (!this.callbacks[id].interval) {
          delete this.callbacks[id];
        } else {
          RNBackgroundTimer.setTimeout(id, this.callbacks[id].timeout);
        }
        callback();
      }
    });
  }

  // Original API
  start(delay = 0) {
    return RNBackgroundTimer.start(delay);
  }

  stop() {
    return RNBackgroundTimer.stop();
  }

  runBackgroundTimer(callback, delay) {
    const EventEmitter = Platform.select({
      ios: () => NativeAppEventEmitter,
      android: () => DeviceEventEmitter,
    })();
    this.start(0);
    this.backgroundListener = EventEmitter.addListener('backgroundTimer', () => {
      this.backgroundListener.remove();
      this.backgroundClockMethod(callback, delay);
    });
  }

  backgroundClockMethod(callback, delay) {
    this.backgroundTimer = this.setTimeout(() => {
      callback();
      this.backgroundClockMethod(callback, delay);
    },
    delay);
  }

  stopBackgroundTimer() {
    this.stop();
    this.clearTimeout(this.backgroundTimer);
  }

  // New API, allowing for multiple timers
  setTimeout(callback, timeout) {
    this.uniqueId += 1;
    const timeoutId = this.uniqueId;
    this.callbacks[timeoutId] = {
      callback,
      interval: false,
      timeout,
    };
    RNBackgroundTimer.setTimeout(timeoutId, timeout);
    return timeoutId;
  }

  clearTimeout(timeoutId) {
    if (this.callbacks[timeoutId]) {
      delete this.callbacks[timeoutId];
      // RNBackgroundTimer.clearTimeout(timeoutId);
    }
  }

  setInterval(callback, timeout) {
    this.uniqueId += 1;
    const intervalId = this.uniqueId;
    this.callbacks[intervalId] = {
      callback,
      interval: true,
      timeout,
    };
    RNBackgroundTimer.setTimeout(intervalId, timeout);
    return intervalId;
  }

  clearInterval(intervalId) {
    if (this.callbacks[intervalId]) {
      delete this.callbacks[intervalId];
      // RNBackgroundTimer.clearTimeout(intervalId);
    }
  }
}

export default new BackgroundTimer();
