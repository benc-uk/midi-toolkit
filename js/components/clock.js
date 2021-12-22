import Alpine from 'https://unpkg.com/alpinejs@3.7.0/dist/module.esm.js'
import * as midi from '../lib/midi.js'
import { Timer } from '../lib/timer.js'

export const clockComponent = () => ({
  incomingBpm: -1,
  bpmBuffer: [],
  ticks: 0,
  prevTicks: 0,

  monitoredDevice: null,

  lastTransport: '',
  sendClock: false,
  sendClockBpm: 120,
  sendClockTimer: null,

  init() {
    console.log('### 🕐 Initializing clock')
    this.incomingBpm = -1
    this.lastTransport = '···'
    this.calcBPM = this.calcBPM.bind(this)

    setInterval(() => {
      this.calcBPM()
    }, 1000)

    this.$watch('sendClock', (enabled) => {
      if (enabled) {
        this.sendClockTimer.start()
      } else {
        this.sendClockTimer.stop()
      }
    })

    this.$watch('sendClockBpm', (newBpm) => {
      this.sendClockTimer.timeInterval = 2500 / newBpm
    })

    this.sendClockTimer = new Timer(() => {
      midi.sendSystemMessage(Alpine.store('config').outputDevice, midi.MSG_CLOCK)
    }, 2500 / this.sendClockBpm)
  },

  resetClock() {
    this.ticks = 0
    this.prevTicks = 0
    this.incommingBpm = -1
  },

  calcBPM() {
    if (this.prevTicks > 0) {
      const tempBpm = (this.ticks - this.prevTicks) * 2.5

      // We calc the average of the last 3 BPMs readings for a more stable result
      this.bpmBuffer.push(tempBpm)
      if (this.bpmBuffer.length > 3) {
        this.bpmBuffer.shift()
      }
      let sum = 0
      this.bpmBuffer.forEach((bpm) => {
        sum += bpm
      })
      this.incomingBpm = Math.round(sum / this.bpmBuffer.length)
    }

    this.prevTicks = this.ticks
  },

  listenForClock() {
    if (this.monitoredDevice) {
      const device = midi.getInputDevice(this.monitoredDevice)
      device.removeEventListener('midimessage', this.messageListener)
    }

    const inputDevice = Alpine.store('config').inputDevice
    const device = midi.getInputDevice(inputDevice)

    this.resetClock()

    if (device) {
      this.messageListener = this.messageListener.bind(this)
      device.addEventListener('midimessage', this.messageListener)
      this.monitoredDevice = inputDevice
    }
  },

  messageListener(msg) {
    let logEntry = midi.decodeMessage(msg)
    if (!logEntry) return

    if (logEntry.type == 'Continue' || logEntry.type == 'Stop' || logEntry.type == 'Start') {
      this.lastTransport = logEntry.type
    }

    if (logEntry.type == 'Clock') {
      this.ticks++
    }
  },

  sendStop() {
    midi.sendSystemMessage(Alpine.store('config').outputDevice, midi.MSG_STOP)
  },

  sendStart() {
    midi.sendSystemMessage(Alpine.store('config').outputDevice, midi.MSG_START)
  },

  sendContinue() {
    midi.sendSystemMessage(Alpine.store('config').outputDevice, midi.MSG_CONTINUE)
  }
})
