
const WEBHOOK =
  "https://5wfq05ex.rpcld.cc/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let contacts = [];
let selectedContact = null;
let messagePoller = null;

/* =====================
   LOAD CONTACTS
===================== */
async function loadContacts() {
  const res = await fetch(WEBHOOK);
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

  contacts.forEach((c) => {
    const li = document.createElement("li");
    li.className = "contact";

    if (
      selectedContact &&
      selectedContact.Phone_number === c.Phone_number
    ) {
      li.classList.add("active");
    }

    li.onclick = () => selectContact(c);

    li.innerHTML = `
      <div class="contact-name">${c.Name || "Unknown"}</div>
      <div class="contact-preview">${c.Last_message_preview || ""}</div>
      ${c.unread ? `<span class="unread-dot"></span>` : ""}
    `;

    list.appendChild(li);
  });
}

/* =====================
   SELECT CONTACT
===================== */
async function selectContact(contact) {
  selectedContact = contact;

  document.getElementById("chatName").innerText =
    contact.Name || "Unknown";
  document.getElementById("chatNumber").innerText =
    contact.Phone_number || "";

  document.getElementById("toggleBtn").innerText =
    contact.automate_response ? "🤖" : "✋";
  document.getElementById("toggleBtn").disabled = false;

  // MOBILE: show chat, hide sidebar
  if (window.innerWidth <= 600) {
    document.getElementById("sidebar").classList.add("hidden");
    document.getElementById("chat").classList.add("active");
  }

  if (contact.unread) {
    contact.unread = false;
    await fetch(WEBHOOK, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: contact.Phone_number,
        unread: false,
      }),
    });
  }

  renderContacts();
  loadMessages(contact.Phone_number);
  startMessagePolling(contact.Phone_number);
}

/* =====================
   BACK BUTTON (MOBILE)
===================== */
document.getElementById("backBtn").onclick = () => {
  document.getElementById("sidebar").classList.remove("hidden");
  document.getElementById("chat").classList.remove("active");
};

/* =====================
   LOAD MESSAGES
===================== */
async function loadMessages(id) {
  const res = await fetch(`${WEBHOOK}?conversation_id=${id}`);
  const data = await res.json();

  const box = document.getElementById("messages");
  box.innerHTML = "";

  data
    .sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp))
    .forEach(renderMessage);
}

function renderMessage(m) {
  const box = document.getElementById("messages");

  const div = document.createElement("div");
  div.className = `message ${
    m.direction === "outbound" ? "outbound" : "inbound"
  }`;

  div.innerHTML = `
    <div>${m.Text}</div>
    <div class="time">${new Date(m.Timestamp).toLocaleTimeString()}</div>
  `;

  box.appendChild(div);
}

/* =====================
   POLLING
===================== */
function startMessagePolling(id) {
  if (messagePoller) clearInterval(messagePoller);
  messagePoller = setInterval(() => {
    if (selectedContact) loadMessages(id);
  }, 2000);
}

/* =====================
   SEND MESSAGE
   (SCROLL ONLY HERE)
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
    Timestamp: timestamp,
  });

  const box = document.getElementById("messages");
  box.scrollTop = box.scrollHeight;

  input.value = "";

  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: selectedContact.Phone_number,
      from: "905452722489",
      to: selectedContact.Phone_number,
      text,
      direction: "outbound",
      status: "sent",
      timestamp,
    }),
  });

  loadContacts();
};

/* =====================
   INIT
===================== */
loadContacts();
