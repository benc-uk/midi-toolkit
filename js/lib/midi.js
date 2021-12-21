// Global MIDI access
let access

export const MSG_STATUS_SYSTEM = 15

// System common messages
export const MSG_SYSEX_START = 0x0
export const MSG_MTC = 0x1
export const MSG_SONG_POSITION = 0x2
export const MSG_SONG_SELECT = 0x3
export const MSG_TUNE_REQUEST = 0x6
export const MSG_SYSEX_END = 0x7

// System real time
export const MSG_CLOCK = 0x8
export const MSG_START = 0xa
export const MSG_CONTINUE = 0xb
export const MSG_STOP = 0xc
export const MSG_ACTIVE_SENSE = 0xe
export const MSG_RESET = 0xf

// Channel voice messages, with data values
export const MSG_PITCH_BEND = 14
export const MSG_CHAN_AFTERTOUCH = 13
export const MSG_PROG_CHANGE = 12
export const MSG_CONTROL_CHANGE = 11
export const MSG_POLY_AFTERTOUCH = 10
export const MSG_NOTE_ON = 9
export const MSG_NOTE_OFF = 8

// ===============================================================================
// Attempt to get MIDI access and hold it globally
// ===============================================================================
export async function getAccess(stateChangeCallback) {
  try {
    if (!access) {
      access = await navigator.requestMIDIAccess()
    }

    if (stateChangeCallback) access.onstatechange = () => stateChangeCallback()

    return access
  } catch (err) {
    console.error('MIDI getAccess failed', err)
  }
}

// ===============================================================================
// Direct access to MIDI access inputs map https://tinyurl.com/394y49b8
// ===============================================================================
export function getInputDevices() {
  if (!access) {
    console.error('MIDI getInputDevices failed: no access')
    return null
  }
  return access.inputs
}

// ===============================================================================
// Direct access to MIDI access outputs map https://tinyurl.com/394y49b8
// ===============================================================================
export function getOutputDevices() {
  if (!access) {
    console.error('MIDI getOutputDevices failed: no access')
    return null
  }
  return access.outputs
}

// ===============================================================================
// Helper to get MIDI output device by id
// ===============================================================================
export function getOutputDevice(deviceId) {
  if (!access) {
    console.error('MIDI access not available')
    return null
  }
  if (!deviceId) {
    //console.warn(`MIDI output device ID empty`)
    return null
  }
  if (!access.outputs.get(deviceId)) {
    console.warn(`MIDI output device ${deviceId} not available`)
    return null
  }
  return access.outputs.get(deviceId)
}

// ===============================================================================
// Helper to get MIDI input device by id
// ===============================================================================
export function getInputDevice(deviceId) {
  if (!access) {
    console.error('MIDI access not available')
    return null
  }
  if (!deviceId) {
    //console.error(`MIDI input device ID empty`)
    return null
  }
  if (!access.inputs.get(deviceId)) {
    console.warn(`MIDI input device ${deviceId} not available`)
    return null
  }
  return access.inputs.get(deviceId)
}

// ===============================================================================
//
// ===============================================================================
export function decodeMessage(msg) {
  let output = {
    timestamp: new Date(),
    type: '',
    channel: 0,
    command: null,
    data1: null,
    data2: null,
    isSystem: false
  }

  let status = byteToNibbles(msg.data[0])
  output.command = status[0]
  output.channel = status[1]

  // System common messages (clock, stop, start, etc)
  // Note. Here the channel nibble actually denotes message *sub-type* NOT the channel, as these messages are global
  if (output.command == MSG_STATUS_SYSTEM) {
    output.isSystem = true

    switch (output.channel) {
      // Common
      case MSG_SYSEX_START:
        output.type = 'SysEx start'
        break
      case MSG_MTC:
        output.type = 'MTC'
        break
      case MSG_SONG_POSITION:
        output.type = 'Song position'
        output.data1 = msg.data[1]
        output.data2 = msg.data[2]
        break
      case MSG_SONG_SELECT:
        output.type = 'Song select'
        break
      case MSG_TUNE_REQUEST:
        output.type = 'Tune request'
        break
      case MSG_SYSEX_END:
        output.type = 'SysEx end'
        break
      // Real time
      case MSG_CLOCK:
        output.type = 'Clock'
        break
      case MSG_START:
        output.type = 'Start'
        break
      case MSG_CONTINUE:
        output.type = 'Continue'
        break
      case MSG_STOP:
        output.type = 'Stop'
        break
      case MSG_ACTIVE_SENSE:
        output.type = 'Active sense'
        break
      case midi:
        output.type = 'Reset'
        break
    }
    return output
  }

  switch (output.command) {
    case MSG_NOTE_ON:
      output.type = 'Note on'
      break
    case MSG_NOTE_OFF:
      output.type = 'Note off'
      break
    case MSG_CONTROL_CHANGE:
      output.type = 'Control change'
      break
    case MSG_PROG_CHANGE:
      output.type = 'Program change'
      break
    case MSG_CHAN_AFTERTOUCH:
      output.type = 'Channel aftertouch'
      break
    case MSG_PITCH_BEND:
      output.type = 'Pitch bend'
      break
    case MSG_POLY_AFTERTOUCH:
      output.type = 'Poly aftertouch'
      break
  }

  output.data1 = msg.data[1]
  output.data2 = msg.data[2]

  return output
}

// ===============================================================================
//
// ===============================================================================
export function sendNoteOnMessage(deviceId, channel, noteNum, velocity) {
  if (!validMessageParameters(channel, noteNum, velocity)) return

  const device = getOutputDevice(deviceId)
  if (device) {
    device.send([0x90 | channel, noteNum, velocity])
  }
}

// ===============================================================================
//
// ===============================================================================
export function sendNoteOffMessage(deviceId, channel, noteNum) {
  if (!validMessageParameters(channel, noteNum)) return

  const device = getOutputDevice(deviceId)
  if (device) {
    device.send([0x80 | channel, noteNum, 0])
  }
}

// ===============================================================================
//
// ===============================================================================
export function sendSystemMessage(deviceId, subType) {
  if (subType < 0 || subType > 15) {
    console.warn(`Invalid MIDI system message subtype: ${subType} (should be 0 - 15)`)
    return
  }

  const device = getOutputDevice(deviceId)
  if (device) {
    device.send([0xf0 | subType])
  }
}

// ===============================================================================
//
// ===============================================================================
export function sendCCMessage(deviceId, channel, cc, value) {
  if (!validMessageParameters(channel, cc, value)) return

  const device = getOutputDevice(deviceId)
  if (device) {
    device.send([0xb0 | channel, cc, value])
  }
}

// ===============================================================================
//
// ===============================================================================
export function sendNRPNMessage(deviceId, channel, numMsb, numLsb, valueMsb, valueLsb) {
  if (!validMessageParameters(channel, cc, numMsb, numLsb, valueMsb, valueLsb)) return

  const device = getOutputDevice(deviceId)
  if (device) {
    device.send([0xb0 | channel, 99, numMsb])
    device.send([0xb0 | channel, 98, numLsb])
    device.send([0xb0 | channel, 6, valueMsb])
    if (valueLsb >= 0) {
      access.outputs.get(deviceId).send([0xb0 | channel, 38, valueLsb])
    }
  }
}

// ===============================================================================
// Helper to validate message parameters
// ===============================================================================
function validMessageParameters(channel, ...inputs) {
  if (channel > 15 || channel < 0) {
    console.warn('Invalid MIDI channel number', channel)
    return false
  }

  for (let input of inputs) {
    if (input < 0 || input > 127) {
      console.warn('Number out of range for MIDI message', input)
      return false
    }
  }

  return true
}

// =================================================================================
// Split a byte into two nibbles
// =================================================================================
export function byteToNibbles(byte) {
  const high = byte & 0xf
  const low = byte >> 4
  return [low, high]
}

// =================================================================================
// Convert a two part (MSB, LSB) num to a 14 bit value
// =================================================================================
export function bytePairtoNumber(msb, lsb) {
  return (msb << 7) + lsb
}

// =================================================================================
// Convert MIDI CC number to a name
// =================================================================================
export function ccNumberToName(number) {
  switch (number) {
    case 0:
      return 'Bank Select MSB'
    case 1:
      return 'Modulation'
    case 2:
      return 'Breath'
    case 4:
      return 'Foot Controller'
    case 5:
      return 'Portamento Time'
    case 6:
      return 'Data Entry MSB'
    case 7:
      return 'Main Volume'
    case 8:
      return 'Balance'
    case 10:
      return 'Pan'
    case 11:
      return 'Expression'
    case 12:
      return 'Effect Control 1'
    case 13:
      return 'Effect Control 2'
    case 16:
      return 'General Purpose 1'
    case 17:
      return 'General Purpose 2'
    case 18:
      return 'General Purpose 3'
    case 19:
      return 'General Purpose 4'
    case 32:
      return 'Bank Select LSB'
    case 33:
      return 'Modulation Wheel'
    case 34:
      return 'Breath Controller'
    case 36:
      return 'Foot Pedal'
    case 38:
      return 'Data Entry MSB'
    case 64:
      return 'Sustain'
    case 65:
      return 'Portamento'
    case 66:
      return 'Sostenuto'
    case 67:
      return 'Soft Pedal'
    case 68:
      return 'Legato Footswitch'
    case 69:
      return 'Hold 2'
    case 70:
      return 'Sound Variation'
    case 71:
      return 'Sound Controller 2'
    case 72:
      return 'Sound Controller 3'
    case 73:
      return 'Sound Controller 4'
    case 74:
      return 'Sound Controller 5'
    case 75:
      return 'Sound Controller 6'
    case 76:
      return 'Sound Controller 7'
    case 77:
      return 'Sound Controller 8'
    case 78:
      return 'Sound Controller 9'
    case 79:
      return 'Sound Controller 10'
    case 80:
      return 'General Purpose 5'
    case 81:
      return 'General Purpose 6'
    case 82:
      return 'General Purpose 7'
    case 83:
      return 'General Purpose 8'
    case 84:
      return 'Portamento Control'
    case 91:
      return 'Effects 1 Depth'
    case 92:
      return 'Effects 2 Depth'
    case 93:
      return 'Effects 3 Depth'
    case 94:
      return 'Effects 4 Depth'
    case 95:
      return 'Effects 5 Depth'
    case 96:
      return 'Data Increment'
    case 97:
      return 'Data Decrement'
    case 98:
      return 'Non-Registered Parameter Number LSB'
    case 99:
      return 'Non-Registered Parameter Number MSB'
    case 100:
      return 'Registered Parameter Number LSB'
    case 101:
      return 'Registered Parameter Number MSB'
    case 120:
      return 'All Sound Off'
    case 121:
      return 'All Controllers Off'
    case 122:
      return 'Local Keyboard'
    case 123:
      return 'All Notes Off'
    case 124:
      return 'Omni Mode Off'
    case 125:
      return 'Omni Mode On'
    case 126:
      return 'Mono Operation'
    case 127:
      return 'Poly Operation'
    default:
      return 'Not defined'
  }
}

// =================================================================================
// MIDI note number to name
// =================================================================================
export function noteNumberToName(number) {
  switch (number) {
    case 0:
      return 'C-2'
    case 1:
      return 'C#-2'
    case 2:
      return 'D-2'
    case 3:
      return 'D#-2'
    case 4:
      return 'E-2'
    case 5:
      return 'F-2'
    case 6:
      return 'F#-2'
    case 7:
      return 'G-2'
    case 8:
      return 'G#-2'
    case 9:
      return 'A-2'
    case 10:
      return 'A#-2'
    case 11:
      return 'B-2'
    case 12:
      return 'C-1'
    case 13:
      return 'C#-1'
    case 14:
      return 'D-1'
    case 15:
      return 'D#-1'
    case 16:
      return 'E-1'
    case 17:
      return 'F-1'
    case 18:
      return 'F#-1'
    case 19:
      return 'G-1'
    case 20:
      return 'G#-1'
    case 21:
      return 'A-1'
    case 22:
      return 'A#-1'
    case 23:
      return 'B-1'
    case 24:
      return 'C0'
    case 25:
      return 'C#0'
    case 26:
      return 'D0'
    case 27:
      return 'D#0'
    case 28:
      return 'E0'
    case 29:
      return 'F0'
    case 30:
      return 'F#0'
    case 31:
      return 'G0'
    case 32:
      return 'G#0'
    case 33:
      return 'A0'
    case 34:
      return 'A#0'
    case 35:
      return 'B0'
    case 36:
      return 'C1'
    case 37:
      return 'C#1'
    case 38:
      return 'D1'
    case 39:
      return 'D#1'
    case 40:
      return 'E1'
    case 41:
      return 'F1'
    case 42:
      return 'F#1'
    case 43:
      return 'G1'
    case 44:
      return 'G#1'
    case 45:
      return 'A1'
    case 46:
      return 'A#1'
    case 47:
      return 'B1'
    case 48:
      return 'C2'
    case 49:
      return 'C#2'
    case 50:
      return 'D2'
    case 51:
      return 'D#2'
    case 52:
      return 'E2'
    case 53:
      return 'F2'
    case 54:
      return 'F#2'
    case 55:
      return 'G2'
    case 56:
      return 'G#2'
    case 57:
      return 'A2'
    case 58:
      return 'A#2'
    case 59:
      return 'B2'
    case 60:
      return 'C3'
    case 61:
      return 'C#3'
    case 62:
      return 'D3'
    case 63:
      return 'D#3'
    case 64:
      return 'E3'
    case 65:
      return 'F3'
    case 66:
      return 'F#3'
    case 67:
      return 'G3'
    case 68:
      return 'G#3'
    case 69:
      return 'A3'
    case 70:
      return 'A#3'
    case 71:
      return 'B3'
    case 72:
      return 'C4'
    case 73:
      return 'C#4'
    case 74:
      return 'D4'
    case 75:
      return 'D#4'
    case 76:
      return 'E4'
    case 77:
      return 'F4'
    case 78:
      return 'F#4'
    case 79:
      return 'G4'
    case 80:
      return 'G#4'
    case 81:
      return 'A4'
    case 82:
      return 'A#4'
    case 83:
      return 'B4'
    case 84:
      return 'C5'
    case 85:
      return 'C#5'
    case 86:
      return 'D5'
    case 87:
      return 'D#5'
    case 88:
      return 'E5'
    case 89:
      return 'F5'
    case 90:
      return 'F#5'
    case 91:
      return 'G5'
    case 92:
      return 'G#5'
    case 93:
      return 'A5'
    case 94:
      return 'A#5'
    case 95:
      return 'B5'
    case 96:
      return 'C6'
    case 97:
      return 'C#6'
    case 98:
      return 'D6'
    case 99:
      return 'D#6'
    case 100:
      return 'E6'
    case 101:
      return 'F6'
    case 102:
      return 'F#6'
    case 103:
      return 'G6'
    case 104:
      return 'G#6'
    case 105:
      return 'A6'
    case 106:
      return 'A#6'
    case 107:
      return 'B6'
    case 108:
      return 'C7'
    case 109:
      return 'C#7'
    case 110:
      return 'D7'
    case 111:
      return 'D#7'
    case 112:
      return 'E7'
    case 113:
      return 'F7'
    case 114:
      return 'F#7'
    case 115:
      return 'G7'
    case 116:
      return 'G#7'
    case 117:
      return 'A7'
    case 118:
      return 'A#7'
    case 119:
      return 'B7'
    case 120:
      return 'C8'
    case 121:
      return 'C#8'
    case 122:
      return 'D8'
    case 123:
      return 'D#8'
    case 124:
      return 'E8'
    case 125:
      return 'F8'
    case 126:
      return 'F#8'
    case 127:
      return 'G8'
    default:
      return 'Unknown'
  }
}

// =================================================================================
// Map of MIDI CC names
// =================================================================================
export const ccList = {
  0: 'Bank Select MSB',
  1: 'Modulation Wheel',
  2: 'Breath Controller',
  4: 'Foot Controller',
  5: 'Portamento Time',
  6: 'Data Entry',
  7: 'Channel Volume',
  8: 'Balance',
  10: 'Pan',
  11: 'Expression Controller',
  12: 'Effect Control 1',
  13: 'Effect Control 2',
  16: 'General Purpose 1',
  17: 'General Purpose 2',
  18: 'General Purpose 3',
  19: 'General Purpose 4',
  32: 'Bank Select LSB',
  64: 'Sustain Pedal',
  65: 'Portamento',
  66: 'Sostenuto',
  67: 'Soft Pedal',
  68: 'Legato Footswitch',
  69: 'Hold 2',
  70: 'Sound 1 (Variation)',
  71: 'Sound 2 (Resonance)',
  72: 'Sound 3 (Release)',
  73: 'Sound 4 (Attack)',
  74: 'Sound 5 (Cutoff)',
  75: 'Sound 6',
  76: 'Sound 7',
  77: 'Sound 8',
  78: 'Sound 9',
  79: 'Sound 10',
  80: 'General Purpose 5',
  81: 'General Purpose 6',
  82: 'General Purpose 7',
  83: 'General Purpose 8',
  84: 'Portamento Control',
  91: 'Effects 1 (Reverb)',
  92: 'Effects 2 (Tremolo)',
  93: 'Effects 3 (Chorus)',
  94: 'Effects 4 (Celeste)',
  95: 'Effects 5 (Phaser)',
  96: 'Data Increment',
  97: 'Data Decrement',
  98: 'NRPN LSB',
  99: 'NRPN MSB',
  100: 'RPN LSB',
  101: 'RPN MSB',
  120: 'All Sound Off',
  121: 'All Controllers Off',
  122: 'Local Keyboard',
  123: 'All Notes Off',
  124: 'Omni Mode Off',
  125: 'Omni Mode On',
  126: 'Mono Operation',
  127: 'Poly Operation'
}
