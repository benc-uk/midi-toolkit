import Alpine from 'https://unpkg.com/alpinejs@3.13.x/dist/module.esm.js'
import intersect from 'https://unpkg.com/@alpinejs/intersect@3.13.x/dist/module.esm.js'

import { configComponent } from './components/config.js'
import { monitorComponent } from './components/monitor.js'
import { clockComponent } from './components/clock.js'
import { toolsComponent } from './components/tools.js'
import { keysComponent } from './components/keys.js'
import { proxyComponent } from './components/proxy.js'

const VERSION = '1.2.0'

Alpine.data('app', () => ({
  page: '',
  showAbout: false,
  version: VERSION,

  async init() {
    console.log(`### =====================================
###  🎹🔨 MIDI Toolkit v${VERSION}
### =====================================`)

    // All MIDI initialization is done in components/config.js
  }
}))

Alpine.data('config', configComponent)
Alpine.data('monitor', monitorComponent)
Alpine.data('clock', clockComponent)
Alpine.data('tools', toolsComponent)
Alpine.data('keys', keysComponent)
Alpine.data('proxy', proxyComponent)

Alpine.store('config', {
  inputDevice: '',
  outputDevice: '',
  channel: 0
})

Alpine.plugin(intersect)
Alpine.start()
