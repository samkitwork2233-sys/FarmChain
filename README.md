# FarmChain

**FarmChain — Low-Cost IoT & Blockchain-Based Farm-to-Fork Traceability System**

FarmChain is a prototype for monitoring produce conditions during the farm-to-fork journey. An ESP32-based IoT node collects environmental and motion data and sends live readings to the web dashboard over Bluetooth Low Energy (BLE).

## Current Prototype

### Sensors
- DHT11 — temperature and humidity
- MPU6500-class IMU — acceleration, gyroscope and orientation

### Controller
- ESP32

### Web
- HTML
- CSS
- JavaScript
- Web Bluetooth API

## BLE Configuration

Device name:

`SIH_FARM_NODE`

Service UUID:

`12345678-1234-1234-1234-1234567890ab`

Characteristic UUID:

`abcd1234-5678-1234-5678-abcdef123456`

## Run Locally

Web Bluetooth requires a secure context. For local testing, run the project through a local development server such as VS Code Live Server, then open the page in a supported browser such as Chrome or Edge.

## Deployment

The website can be deployed as a static site using Vercel from this GitHub repository.

## Note

The current prototype demonstrates IoT sensing, BLE transmission and dashboard monitoring. Blockchain/decentralized-ledger integration is a planned layer and should not be considered implemented until connected to an actual ledger.
