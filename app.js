const LOGIN_WEBHOOK = "https://bjl82de9.rpcl.app/webhook/login";
const WEBHOOK =
  "https://bjl82de9.rpcl.app/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let TOKEN = localStorage.getItem("token");

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + TOKEN
  };
}

/* =====================
   LOGIN
===================== */
async function login() {
  const password = document.getElementById("passwordInput").value;

  const res = await fetch(LOGIN_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  const data = await res.json();

  // ✅ FIX: n8n ARRAY RESPONSE
  if (Array.isArray(data) && data[0]?.token) {
    TOKEN = data[0].token;
    localStorage.setItem("token", TOKEN);
    document.getElementById("loginScreen").style.display = "none";
    loadContacts();
  } else {
    alert("Wrong password");
  }
}

/* =====================
   ORIGINAL LOGIC
===================== */
let contacts = [];
let selectedContact = null;
let poller = null;
let lastTimestamp = null;

async function loadContacts() {
  const res = await fetch(WEBHOOK, { headers: getHeaders() });
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

async function selectContact(contact) {
  selectedContact = contact;
  lastTimestamp = null;

  document.getElementById("chatName").innerText =
    contact.Name || "Unknown";
  document.getElementById("chatNumber").innerText =
    contact.Phone_number;

  document.getElementById("messages").innerHTML = "";

  if (window.innerWidth <= 600) {
    document.getElementById("sidebar").classList.add("hidden");
    document.getElementById("chat").classList.add("active");
  }

  await loadMessages();
  startPolling();
}

async function loadMessages() {
  let url = `${WEBHOOK}?conversation_id=${selectedContact.Phone_number}`;
  if (lastTimestamp) {
    url += `&after=${encodeURIComponent(lastTimestamp)}`;
  }

  const res = await fetch(url, { headers: getHeaders() });
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

function autoScroll() {
  const box = document.getElementById("messages");
  box.scrollTop = box.scrollHeight;
}

function startPolling() {
  if (poller) clearInterval(poller);
  poller = setInterval(loadMessages, 3000);
}

/* =====================
   INIT
===================== */
if (TOKEN) {
  document.getElementById("loginScreen").style.display = "none";
  loadContacts();
}
