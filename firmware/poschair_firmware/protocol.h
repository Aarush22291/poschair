#pragma once
#include <Arduino.h>

// Command packet (app -> ESP32), 8 bytes:
// [0] 0xA5
// [1..6] UL, UR, ML, MR, LL, LR positions, each 0-55mm
// [7] XOR checksum of bytes [0..6]
#define CMD_HEADER 0xA5
#define CMD_PACKET_SIZE 8

struct CommandPacket {
  uint8_t header;
  uint8_t positions[6];
  uint8_t checksum;
};

inline uint8_t calcChecksum(uint8_t header, const uint8_t* positions) {
  uint8_t sum = header;
  for (int i = 0; i < 6; i++) sum ^= positions[i];
  return sum;
}

inline bool parseCommand(const uint8_t* data, size_t len, CommandPacket& out) {
  if (len != CMD_PACKET_SIZE) return false;
  if (data[0] != CMD_HEADER) return false;
  if (data[7] != calcChecksum(data[0], &data[1])) return false;

  out.header = data[0];
  memcpy(out.positions, &data[1], 6);
  out.checksum = data[7];
  return true;
}

// Status packet (ESP32 -> app), 10 bytes:
// [0] 0x5A
// [1] flags: bit0=ok, bit1=failsafe, bit2=homed, bit3=any motor moving
// [2..3] battery voltage in millivolts, big-endian uint16
// [4..9] estimated UL, UR, ML, MR, LL, LR positions, each 0-55mm
#define STATUS_HEADER 0x5A
#define STATUS_PACKET_SIZE 10
