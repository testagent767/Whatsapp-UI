const WEBHOOK =
  "https://5wfq05ex.rpcld.cc/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let contacts = [];
let selectedContact = null;
let messagePoller = null;
let contactPoller = null;

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

function startContactPolling() {
  if (contactPoller) clearInterval(contactPoller);
  contactPoller = setInterval(loadContacts, 10000);
}

/* =====================
   RENDER CONTACTS
===================== */
function renderContacts() {
  const list = document.getElementById("contactList");
  list.innerHTML = "";

  contacts.forEach((c) => {
    const li = document.createElement("li");
    li.className = "contact";

    if (selectedContact?.Phone_number === c.Phone_number) {
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

  document.getElementById("chatName").innerText = contact.Name || "Unknown";
  document.getElementById("chatNumber").innerText = contact.Phone_number;

  updateToggle(contact.automate_response);
  document.getElementById("toggleBtn").disabled = false;

  // mobile view
  document.getElementById("sidebar").classList.add("hide");
  document.getElementById("chat").classList.add("show");

  // unread off
  if (contact.unread) {
    contact.unread = false;
    renderContacts();

    await fetch(WEBHOOK, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: contact.Phone_number,
        unread: false,
      }),
    });
  }

  await loadMessages(contact.Phone_number);
  startMessagePolling(contact.Phone_number);
}

/* =====================
   BACK BUTTON
===================== */
document.getElementById("backBtn").onclick = () => {
  document.getElementById("sidebar").classList.remove("hide");
  document.getElementById("chat").classList.remove("show");
};

/* =====================
   TOGGLE AI
===================== */
function updateToggle(isAuto) {
  document.getElementById("toggleBtn").innerText = isAuto ? "🤖" : "✋";
}

document.getElementById("toggleBtn").onclick = async () => {
  if (!selectedContact) return;

  selectedContact.automate_response = !selectedContact.automate_response;
  updateToggle(selectedContact.automate_response);

  await fetch(WEBHOOK, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: selectedContact.Phone_number,
      automate_response: selectedContact.automate_response,
    }),
  });
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
  div.className = `message ${m.direction === "outbound" ? "outbound" : "inbound"}`;

  div.innerHTML = `
    <div>${m.Text}</div>
    <div class="time">${new Date(m.Timestamp).toLocaleTimeString()}</div>
  `;

  box.appendChild(div);
}

/* =====================
   MESSAGE POLLING
===================== */
function startMessagePolling(id) {
  if (messagePoller) clearInterval(messagePoller);
  messagePoller = setInterval(() => {
    if (selectedContact) loadMessages(id);
  }, 2000);
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
    Timestamp: timestamp,
  });

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
startContactPolling();
