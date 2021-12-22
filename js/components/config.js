import Alpine from 'https://unpkg.com/alpinejs@3.7.0/dist/module.esm.js'
import * as midi from '../lib/midi.js'

export const configComponent = () => ({
  inputDevices: [],
  outputDevices: [],
  template: 'Loading...',

  async init() {
    // Unlike other components, we need to populate the HTML *before* we access MIDI
    this.template = await (await fetch('js/components/config.html')).text()

    this.setupDevices = this.setupDevices.bind(this)
    await midi.getAccess(this.setupDevices)
    this.setupDevices()

    // Connect to devices, if present
    const inputDeviceId = Alpine.store('config').inputDevice
    const outputDeviceId = Alpine.store('config').outputDevice
    let midiDevice = midi.getInputDevice(inputDeviceId)
    if (midiDevice) {
      console.log(`### 📥 Using input device ${midiDevice.name}`)
      this.$dispatch('midi-ready')
    } else if (inputDeviceId) {
      console.log(`### ⛔ Device ${inputDeviceId} is no longer present`)
      Alpine.store('config').inputDevice = ''
      Alpine.store('config').save()
    }

    midiDevice = midi.getOutputDevice(outputDeviceId)
    if (midiDevice) {
      console.log(`### 📤 Using output device ${midiDevice.name}`)
      this.$dispatch('midi-ready')
    } else if (outputDeviceId) {
      console.log(`### ⛔ Device ${outputDeviceId} is no longer present`)
      Alpine.store('config').outputDevice = ''
      Alpine.store('config').save()
    }

    if (!window.location.hash) {
      window.location.hash = '#monitor'
      this.page = '#monitor'
    }
    this.page = window.location.hash

    if (!Alpine.store('config').inputDevice && !Alpine.store('config').outputDevice) {
      window.location.hash = '#config'
      this.page = '#config'
    }
  },

  setupDevices() {
    // Skip when the number of devices has not changed
    if (this.inputDevices.length == midi.getInputDevices().size && this.outputDevices.length == midi.getOutputDevices().size) {
      return
    }

    console.log('### 🩺 Detecting MIDI devices...')

    this.inputDevices = []
    this.outputDevices = []
    for (let input of midi.getInputDevices().values()) {
      console.log(` ⬅️ ${input.id}\t\t${input.name} ${input.manufacturer ? `\t(${input.manufacturer})` : ''}`)

      this.inputDevices.push({
        name: input.name,
        manufacturer: input.manufacturer,
        id: input.id
      })
    }

    for (let output of midi.getOutputDevices().values()) {
      console.log(` ➡️ ${output.id}\t${output.name} ${output.manufacturer ? `\t(${output.manufacturer})` : ''}`)

      this.outputDevices.push({
        name: output.name,
        manufacturer: output.manufacturer,
        id: output.id
      })
    }

    if (localStorage.getItem('config')) {
      Alpine.store('config', JSON.parse(localStorage.getItem('config')))
    }
    Alpine.store('config').save = () => {
      localStorage.setItem('config', JSON.stringify(Alpine.store('config')))
    }

    this.$dispatch('midi-changed')
  }
})
