const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHARACTERISTIC_UUID = "abcd1234-5678-1234-5678-abcdef123456";
const DEVICE_NAME = "SIH_FARM_NODE";

let bluetoothDevice = null;
let characteristic = null;
let logEntries = [];

const $ = (id) => document.getElementById(id);

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

function connectUI(connected) {
  const badge = $("nodeBadge");
  const status = $("nodeStatus");

  badge.textContent = connected ? "ONLINE" : "OFFLINE";
  badge.className = `badge ${connected ? "online" : "offline"}`;
  status.textContent = connected ? "ONLINE" : "OFFLINE";
  status.style.color = connected ? "var(--accent)" : "var(--danger)";
  setText("connectionText", connected ? "Receiving live sensor data" : "Waiting for sensor connection");

  $("connectBtn").textContent = connected ? "Disconnect" : "Connect Sensor Node";
  $("heroConnectBtn").textContent = connected ? "Disconnect Node" : "Start Monitoring";
}

async function connectSensor() {
  if (!navigator.bluetooth) {
    alert("Web Bluetooth is not available in this browser. Use Chrome or Edge on a supported device.");
    return;
  }

  try {
    bluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [{ name: DEVICE_NAME }],
      optionalServices: [SERVICE_UUID]
    });

    bluetoothDevice.addEventListener("gattserverdisconnected", handleDisconnect);

    const server = await bluetoothDevice.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

    await characteristic.startNotifications();
    characteristic.addEventListener("characteristicvaluechanged", handleData);

    connectUI(true);
  } catch (error) {
    console.error(error);
    if (error.name !== "NotFoundError") {
      alert(`Connection failed: ${error.message}`);
    }
  }
}

function disconnectSensor() {
  if (bluetoothDevice && bluetoothDevice.gatt.connected) {
    bluetoothDevice.gatt.disconnect();
  }
  handleDisconnect();
}

function handleDisconnect() {
  characteristic = null;
  connectUI(false);
}

function handleData(event) {
  try {
    const decoder = new TextDecoder("utf-8");
    const raw = decoder.decode(event.target.value);
    const data = JSON.parse(raw);

    updateDashboard(data);
    addLog(data);
  } catch (error) {
    console.error("Invalid sensor packet:", error);
  }
}

function updateDashboard(data) {
  setText("temperature", formatNumber(data.temperature));
  setText("humidity", formatNumber(data.humidity));
  setText("tilt", formatNumber(data.tilt));

  setText("accelX", formatNumber(data.accelX));
  setText("accelY", formatNumber(data.accelY));
  setText("accelZ", formatNumber(data.accelZ));

  setText("gyroX", formatNumber(data.gyroX));
  setText("gyroY", formatNumber(data.gyroY));
  setText("gyroZ", formatNumber(data.gyroZ));

  setText("roll", formatNumber(data.roll));
  setText("pitch", formatNumber(data.pitch));

  const status = String(data.status || "NORMAL").toUpperCase();
  const pill = $("statusPill");
  pill.textContent = status;
  pill.className = `status-pill ${status === "NORMAL" ? "normal" : "alert"}`;

  setText("lastUpdate", new Date().toLocaleTimeString());
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1) : "—";
}

function addLog(data) {
  const status = String(data.status || "NORMAL").toUpperCase();

  logEntries.unshift({
    time: new Date().toLocaleTimeString(),
    temperature: formatNumber(data.temperature),
    humidity: formatNumber(data.humidity),
    tilt: formatNumber(data.tilt),
    status
  });

  logEntries = logEntries.slice(0, 12);
  renderLogs();
}

function renderLogs() {
  const body = $("logBody");

  if (!logEntries.length) {
    body.innerHTML = '<tr><td colspan="5" class="empty">Connect the FarmChain node to begin logging.</td></tr>';
    return;
  }

  body.innerHTML = logEntries.map((entry) => `
    <tr>
      <td>${entry.time}</td>
      <td>${entry.temperature} °C</td>
      <td>${entry.humidity} %</td>
      <td>${entry.tilt} °</td>
      <td class="${entry.status === "NORMAL" ? "status-normal" : "status-alert"}">${entry.status}</td>
    </tr>
  `).join("");
}

function toggleConnection() {
  if (bluetoothDevice && bluetoothDevice.gatt && bluetoothDevice.gatt.connected) {
    disconnectSensor();
  } else {
    connectSensor();
  }
}

$("connectBtn").addEventListener("click", toggleConnection);
$("heroConnectBtn").addEventListener("click", toggleConnection);

$("clearLogBtn").addEventListener("click", () => {
  logEntries = [];
  renderLogs();
});

connectUI(false);
