
const WEBHOOK =
  "https://5wfq05ex.rpcld.cc/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let selectedConversationId = null;
let selectedContactEl = null;
let contactsCache = {};
let pollInterval = null;
let localMessages = [];

/* LOAD CONTACTS */
async function loadContacts() {
  const res = await fetch(WEBHOOK);
  let data = await res.json();

  /* SORT BY LAST MESSAGE TIMESTAMP DESC */
  data.sort((a, b) => {
    const t1 = a.Last_message_timestamp
      ? new Date(a.Last_message_timestamp).getTime()
      : 0;
    const t2 = b.Last_message_timestamp
      ? new Date(b.Last_message_timestamp).getTime()
      : 0;
    return t2 - t1;
  });

  const contactsDiv = document.getElementById("contacts");
  contactsDiv.innerHTML = "";

  data.forEach(c => {
    if (!c.Phone_number) return;

    contactsCache[c.Phone_number] = c;

    const div = document.createElement("div");
    div.className = "contact";
    div.dataset.phone = c.Phone_number;

    if (c.Phone_number === selectedConversationId) {
      div.classList.add("active");
      selectedContactEl = div;
    }

    const name = document.createElement("div");
    name.className = "contact-name";
    name.innerText = c.Name || c.Phone_number;

    const preview = document.createElement("div");
    preview.className = "contact-preview";
    preview.innerText = c.Last_message_preview || "";

    div.appendChild(name);
    div.appendChild(preview);

    div.onclick = () => selectConversation(c.Phone_number, div);

    contactsDiv.appendChild(div);
  });
}

/* SELECT CHAT */
function selectConversation(conversationId, element) {
  selectedConversationId = conversationId;

  if (selectedContactEl) {
    selectedContactEl.classList.remove("active");
  }
  element.classList.add("active");
  selectedContactEl = element;

  const contact = contactsCache[conversationId];
  document.getElementById("chat-name").innerText =
    contact?.Name || "Unknown";
  document.getElementById("chat-phone").innerText = conversationId;

  localMessages = [];
  loadMessages();

  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(loadMessages, 10000);
}

/* LOAD MESSAGES */
async function loadMessages() {
  if (!selectedConversationId) return;

  const res = await fetch(
    `${WEBHOOK}?conversation_id=${selectedConversationId}`
  );
  localMessages = await res.json();
  renderMessages();
}

/* RENDER MESSAGES */
function renderMessages() {
  const container = document.getElementById("messages");
  container.innerHTML = "";

  localMessages.sort(
    (a, b) =>
      new Date(a.Timestamp || a.timestamp) -
      new Date(b.Timestamp || b.timestamp)
  );

  let lastDate = "";

  localMessages.forEach(msg => {
    const time = new Date(msg.Timestamp || msg.timestamp);
    const day = time.toDateString();

    if (day !== lastDate) {
      const divider = document.createElement("div");
      divider.className = "date-divider";
      divider.innerText = day;
      container.appendChild(divider);
      lastDate = day;
    }

    const bubble = document.createElement("div");
    bubble.className =
      "message " + (msg.direction === "outbound" ? "outbound" : "inbound");
    bubble.innerText = msg.Text || msg.text;

    const timeSpan = document.createElement("span");
    timeSpan.className = "message-time";
    timeSpan.innerText =
      time.getHours().toString().padStart(2, "0") +
      ":" +
      time.getMinutes().toString().padStart(2, "0");

    bubble.appendChild(timeSpan);
    container.appendChild(bubble);
  });

  container.scrollTop = container.scrollHeight;
}

/* SEND (OPTIMISTIC UI) */
document.getElementById("sendBtn").onclick = async () => {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text || !selectedConversationId) return;

  const now = new Date();

  /* Optimistic message */
  localMessages.push({
    text,
    direction: "outbound",
    timestamp: now.toISOString()
  });
  renderMessages();
  input.value = "";

  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: selectedConversationId,
      from: "905452722489",
      to: selectedConversationId,
      text,
      direction: "outbound",
      status: "sent",
      timestamp: now.toISOString()
    })
  });

  /* Reload contacts to update order + preview */
  loadContacts();
};

/* INIT */
loadContacts();
