
const WEBHOOK =
  "https://5wfq05ex.rpcld.cc/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let contacts = [];
let selectedContact = null;
let messagePoller = null;
let contactPoller = null;

/* =====================
   HELPERS
===================== */
function isNearBottom(box) {
  return box.scrollHeight - box.scrollTop - box.clientHeight < 100;
}

function scrollToBottom() {
  const box = document.getElementById("messages");
  box.scrollTop = box.scrollHeight;
}

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

/* =====================
   CONTACT POLLING
===================== */
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

  updateToggle(contact.automate_response);
  document.getElementById("toggleBtn").disabled = false;

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
   TOGGLE
===================== */
function updateToggle(isAuto) {
  document.getElementById("toggleBtn").innerText =
    isAuto ? "🤖" : "✋";
}

document.getElementById("toggleBtn").onclick = async () => {
  if (!selectedContact) return;

  const newValue = !selectedContact.automate_response;
  selectedContact.automate_response = newValue;
  updateToggle(newValue);

  await fetch(WEBHOOK, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: selectedContact.Phone_number,
      automate_response: newValue,
    }),
  });
};

/* =====================
   LOAD MESSAGES (NO FORCED SCROLL)
===================== */
async function loadMessages(conversationId) {
  const res = await fetch(`${WEBHOOK}?conversation_id=${conversationId}`);
  const data = await res.json();

  const box = document.getElementById("messages");
  const shouldScroll = isNearBottom(box);

  box.innerHTML = "";

  data
    .sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp))
    .forEach(renderMessage);

  if (shouldScroll) scrollToBottom();
}

/* =====================
   RENDER MESSAGE
===================== */
function renderMessage(m) {
  const box = document.getElementById("messages");

  const div = document.createElement("div");
  div.className = `message ${m.direction === "outbound" ? "outbound" : "inbound"}`;

  div.innerHTML = `
    <div>${m.Text || ""}</div>
    <div class="time">${new Date(m.Timestamp).toLocaleTimeString()}</div>
  `;

  box.appendChild(div);
}

/* =====================
   MESSAGE POLLING
===================== */
function startMessagePolling(conversationId) {
  if (messagePoller) clearInterval(messagePoller);
  messagePoller = setInterval(() => {
    if (selectedContact) loadMessages(conversationId);
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
    direction: "outbound",
    Text: text,
    Timestamp: timestamp,
  });

  scrollToBottom();

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
