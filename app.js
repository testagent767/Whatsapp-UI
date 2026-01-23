const PASSWORD = "123456"; // CHANGE THIS
const TOKEN = "SECRET_TOKEN_ABC"; // MUST MATCH BACKEND

let AUTH_HEADERS = null;

document.getElementById("loginBtn").onclick = () => {
  const input = document.getElementById("passwordInput").value;

  if (input !== PASSWORD) {
    document.getElementById("loginError").innerText = "Wrong password";
    return;
  }

  AUTH_HEADERS = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${TOKEN}`
  };

  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  loadContacts();
};


const WEBHOOK =
  "https://bjl82de9.rpcl.app/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

const HEADERS = {
  "Content-Type": "application/json",
  "Authorization": "Bearer DEMO_TOKEN"
};

let contacts = [];
let selectedContact = null;
let poller = null;
let lastTimestamp = null;

/* =====================
   LOAD CONTACTS
===================== */
async function loadContacts() {
  const res = await fetch(WEBHOOK, { headers: HEADERS });
  contacts = await res.json();

  contacts.sort(
    (a, b) =>
      new Date(b.Last_message_timestamp) -
      new Date(a.Last_message_timestamp)
  );

  renderContacts();
}

function renderContacts() {
  const list = document.getElementById("contactList");
  list.innerHTML = "";

  contacts.forEach(c => {
    const li = document.createElement("li");
    li.className = "contact";

    if (selectedContact?.Phone_number === c.Phone_number) {
      li.classList.add("active");
    }

    li.innerHTML = `
      <div class="contact-name">${c.Name || "Unknown"}</div>
      <div class="contact-preview">${c.Last_message_preview || ""}</div>
      ${c.unread ? `<span class="unread-dot"></span>` : ""}
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

  // SET TOGGLE ICON
  updateToggleIcon(contact.automate_reponse);

  const toggleBtn = document.getElementById("toggleBtn");
  toggleBtn.disabled = false;

  document.getElementById("messages").innerHTML = "";

  if (window.innerWidth <= 600) {
    document.getElementById("sidebar").classList.add("hidden");
    document.getElementById("chat").classList.add("active");
  }

  await loadMessages();
  startPolling();
}

/* =====================
   TOGGLE HANDLER
===================== */
document.getElementById("toggleBtn").onclick = async () => {
  if (!selectedContact) return;

  const newValue = !selectedContact.automate_reponse;

  // OPTIMISTIC UI UPDATE
  selectedContact.automate_reponse = newValue;
  updateToggleIcon(newValue);

  // PATCH BACKEND
  await fetch(WEBHOOK, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify({
      conversation_id: selectedContact.Phone_number,
      automate_reponse: newValue
    })
  });

  // UPDATE CONTACT LIST STATE
  const index = contacts.findIndex(
    c => c.Phone_number === selectedContact.Phone_number
  );
  if (index !== -1) {
    contacts[index].automate_reponse = newValue;
  }
};

/* =====================
   TOGGLE ICON UI
===================== */
function updateToggleIcon(value) {
  const btn = document.getElementById("toggleBtn");
  btn.innerText = value ? "🤖" : "✋";
}

/* =====================
   LOAD MESSAGES (INCREMENTAL)
===================== */
async function loadMessages() {
  let url = `${WEBHOOK}?conversation_id=${selectedContact.Phone_number}`;
  if (lastTimestamp) {
    url += `&after=${encodeURIComponent(lastTimestamp)}`;
  }

  const res = await fetch(url, { headers: HEADERS });
  const messages = await res.json();

  messages
    .sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp))
    .forEach(m => {
      renderMessage(m);
      lastTimestamp = m.Timestamp;
    });

  autoScroll();
}

function renderMessage(m) {
  const box = document.getElementById("messages");
  const div = document.createElement("div");

  div.className = `message ${
    m.direction === "outbound" ? "outbound" : "inbound"
  }`;

  div.innerHTML = `
    <div>${m.Text}</div>
    <div class="time">
      ${new Date(m.Timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })}
    </div>
  `;

  box.appendChild(div);
}

/* =====================
   AUTO SCROLL
===================== */
function autoScroll() {
  const box = document.getElementById("messages");
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

  const timestamp = new Date().toISOString();

  renderMessage({
    Text: text,
    direction: "outbound",
    Timestamp: timestamp
  });

  lastTimestamp = timestamp;
  input.value = "";

  await fetch(WEBHOOK, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      conversation_id: selectedContact.Phone_number,
      from: 905452722489,
      to: selectedContact.Phone_number,
      Text: text,
      direction: "outbound",
      Timestamp: timestamp
    })
  });

  loadContacts();
};

/* =====================
   BACK BUTTON
===================== */
document.getElementById("backBtn").onclick = () => {
  document.getElementById("sidebar").classList.remove("hidden");
  document.getElementById("chat").classList.remove("active");
};

/* =====================
   INIT
===================== */
loadContacts();
