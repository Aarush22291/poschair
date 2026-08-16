const SERVICE_UUID = 'a1b2c3d4-0001-4b5c-8d6e-1f2a3b4c5d6e';
const COMMAND_CHAR_UUID = 'a1b2c3d4-0002-4b5c-8d6e-1f2a3b4c5d6e';
const STATUS_CHAR_UUID = 'a1b2c3d4-0003-4b5c-8d6e-1f2a3b4c5d6e';

// Must match MAX_POSITION_MM in firmware/config.h
const MAX_POSITION_MM = 55;

export interface StatusData {
  flags: number;
  currentPositions: number[];
  isOk: boolean;
  isFailsafe: boolean;
  isHomed: boolean;
  isMoving: boolean;
}

export interface BLEManager {
  connect(): Promise<void>;
  disconnect(): void;
  sendPositions(positions: number[]): void;
  isConnected(): boolean;
  onStatus: ((s: StatusData) => void) | null;
  onDisconnect: (() => void) | null;
}

function buildCommandPacket(positions: number[]): ArrayBuffer {
  const buf = new Uint8Array(8);
  buf[0] = 0xA5;

  for (let i = 0; i < 6; i++) {
    buf[i + 1] = Math.min(MAX_POSITION_MM, Math.max(0, Math.round(positions[i] ?? 0)));
  }

  let checksum = 0;
  for (let i = 0; i < 7; i++) checksum ^= buf[i];
  buf[7] = checksum;

  return buf.buffer;
}

function parseStatusPacket(buf: DataView): StatusData | null {
  if (buf.byteLength < 10) return null;
  if (buf.getUint8(0) !== 0x5A) return null;

  const flags = buf.getUint8(1);
  return {
    flags,
    currentPositions: Array.from({ length: 6 }, (_, i) => buf.getUint8(4 + i)),
    isOk: Boolean(flags & 0x01),
    isFailsafe: Boolean(flags & 0x02),
    isHomed: Boolean(flags & 0x04),
    isMoving: Boolean(flags & 0x08),
  };
}

export function createBLEManager(): BLEManager {
  let device: BluetoothDevice | null = null;
  let cmdChar: BluetoothRemoteGATTCharacteristic | null = null;

  const mgr: BLEManager = {
    onStatus: null,
    onDisconnect: null,

    async connect() {
      device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'POSCHAIR_001' }],
        optionalServices: [SERVICE_UUID],
      });

      device.addEventListener('gattserverdisconnected', () => {
        cmdChar = null;
        mgr.onDisconnect?.();
      });

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      cmdChar = await service.getCharacteristic(COMMAND_CHAR_UUID);
      const statusChar = await service.getCharacteristic(STATUS_CHAR_UUID);

      await statusChar.startNotifications();
      statusChar.addEventListener('characteristicvaluechanged', (event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
        if (!value) return;
        const parsed = parseStatusPacket(value);
        if (parsed) mgr.onStatus?.(parsed);
      });
    },

    disconnect() {
      device?.gatt?.disconnect();
      cmdChar = null;
    },

    sendPositions(positions: number[]) {
      if (!cmdChar) return;
      cmdChar.writeValueWithoutResponse(buildCommandPacket(positions)).catch(console.error);
    },

    isConnected() {
      return device?.gatt?.connected ?? false;
    },
  };

  return mgr;
}
