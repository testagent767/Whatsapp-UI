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

/* =====================
   CONTACT POLLING (10s)
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

  renderContacts();
  await loadMessages(contact.Phone_number);
  startMessagePolling(contact.Phone_number);
}

/* =====================
   TOGGLE 🤖 / ✋
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
   LOAD MESSAGES
===================== */
async function loadMessages(conversationId) {
  const res = await fetch(
    `${WEBHOOK}?conversation_id=${conversationId}`
  );
  const data = await res.json();

  const box = document.getElementById("messages");
  box.innerHTML = "";

  data
    .sort(
      (a, b) => new Date(a.Timestamp) - new Date(b.Timestamp)
    )
    .forEach(renderMessage);

  box.scrollTop = box.scrollHeight;
}

/* =====================
   RENDER MESSAGE
===================== */
function renderMessage(m) {
  const box = document.getElementById("messages");

  const div = document.createElement("div");
  div.className = `message ${
    m.direction === "outbound" ? "outbound" : "inbound"
  }`;

  div.innerHTML = `
    <div>${m.Text || ""}</div>
    <div class="time">
      ${new Date(m.Timestamp).toLocaleTimeString()}
    </div>
  `;

  box.appendChild(div);
}

/* =====================
   MESSAGE POLLING (2s)
===================== */
function startMessagePolling(conversationId) {
  if (messagePoller) clearInterval(messagePoller);

  messagePoller = setInterval(() => {
    if (selectedContact) {
      loadMessages(conversationId);
    }
  }, 2000);
}

/* =====================
   SEND MESSAGE (OPTIMISTIC)
===================== */
document.getElementById("sendBtn").onclick = async () => {
  const input = document.getElementById("messageInput");
  if (!input.value || !selectedContact) return;

  const temp = {
    Text: input.value,
    direction: "outbound",
    Timestamp: new Date().toISOString(),
  };

  renderMessage(temp);

  const payload = {
    conversation_id: selectedContact.Phone_number,
    from: "905452722489",
    to: selectedContact.Phone_number,
    text: temp.Text,
    direction: "outbound",
    status: "sent",
    timestamp: temp.Timestamp,
  };

  input.value = "";

  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  loadContacts();
};

/* =====================
   INIT
===================== */
loadContacts();
startContactPolling();
