const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHARACTERISTIC_UUID = "abcd1234-5678-1234-5678-abcdef123456";
const DEVICE_NAME = "SIH_FARM_NODE";

let bluetoothDevice = null;
let characteristic = null;
let logEntries = [];
let lastEventKey = "";

const $ = (id) => document.getElementById(id);

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

function formatNumber(value, decimals = 1) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(decimals) : "—";
}

function connectUI(connected) {
  const badge = $("nodeBadge");
  const status = $("nodeStatus");

  badge.textContent = connected ? "ONLINE" : "OFFLINE";
  badge.className = `badge ${connected ? "online" : "offline"}`;

  status.textContent = connected ? "ONLINE" : "OFFLINE";
  status.style.color = connected ? "var(--accent)" : "var(--danger)";

  setText("connectionText", connected ? "Receiving live sensor data" : "Waiting for sensor connection");
  setText("batchNodeState", connected ? "Online via BLE" : "Offline");

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
    addSystemEvent("Sensor node connected", "NORMAL");
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
    processEvent(data);
  } catch (error) {
    console.error("Invalid sensor packet:", error);
  }
}

function updateDashboard(data) {
  setText("temperature", formatNumber(data.temperature));
  setText("humidity", formatNumber(data.humidity));
  setText("tilt", formatNumber(data.tilt));

  setText("accelX", formatNumber(data.accelX, 2));
  setText("accelY", formatNumber(data.accelY, 2));
  setText("accelZ", formatNumber(data.accelZ, 2));

  setText("gyroX", formatNumber(data.gyroX, 2));
  setText("gyroY", formatNumber(data.gyroY, 2));
  setText("gyroZ", formatNumber(data.gyroZ, 2));

  setText("roll", formatNumber(data.roll));
  setText("pitch", formatNumber(data.pitch));
  setText("lastUpdate", new Date().toLocaleTimeString());

  const status = String(data.status || "NORMAL").toUpperCase();
  updateStatus(status, data.event);
}

function updateStatus(status, eventName) {
  const pill = $("statusPill");
  pill.textContent = status;
  pill.className = `status-pill ${status === "NORMAL" ? "normal" : "alert"}`;

  const nodeStatus = $("nodeStatus");
  nodeStatus.textContent = "ONLINE";
  nodeStatus.style.color = status === "NORMAL" ? "var(--accent)" : "var(--danger)";

  const banner = $("alertBanner");
  if (status === "ALERT") {
    banner.classList.remove("hidden");
    setText("alertTitle", "Transport Alert");
    setText("alertMessage", humanizeEvent(eventName));
    setText("alertTime", new Date().toLocaleTimeString());
  } else {
    banner.classList.add("hidden");
  }
}

function humanizeEvent(eventName) {
  const labels = {
    TILT_DEVIATION: "Tilt deviation detected.",
    TEMPERATURE_OUT_OF_RANGE: "Temperature is outside the prototype monitoring range.",
    HUMIDITY_OUT_OF_RANGE: "Humidity is outside the prototype monitoring range."
  };
  return labels[eventName] || "Abnormal transport condition detected.";
}

function processEvent(data) {
  const status = String(data.status || "NORMAL").toUpperCase();
  const eventName = String(data.event || "NONE").toUpperCase();

  if (status === "ALERT" && eventName !== "NONE") {
    const eventKey = `${eventName}-${formatNumber(data.tilt)}-${formatNumber(data.temperature)}`;
    if (eventKey !== lastEventKey) {
      addLogEntry(eventName, data);
      lastEventKey = eventKey;
    }
  } else if (status === "NORMAL") {
    lastEventKey = "";
  }
}

function addSystemEvent(eventName, status) {
  logEntries.unshift({
    time: new Date().toLocaleTimeString(),
    event: eventName,
    temperature: "—",
    humidity: "—",
    tilt: "—",
    status
  });
  logEntries = logEntries.slice(0, 20);
  renderLogs();
}

function addLogEntry(eventName, data) {
  logEntries.unshift({
    time: new Date().toLocaleTimeString(),
    event: humanizeEvent(eventName).replace(/\.$/, ""),
    temperature: formatNumber(data.temperature),
    humidity: formatNumber(data.humidity),
    tilt: formatNumber(data.tilt),
    status: "ALERT"
  });

  logEntries = logEntries.slice(0, 20);
  renderLogs();
}

function renderLogs() {
  const body = $("logBody");

  if (!logEntries.length) {
    body.innerHTML = '<tr><td colspan="6" class="empty">Connect the FarmChain node to begin recording events.</td></tr>';
    return;
  }

  body.innerHTML = logEntries.map((entry) => `
    <tr>
      <td>${entry.time}</td>
      <td>${entry.event}</td>
      <td>${entry.temperature === "—" ? "—" : entry.temperature + " °C"}</td>
      <td>${entry.humidity === "—" ? "—" : entry.humidity + " %"}</td>
      <td>${entry.tilt === "—" ? "—" : entry.tilt + " °"}</td>
      <td class="${entry.status === "NORMAL" ? "status-normal" : "status-alert"}">${entry.status}</td>
    </tr>
  `).join("");
}

function createBatchId() {
  const year = new Date().getFullYear();
  const number = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `FC-${year}-${number}`;
}

function newBatch() {
  const id = createBatchId();
  setText("batchId", id);
  logEntries = [];
  lastEventKey = "";
  renderLogs();
  addSystemEvent(`New batch created: ${id}`, "NORMAL");
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
$("newBatchBtn").addEventListener("click", newBatch);

$("clearLogBtn").addEventListener("click", () => {
  logEntries = [];
  lastEventKey = "";
  renderLogs();
});

connectUI(false);
