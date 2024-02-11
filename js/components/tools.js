import Alpine from 'https://unpkg.com/alpinejs@3.13.x/dist/module.esm.js'
import * as midi from '../lib/midi.js'

export const toolsComponent = () => ({
  ccList: [],
  sevenBitNums: [],
  ccNumber: 0,
  ccValue: 0,
  sendOnChange: false,
  activeChannel: 1,

  nrpnNum: 0,
  nrpnValue: 0,
  nrpnNumMsb: 0,
  nrpnNumLsb: 0,
  nrpnValueMsb: 0,
  nrpnValueLsb: -1,

  init() {
    for (let n = 0; n < 128; n++) {
      this.sevenBitNums.push(n)
      this.ccList.push({
        name: midi.ccList[n] ? `${n} - ${midi.ccList[n]}` : n,
        number: n
      })
    }

    this.$watch('ccValue', () => {
      if (this.sendOnChange) {
        this.sendCC()
      }
    })

    this.activeChannel = this.$store.config.channel
  },

  sendCC() {
    // prettier-ignore
    midi.sendCCMessage(
      Alpine.store('config').outputDevice, 
      this.$store.config.channel, 
      this.ccNumber, 
      parseInt(this.ccValue)
    )
  },

  sendNRPN() {
    // prettier-ignore
    midi.sendNRPNMessage(
      Alpine.store('config').outputDevice, 
      this.$store.config.channel,
      parseInt(this.nrpnNumMsb), parseInt(this.nrpnNumLsb), 
      parseInt(this.nrpnValueMsb), parseInt(this.nrpnValueLsb)
    )
  },

  sendPC() {},

  updateNrpnNum() {
    this.nrpnNum = midi.bytePairtoNumber(parseInt(this.nrpnNumMsb), parseInt(this.nrpnNumLsb))
  },

  updateNrpnValue() {
    if (this.nrpnValueLsb >= 0) {
      this.nrpnValue = midi.bytePairtoNumber(parseInt(this.nrpnValueMsb), parseInt(this.nrpnValueLsb))
    } else {
      this.nrpnValue = parseInt(this.nrpnValueMsb)
    }
  }
})
