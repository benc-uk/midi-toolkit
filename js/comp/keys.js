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
