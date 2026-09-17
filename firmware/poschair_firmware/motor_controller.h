#pragma once
#include <Arduino.h>
#include "config.h"

enum class MotorState { IDLE, MOVING_OUT, MOVING_IN, HOMING };

class MotorController {
public:
  void begin();
  void homeAll();
  void setTarget(int idx, uint8_t position);
  void update();
  uint8_t getCurrentPosition(int idx) const;
  bool isAnyMoving() const;
  bool isHomingComplete() const { return _homingDone; }
  void stopAll();

private:
  float _estimatedPos[NUM_MODULES] = {0, 0, 0, 0, 0, 0};
  float _moveStartPos[NUM_MODULES] = {0, 0, 0, 0, 0, 0};
  uint8_t _targetPos[NUM_MODULES] = {0, 0, 0, 0, 0, 0};
  MotorState _state[NUM_MODULES] = {
    MotorState::IDLE, MotorState::IDLE, MotorState::IDLE,
    MotorState::IDLE, MotorState::IDLE, MotorState::IDLE
  };
  unsigned long _moveStartMs[NUM_MODULES] = {0, 0, 0, 0, 0, 0};
  unsigned long _moveDurationMs[NUM_MODULES] = {0, 0, 0, 0, 0, 0};
  bool _homingDone = false;

  void _driveOut(int idx, uint8_t pwm);
  void _driveIn(int idx, uint8_t pwm);
  void _stop(int idx);
  void _brake(int idx);
  void _updateEstimatedPosition(int idx, unsigned long now);
  unsigned long _durationForDelta(float fromPos, uint8_t toPos) const;
};
