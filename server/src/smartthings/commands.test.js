import { describe, it, expect } from 'vitest'
import { buildStCommand, allowedStActions } from './commands.js'

/** Status ST z maszyną stanu washer + flagą zdalnego sterowania. */
function washerStatus(machineState, remoteEnabled = 'true') {
  return {
    components: {
      main: {
        washerOperatingState: { machineState: { value: machineState } },
        remoteControlStatus: { remoteControlEnabled: { value: remoteEnabled } },
      },
    },
  }
}

describe('buildStCommand', () => {
  it('maps washer start/pause/stop to setMachineState run/pause/stop', () => {
    expect(buildStCommand('washer', 'start')).toEqual({
      component: 'main', capability: 'washerOperatingState', command: 'setMachineState', arguments: ['run'],
    })
    expect(buildStCommand('washer', 'pause').arguments).toEqual(['pause'])
    expect(buildStCommand('washer', 'stop').arguments).toEqual(['stop'])
  })

  it('uses the matching operating-state capability for dryer and dishwasher', () => {
    expect(buildStCommand('dryer', 'start').capability).toBe('dryerOperatingState')
    expect(buildStCommand('dishwasher', 'stop').capability).toBe('dishwasherOperatingState')
  })

  it('returns null for an unsupported device type', () => {
    expect(buildStCommand('fridge', 'start')).toBeNull()
    expect(buildStCommand('tv', 'start')).toBeNull()
  })

  it('returns null for an unknown action', () => {
    expect(buildStCommand('washer', 'frobnicate')).toBeNull()
  })
})

describe('allowedStActions', () => {
  it('offers pause/stop while running and start while stopped', () => {
    expect(allowedStActions('washer', washerStatus('run'))).toEqual({ remoteControlEnabled: true, actions: ['pause', 'stop'] })
    expect(allowedStActions('washer', washerStatus('stop'))).toEqual({ remoteControlEnabled: true, actions: ['start'] })
  })

  it('offers start/stop while paused', () => {
    expect(allowedStActions('washer', washerStatus('pause'))).toEqual({ remoteControlEnabled: true, actions: ['start', 'stop'] })
  })

  it('locks all actions when remote control is disabled', () => {
    expect(allowedStActions('washer', washerStatus('run', 'false'))).toEqual({ remoteControlEnabled: false, actions: [] })
  })

  it('offers no actions for a non-cycle device type', () => {
    expect(allowedStActions('fridge', washerStatus('run'))).toEqual({ remoteControlEnabled: true, actions: [] })
  })
})
