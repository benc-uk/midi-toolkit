import Alpine from 'https://unpkg.com/alpinejs@3.7.0/dist/module.esm.js'
import * as midi from '../lib/midi.js'

export const keysComponent = () => ({
  offset: 48,
  velocity: 100,

  playKey(key) {
    midi.sendNoteOnMessage(Alpine.store('config').outputDevice, this.$store.config.channel, parseInt(this.offset) + key, parseInt(this.velocity))
  },

  releaseKey(key) {
    midi.sendNoteOffMessage(Alpine.store('config').outputDevice, this.$store.config.channel, parseInt(this.offset) + key)
  }
})

// Sub component for the keys, with lots of $el hacking
// We do this to stop the HTML from being crazy verbose
Alpine.data('key', () => ({
  key: 0,

  init() {
    this.key = parseInt(this.$el.getAttribute('data-key'))
    this.$el.addEventListener('mousedown', (e) => {
      e.stopPropagation()
      this.play(e)
    })
    this.$el.addEventListener('mouseup', (e) => {
      e.stopPropagation()
      this.release(e)
    })
    this.$el.addEventListener('mouseleave', (e) => {
      e.stopPropagation()
      this.release(e)
    })
  },

  play() {
    this.$el.classList.add('pressed')
    console.log(`Playing key ${this.key} at ${this.velocity} on channel ${this.$store.config.channel}`)
    midi.sendNoteOnMessage(Alpine.store('config').outputDevice, this.$store.config.channel, parseInt(this.offset) + this.key, parseInt(this.velocity))
  },

  release() {
    this.$el.classList.remove('pressed')
    midi.sendNoteOffMessage(Alpine.store('config').outputDevice, this.$store.config.channel, parseInt(this.offset) + this.key)
  }
}))

const template = `
<header>
  <i class="fas fa-music fa-fw"></i> &nbsp; Keyboard
</header>

<div class="row">
  Octave: &nbsp;
  <select x-model="offset">
    <option value="0">1</option>
    <option value="12">2</option>
    <option value="24">3</option>
    <option value="36">4</option>
    <option value="48">5</option>
    <option value="60">6</option>
    <option value="72">7</option>
    <option value="84">8</option>
    <option value="96">9</option>
    <option value="108">10</option>
  </select>

  <div class="w10rem"></div>
  Velocity: &nbsp;
  <select x-model="velocity">
    <option value="20">20</option>
    <option value="40">40</option>
    <option value="60">60</option>
    <option value="80">80</option>
    <option value="100">100</option>
    <option value="127">127</option>
  </select>
</div>

<hr>

<div class="row key-wrapper">
  <div class="key" x-data="key" data-key="0">
    <span>C</span>
    <div class="key-black" x-data="key" data-key="1">
      <span>C♯</span>
    </div>
  </div>
  <div class="key" x-data="key" data-key="2">
    <span>D</span>
    <div class="key-black" x-data="key" data-key="3">
      <span>D♯</span>
    </div>
  </div>
  <div class="key" x-data="key" data-key="4">
    <span>E</span>
  </div>
  <div class="key" x-data="key" data-key="5">
    <span>F</span>
    <div class="key-black" x-data="key" data-key="6">
      <span>F♯</span>
    </div>
  </div>
  <div class="key" x-data="key" data-key="7">
    <span>G</span>
    <div class="key-black" x-data="key" data-key="8">
      <span>G♯</span>
    </div>
  </div>
  <div class="key" x-data="key" data-key="9">
    <span>A</span>
    <div class="key-black" x-data="key" data-key="10">
      <span>A♯</span>
    </div>
  </div>
  <div class="key" x-data="key" data-key="11">
    <span>B</span>
  </div>

  <div class="key" x-data="key" data-key="12">
    <span>C</span>
    <div class="key-black" x-data="key" data-key="13">
      <span>C♯</span>
    </div>
  </div>
  <div class="key" x-data="key" data-key="14">
    <span>D</span>
    <div class="key-black" x-data="key" data-key="15">
      <span>D♯</span>
    </div>
  </div>
  <div class="key" x-data="key" data-key="16">
    <span>E</span>
  </div>
  <div class="key" x-data="key" data-key="17">
    <span>F</span>
    <div class="key-black" x-data="key" data-key="18">
      <span>F♯</span>
    </div>
  </div>
  <div class="key" x-data="key" data-key="19">
    <span>G</span>
    <div class="key-black" x-data="key" data-key="20">
      <span>G♯</span>
    </div>
  </div>
  <div class="key" x-data="key" data-key="21">
    <span>A</span>
    <div class="key-black" x-data="key" data-key="22">
      <span>A♯</span>
    </div>
  </div>
  <div class="key" x-data="key" data-key="23">
    <span>B</span>
  </div>
</div>`
