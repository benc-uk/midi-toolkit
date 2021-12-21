# MIDI Monitor

Monitor and view MIDI messages in real time, useful for debugging MIDI issues or to see what messages are being sent by a device.

Written in plain JS and HTML5 because I was fed up with installing MIDI-OX

Features:

- Displays note and CC message information
- System real time, such as stop & start messages
- Detects BPM if real-time clock is received. BPM calculation is not 100% accurate
- Other message types supported: pitch bend, channel aftertouch, poly aftertouch, program change, NRPN
- Not supported: SysEx, MTC

Use the tool here: https://code.benco.io/midi-monitor/

![](https://user-images.githubusercontent.com/14982936/103462150-4448a780-4d1b-11eb-806e-265ecbf4658e.png)

Requires use of Chrome or Edge, as other browsers don't support MIDI. Deal with it
