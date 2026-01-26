const LOGIN_WEBHOOK = "https://bjl82de9.rpcl.app/webhook/login";
const WHATSAPP_WEBHOOK =
  "https://bjl82de9.rpcl.app/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let TOKEN = localStorage.getItem("token");

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + TOKEN
  };
}

/* =====================
   LOGIN
===================== */
async function login() {
  const password = document.getElementById("passwordInput").value.trim();
  if (!password) return alert("Enter password");

  const res = await fetch(LOGIN_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  const data = await res.json();

  if (!data.token) {
    alert("Wrong password");
    return;
  }

  TOKEN = data.token;
  localStorage.setItem("token", TOKEN);
  document.getElementById("loginScreen").style.display = "none";
  initApp();
}

/* =====================
   APP INIT
===================== */
let contacts = [];
let selectedContact = null;
let poller = null;
let lastTimestamp = null;

function initApp() {
  loadContacts();
}

/* =====================
   LOAD CONTACTS
===================== */
async function loadContacts() {
  const res = await fetch(WHATSAPP_WEBHOOK, {
    headers: authHeaders()
  });
  contacts = await res.json();
  renderContacts();
}

function renderContacts() {
  const list = document.getElementById("contactList");
  list.innerHTML = "";

  contacts.forEach(c => {
    const li = document.createElement("li");
    li.className = "contact";
    li.innerHTML = `
      <div class="contact-name">${c.Name || "Unknown"}</div>
      <div class="contact-preview">${c.Last_message_preview || ""}</div>
    `;
    li.onclick = () => selectContact(c);
    list.appendChild(li);
  });
}

/* =====================
   SELECT CONTACT
===================== */
async function selectContact(contact) {
  selectedContact = contact;
  lastTimestamp = null;

  document.getElementById("chatName").innerText =
    contact.Name || "Unknown";
  document.getElementById("chatNumber").innerText =
    contact.Phone_number;

  updateToggleIcon(contact.automate_reponse);
  document.getElementById("toggleBtn").disabled = false;
  document.getElementById("messages").innerHTML = "";

  if (window.innerWidth <= 600) {
    document.getElementById("sidebar").classList.add("hidden");
    document.getElementById("chat").classList.add("active");
  }

  await loadMessages();
  startPolling();
}

/* =====================
   TOGGLE AI
===================== */
document.getElementById("toggleBtn").onclick = async () => {
  if (!selectedContact) return;

  const newVal = !selectedContact.automate_reponse;
  selectedContact.automate_reponse = newVal;
  updateToggleIcon(newVal);

  await fetch(WHATSAPP_WEBHOOK, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({
      conversation_id: selectedContact.Phone_number,
      automate_reponse: newVal
    })
  });
};

function updateToggleIcon(val) {
  document.getElementById("toggleBtn").innerText = val ? "🤖" : "✋";
}

/* =====================
   LOAD MESSAGES
===================== */
async function loadMessages() {
  let url = `${WHATSAPP_WEBHOOK}?conversation_id=${selectedContact.Phone_number}`;
  if (lastTimestamp) url += `&after=${encodeURIComponent(lastTimestamp)}`;

  const res = await fetch(url, { headers: authHeaders() });
  const messages = await res.json();

  messages.forEach(m => {
    renderMessage(m);
    lastTimestamp = m.Timestamp;
  });
}

function renderMessage(m) {
  const box = document.getElementById("messages");
  const div = document.createElement("div");

  div.className = `message ${
    m.direction === "outbound" ? "outbound" : "inbound"
  }`;

  div.innerHTML = `
    <div>${m.Text}</div>
    <div class="time">${new Date(m.Timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })}</div>
  `;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* =====================
   POLLING
===================== */
function startPolling() {
  if (poller) clearInterval(poller);
  poller = setInterval(loadMessages, 3000);
}

/* =====================
   SEND MESSAGE
===================== */
document.getElementById("sendBtn").onclick = async () => {
  if (!selectedContact) return;

  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;

  const ts = new Date().toISOString();

  renderMessage({
    Text: text,
    direction: "outbound",
    Timestamp: ts
  });

  input.value = "";
  lastTimestamp = ts;

  await fetch(WHATSAPP_WEBHOOK, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      conversation_id: selectedContact.Phone_number,
      Text: text,
      direction: "outbound",
      Timestamp: ts
    })
  });
};

/* =====================
   BACK BUTTON
===================== */
document.getElementById("backBtn").onclick = () => {
  document.getElementById("sidebar").classList.remove("hidden");
  document.getElementById("chat").classList.remove("active");
};

/* =====================
   AUTO LOGIN
===================== */
if (TOKEN) {
  document.getElementById("loginScreen").style.display = "none";
  initApp();
}
