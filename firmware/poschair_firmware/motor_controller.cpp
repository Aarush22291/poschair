#include "motor_controller.h"

void MotorController::begin() {
  pinMode(EN_PIN, OUTPUT);
  digitalWrite(EN_PIN, HIGH);

  for (int i = 0; i < NUM_MODULES; i++) {
    ledcAttach(RPWM_PINS[i], MOTOR_PWM_FREQ, MOTOR_PWM_RES);
    ledcAttach(LPWM_PINS[i], MOTOR_PWM_FREQ, MOTOR_PWM_RES);
    _stop(i);
    _estimatedPos[i] = 0.0f;
    _moveStartPos[i] = 0.0f;
    _targetPos[i] = 0;
    _state[i] = MotorState::IDLE;
  }

  Serial.println("[Motor] BTS7960 outputs initialised.");
}

void MotorController::homeAll() {
  Serial.println("[Motor] Homing all modules to fully retracted position...");
  _homingDone = false;

  for (int i = 0; i < NUM_MODULES; i++) {
    _state[i] = MotorState::HOMING;
    _driveIn(i, MOTOR_PWM_HOMING);
  }

  delay(HOMING_TIMEOUT_MS);

  for (int i = 0; i < NUM_MODULES; i++) {
    _brake(i);
  }
  delay(HOMING_EXTRA_MS);

  for (int i = 0; i < NUM_MODULES; i++) {
    _stop(i);
    _estimatedPos[i] = 0.0f;
    _moveStartPos[i] = 0.0f;
    _targetPos[i] = 0;
    _state[i] = MotorState::IDLE;
  }

  _homingDone = true;
  Serial.println("[Motor] Homing complete. All positions zeroed.");
}

void MotorController::setTarget(int idx, uint8_t position) {
  if (idx < 0 || idx >= NUM_MODULES) return;
  if (position > MAX_POSITION_MM) position = MAX_POSITION_MM;

  if (abs((int)position - (int)_targetPos[idx]) < MIN_POSITION_CHANGE) return;

  const unsigned long now = millis();
  _updateEstimatedPosition(idx, now);
  _targetPos[idx] = position;
  _moveStartPos[idx] = _estimatedPos[idx];
  _moveDurationMs[idx] = _durationForDelta(_moveStartPos[idx], _targetPos[idx]);
  _moveStartMs[idx] = now;

  if (_moveDurationMs[idx] == 0 || abs(_estimatedPos[idx] - _targetPos[idx]) < 0.5f) {
    _stop(idx);
    _estimatedPos[idx] = _targetPos[idx];
    _state[idx] = MotorState::IDLE;
    return;
  }

  if (_targetPos[idx] > _estimatedPos[idx]) {
    _state[idx] = MotorState::MOVING_OUT;
    _driveOut(idx, MOTOR_PWM_NORMAL);
  } else {
    _state[idx] = MotorState::MOVING_IN;
    _driveIn(idx, MOTOR_PWM_NORMAL);
  }
}

void MotorController::update() {
  const unsigned long now = millis();

  for (int i = 0; i < NUM_MODULES; i++) {
    if (_state[i] != MotorState::MOVING_OUT && _state[i] != MotorState::MOVING_IN) continue;

    _updateEstimatedPosition(i, now);
    const unsigned long elapsed = now - _moveStartMs[i];
    if (elapsed >= _moveDurationMs[i]) {
      _stop(i);
      _estimatedPos[i] = _targetPos[i];
      _state[i] = MotorState::IDLE;
    }
  }
}

uint8_t MotorController::getCurrentPosition(int idx) const {
  if (idx < 0 || idx >= NUM_MODULES) return 0;
  return (uint8_t)constrain((int)roundf(_estimatedPos[idx]), 0, MAX_POSITION_MM);
}

bool MotorController::isAnyMoving() const {
  for (int i = 0; i < NUM_MODULES; i++) {
    if (_state[i] != MotorState::IDLE) return true;
  }
  return false;
}

void MotorController::stopAll() {
  const unsigned long now = millis();
  for (int i = 0; i < NUM_MODULES; i++) {
    _updateEstimatedPosition(i, now);
    _stop(i);
    _targetPos[i] = getCurrentPosition(i);
    _state[i] = MotorState::IDLE;
  }
}

void MotorController::_driveOut(int idx, uint8_t pwm) {
  ledcWrite(RPWM_PINS[idx], pwm);
  ledcWrite(LPWM_PINS[idx], 0);
}

void MotorController::_driveIn(int idx, uint8_t pwm) {
  ledcWrite(RPWM_PINS[idx], 0);
  ledcWrite(LPWM_PINS[idx], pwm);
}

void MotorController::_stop(int idx) {
  ledcWrite(RPWM_PINS[idx], 0);
  ledcWrite(LPWM_PINS[idx], 0);
}

void MotorController::_brake(int idx) {
  ledcWrite(RPWM_PINS[idx], 255);
  ledcWrite(LPWM_PINS[idx], 255);
}

void MotorController::_updateEstimatedPosition(int idx, unsigned long now) {
  if (_state[idx] != MotorState::MOVING_OUT && _state[idx] != MotorState::MOVING_IN) return;
  if (_moveDurationMs[idx] == 0) {
    _estimatedPos[idx] = _targetPos[idx];
    return;
  }

  const unsigned long elapsed = now - _moveStartMs[idx];
  const float progress = min(1.0f, elapsed / (float)_moveDurationMs[idx]);
  _estimatedPos[idx] = _moveStartPos[idx]
    + (_targetPos[idx] - _moveStartPos[idx]) * progress;
}

unsigned long MotorController::_durationForDelta(float fromPos, uint8_t toPos) const {
  const float deltaMm = fabsf(toPos - fromPos) * POSITION_UNIT_TO_MM;
  if (MOTOR_SPEED_MM_PER_MS <= 0.0f) return 0;
  return (unsigned long)(deltaMm / MOTOR_SPEED_MM_PER_MS);
}
