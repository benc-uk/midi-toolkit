import Alpine from 'https://unpkg.com/alpinejs@3.7.0/dist/module.esm.js'
import { monitorComponent } from './comp/monitor.js'
import { clockComponent } from './comp/clock.js'
import { toolsComponent } from './comp/tools.js'
import { keysComponent } from './comp/keys.js'
import * as midi from './lib/midi.js'

const VERSION = '1.0.0'

Alpine.data('app', () => ({
  page: '',
  inputDevices: [],
  outputDevices: [],
  showAbout: false,
  version: VERSION,

  async init() {
    console.log(`### =====================================\n###  🎹🧰 MIDI Toolkit v${VERSION}\n### =====================================`)

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

    this.$watch('page', (newPage) => {
      this.$dispatch('page-change', newPage)
    })

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
  }
}))

Alpine.data('monitor', monitorComponent)
Alpine.data('clock', clockComponent)
Alpine.data('tools', toolsComponent)
Alpine.data('keys', keysComponent)

Alpine.store('config', {
  inputDevice: '',
  outputDevice: '',
  channel: 0
})

Alpine.start()
