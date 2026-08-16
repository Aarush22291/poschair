@echo off
title PosChair v1.3 - AI Posture Correction Launcher
echo ========================================================
echo   PosChair v1.3 - AI Posture Corrector
echo   Patent Pending | PosChair Technologies
echo ========================================================
echo.
echo Starting PosChair Web Application...
cd app\frontend
call npm install --silent
echo.
echo Opening PosChair Dashboard in your browser...
start http://localhost:5173
call npm run dev
pause
