@echo off
if "%PORT%"=="" set PORT=5173
node_modules\.bin\vite.cmd --host --port %PORT%
