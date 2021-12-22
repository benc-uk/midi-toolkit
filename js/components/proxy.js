import * as midi from '../lib/midi.js'

export const proxyComponent = () => ({
  proxies: [],
  inputDevices: [],
  outputDevices: [],

  addProxy() {
    this.proxies.push({
      input: '',
      output: '',
      enabled: false,
      listener: () => {}
    })
  },

  removeProxy(index) {
    console.log('removeProxy', index)
    if (midi.getInputDevice(this.proxies[index].input)) {
      midi.getInputDevice(this.proxies[index].input).removeEventListener('midimessage', this.proxies[index].listener)
    }
    this.proxies.splice(index, 1)
  },

  updateDevices() {
    this.inputDevices = []
    this.outputDevices = []

    // Remove all existing proxies, just in case
    // for (let proxyIndex = 0; proxyIndex < this.proxies.length; proxyIndex++) {
    //   this.removeProxy(proxyIndex)
    // }

    for (let device of midi.getInputDevices().values()) {
      this.inputDevices.push(device)
    }
    for (let device of midi.getOutputDevices().values()) {
      this.outputDevices.push(device)
    }
  },

  updateProxyStatus(proxy) {
    if (!proxy.enabled) {
      midi.getInputDevice(proxy.input).removeEventListener('midimessage', proxy.listener)
    } else {
      console.log('### 🚦 Starting proxy: ', proxy.input + ' -> ' + proxy.output)
      proxy.listener = (event) => {
        midi.getOutputDevice(proxy.output).send(event.data)
      }
      midi.getInputDevice(proxy.input).addEventListener('midimessage', proxy.listener)
    }
  }
})
