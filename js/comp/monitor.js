import Alpine from 'https://unpkg.com/alpinejs@3.7.0/dist/module.esm.js'
import * as midi from '../lib/midi.js'

export const monitorComponent = () => ({
  log: [],
  paused: false,
  monitoredDevice: null,
  prevMessage: null,

  init() {
    this.$watch('log', () => {
      // Scroll to bottom
      this.scrollToBottom()
    })
  },

  scrollToBottom() {
    this.$refs['monitor-log'].scrollTop = this.$refs['monitor-log'].scrollHeight
  },

  listenForMonitoring() {
    if (this.monitoredDevice) {
      const device = midi.getInputDevice(this.monitoredDevice)
      device.removeEventListener('midimessage', this.messageListener)
    }

    const inputDevice = Alpine.store('config').inputDevice
    const device = midi.getInputDevice(inputDevice)

    if (device) {
      this.log.push({ timestamp: new Date(), type: '[ Monitoring started ]' })
      this.messageListener = this.messageListener.bind(this)
      device.addEventListener('midimessage', this.messageListener)
      this.monitoredDevice = inputDevice
    }
  },

  messageListener(rawMidiMsg) {
    if (this.paused) return

    let msg = midi.decodeMessage(rawMidiMsg)

    if (!msg) return
    // We ignore these otherwise the log would be flooded
    if (msg.type == 'Clock' || msg.type == 'MTC') return

    msg.cssClass = ''
    switch (msg.type) {
      case 'Note on':
      case 'Note off':
        msg.cssClass = 'msg-note'
        break
      case 'Control change':
        msg.cssClass = 'msg-control'
        break
      case 'Program change':
        msg.cssClass = 'msg-program'
        break
    }
    if (msg.isSystem) {
      msg.cssClass = 'msg-system'
      msg.channel = 'All'
    }
    if (msg.type == 'Control change') {
      msg.details = midi.ccNumberToName(msg.data1)
    }
    if (msg.type == 'Note on' || msg.type == 'Note off') {
      msg.details = midi.noteNumberToName(msg.data1)
    }

    if (msg.channel >= 0) {
      msg.channel++
    }
    this.log.push(msg)

    // Special case for bank select which is set over two CC messages
    if (msg.type == 'Control change' && msg.data1 == 32) {
      const value = midi.bytePairtoNumber(this.prevMessage.data2, msg.data2)
      this.log.push({
        timestamp: new Date(),
        type: '[ Bank select ]',
        cssClass: 'msg-bank',
        channel: '',
        data1: '',
        data2: value,
        details: '14 bit value'
      })
    }

    this.prevMessage = msg
  },

  formatTimestamp(d) {
    let msecs = ('00' + d.getMilliseconds()).slice(-3)
    let secs = ('0' + d.getSeconds()).slice(-2)
    let mins = ('0' + d.getMinutes()).slice(-2)
    let hrs = ('0' + d.getHours()).slice(-2)
    return `${hrs}:${mins}:${secs}:${msecs}`
  }
})
