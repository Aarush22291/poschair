# PosChair BLE Protocol Specification (V3)

This document defines the binary BLE protocol between the browser app and the ESP32 DevKit V1 motor controller.

## Device Information

- **BLE Device Local Name:** `POSCHAIR_001`
- **Service UUID:** `a1b2c3d4-0001-4b5c-8d6e-1f2a3b4c5d6e`
- **Command Characteristic:** `a1b2c3d4-0002-4b5c-8d6e-1f2a3b4c5d6e`
- **Status Characteristic:** `a1b2c3d4-0003-4b5c-8d6e-1f2a3b4c5d6e`

## Module Order

```text
0 = Upper-Left   (UL)
1 = Upper-Right  (UR)
2 = Mid-Left     (ML)
3 = Mid-Right    (MR)
4 = Lower-Left   (LL)
5 = Lower-Right  (LR)
```

All command and status arrays use this exact order.

## Command Packet

App to ESP32, 8 bytes, write without response. Position units are millimeters.

| Byte | Field | Type | Description |
|---|---|---|---|
| 0 | Header | `uint8_t` | Constant `0xA5` |
| 1 | UL position | `uint8_t` | 0-55mm |
| 2 | UR position | `uint8_t` | 0-55mm |
| 3 | ML position | `uint8_t` | 0-55mm |
| 4 | MR position | `uint8_t` | 0-55mm |
| 5 | LL position | `uint8_t` | 0-55mm |
| 6 | LR position | `uint8_t` | 0-55mm |
| 7 | Checksum | `uint8_t` | XOR of bytes 0-6 |

```text
checksum = B0 ^ B1 ^ B2 ^ B3 ^ B4 ^ B5 ^ B6
```

## Status Packet

ESP32 to app, 10 bytes, notify about once per second.

| Byte | Field | Type | Description |
|---|---|---|---|
| 0 | Header | `uint8_t` | Constant `0x5A` |
| 1 | Flags | `uint8_t` | bit0=ok, bit1=failsafe, bit2=homed, bit3=any motor moving |
| 2 | Battery voltage MSB | `uint8_t` | Big-endian millivolts |
| 3 | Battery voltage LSB | `uint8_t` | Big-endian millivolts |
| 4 | UL estimated position | `uint8_t` | 0-55mm |
| 5 | UR estimated position | `uint8_t` | 0-55mm |
| 6 | ML estimated position | `uint8_t` | 0-55mm |
| 7 | MR estimated position | `uint8_t` | 0-55mm |
| 8 | LL estimated position | `uint8_t` | 0-55mm |
| 9 | LR estimated position | `uint8_t` | 0-55mm |

## Test Packets

```text
All retracted:         A5 00 00 00 00 00 00 A5
ML+MR to 50mm:         A5 00 00 32 32 00 00 A5
Full left column out:  A5 37 00 37 00 37 00 92
All fully extended:    A5 37 37 37 37 37 37 A5
```

Positions reported in status packets are open-loop time estimates. They are
not encoder measurements and must not be treated as verified physical travel.

## Failsafe

If no valid command packet arrives for more than `FAILSAFE_TIMEOUT_MS` (2000ms), the ESP32 sets the failsafe flag and commands all modules back to 0mm.
