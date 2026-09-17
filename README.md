# FarmChain

FarmChain is a low-cost IoT farm-to-fork traceability prototype.

## Website
- `index.html` — dashboard
- `style.css` — interface styling
- `script.js` — Web Bluetooth, live sensor data, batch ID and event history

## Current hardware
- ESP32
- DHT11
- MPU6500-class IMU
- LEDs

## BLE
Device: `SIH_FARM_NODE`

Service UUID: `12345678-1234-1234-1234-1234567890ab`

Characteristic UUID: `abcd1234-5678-1234-5678-abcdef123456`

## Run
Use VS Code Live Server and a browser with Web Bluetooth support such as Chrome or Edge.

## Current prototype scope
The dashboard receives live sensor data from the ESP32, displays transport conditions, creates a local prototype batch ID, and records detected transport events in the current browser session.

Blockchain/decentralized-ledger integration is not included yet.
