import Alpine from 'https://unpkg.com/alpinejs@3.7.0/dist/module.esm.js'
import * as midi from './midi.js'

let deviceSel = null
let monitorBtn = null
let clearBtn = null
let clockDisplay = null
let log = null
let midiDevice = null
let monitoring = false
let deviceCount = 0

// =============================================================================
// The main entry point is here, after loading the document / page
// =============================================================================
window.addEventListener('load', async () => {
  log = document.getElementById('log')
  deviceSel = document.getElementById('deviceSel')
  monitorBtn = document.getElementById('monitorBtn')
  clearBtn = document.getElementById('clearBtn')
  clockDisplay = document.getElementById('clock')
  deviceSel.addEventListener('change', deviceSelected)
  monitorBtn.addEventListener('click', startStopClicked)
  //clearBtn.addEventListener('click', clearMonitor)
  clockDisplay.innerHTML = `⌚ Clock: None detected`

  await midi.getAccess(setupDevices)

  if (!midi.access) {
    document.body.innerHTML = `<div style="text-align: center; font-size: 150%">
    <h1 style="color:#ee2222">Failed to get MIDI access</h1><br>This is likely because your browser doesn't support MIDI or permissions were not granted<br><br>Try again using Chrome or Edge</div>`
    return
  }

  Alpine.data('midimonitor', () => ({
    logMessages: '',

    clearLog() {
      this.logMessages = 'ss'
    }
  }))
  Alpine.start()

  midi.access.onstatechange = setupDevices
  setupDevices()
})

function setupDevices(evt) {
  if (midi.access.inputs.size == deviceCount) return

  deviceCount = 0
  monitorBtn.disabled = true
  stopMonitoring()

  console.log('### New MIDI devices detected...')

  deviceSel.innerHTML = `<option value="" disabled selected>-- Select MIDI device --</option>`
  for (let input of midi.access.inputs.values()) {
    console.log(`### - ${input.name} ${input.manufacturer}`)
    let option = document.createElement('option')
    option.innerHTML = input.name
    option.value = input.id
    deviceSel.appendChild(option)
    deviceCount++
  }
}

function startStopClicked() {
  monitoring = !monitoring

  if (monitoring) {
    startMonitoring()
  } else {
    stopMonitoring()
  }
}

function stopMonitoring() {
  if (!midiDevice) return
  monitoring = false
  midi.resetClock()
  midi.removeBPMListeners()
  clockDisplay.innerHTML = `⌚ Clock: None detected`
  monitorBtn.innerHTML = `👁‍🗨 Start monitoring`
  midiDevice.removeEventListener('midimessage', messageListener)
  log.innerHTML += `\n+++ Monitoring stopped\n`
}

function startMonitoring() {
  if (!midiDevice) return
  monitoring = true
  midi.resetClock()
  midi.addBPMListener((bpm) => {
    clockDisplay.innerHTML = `⌚ Clock: ${bpm} BPM`
  })
  monitorBtn.innerHTML = `🛑 Stop monitoring`
  midiDevice.addEventListener('midimessage', messageListener)
  log.innerHTML += `\n+++ Monitoring started on ${midiDevice.name}\n`
}

// function clearMonitor() {
//   log.innerHTML = 'kkkkkkkk'
// }

function deviceSelected(evt) {
  if (!evt.target.value) return

  stopMonitoring()
  midiDevice = midi.access.inputs.get(evt.target.value)
  monitorBtn.disabled = false
  startMonitoring()
}

function messageListener(msg) {
  let text = midi.describeMessage(msg)
  if (!text) return
  log.innerHTML = log.innerHTML + text + '\n'
  log.scrollTop = log.scrollHeight
}
