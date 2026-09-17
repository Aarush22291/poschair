import { describe, expect, it } from 'vitest';
import { buildCommandPacket, parseStatusPacket } from '../bleManager';

describe('BLE protocol', () => {
  it('clamps positions and appends the XOR checksum', () => {
    const packet = new Uint8Array(buildCommandPacket([-2, 10.4, 20.6, 55, 70, 3]));

    expect(Array.from(packet.slice(0, 7))).toEqual([0xa5, 0, 10, 21, 55, 55, 3]);
    expect(packet[7]).toBe(packet.slice(0, 7).reduce((sum, value) => sum ^ value, 0));
  });

  it('parses battery voltage, flags, and all six positions', () => {
    const payload = new Uint8Array([0x5a, 0x0d, 0x2e, 0xe0, 1, 2, 3, 4, 5, 6]);
    const status = parseStatusPacket(new DataView(payload.buffer));

    expect(status).toEqual({
      flags: 0x0d,
      batteryMv: 12000,
      currentPositions: [1, 2, 3, 4, 5, 6],
      isOk: true,
      isFailsafe: false,
      isHomed: true,
      isMoving: true,
    });
  });

  it('rejects malformed status packets', () => {
    expect(parseStatusPacket(new DataView(new Uint8Array([0x5a]).buffer))).toBeNull();
    expect(parseStatusPacket(new DataView(new Uint8Array(10).buffer))).toBeNull();
  });
});
