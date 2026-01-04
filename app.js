const WEBHOOK =
  "https://5wfq05ex.rpcld.cc/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let selectedConversationId = null;
let pollInterval = null;

/* LOAD CONTACTS */
async function loadContacts() {
  const res = await fetch(WEBHOOK);
  const data = await res.json();

  const contactsDiv = document.getElementById("contacts");
  contactsDiv.innerHTML = "";

  data.forEach(c => {
    if (!c.Phone_number) return;

    const div = document.createElement("div");
    div.className = "contact";
    div.innerText = c.Name || c.Phone_number;

    div.onclick = () => {
      selectConversation(c.Phone_number, c.Name);
    };

    contactsDiv.appendChild(div);
  });
}

/* SELECT CHAT */
function selectConversation(conversationId, name) {
  selectedConversationId = conversationId;
  document.getElementById("chat-header").innerText =
    name || conversationId;

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
  const data = await res.json();

  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "";

  // sort by timestamp
  data.sort(
    (a, b) => new Date(a.Timestamp) - new Date(b.Timestamp)
  );

  let lastDate = "";

  data.forEach(msg => {
    const msgDate = new Date(msg.Timestamp).toDateString();

    if (msgDate !== lastDate) {
      const dateDiv = document.createElement("div");
      dateDiv.className = "date-divider";
      dateDiv.innerText = msgDate;
      messagesDiv.appendChild(dateDiv);
      lastDate = msgDate;
    }

    const bubble = document.createElement("div");
    bubble.className = "message";

    if (msg.direction === "outbound") {
      bubble.classList.add("outbound");
    } else {
      bubble.classList.add("inbound");
    }

    bubble.innerText = msg.Text;
    messagesDiv.appendChild(bubble);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/* SEND MESSAGE */
document.getElementById("sendBtn").onclick = async () => {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();

  if (!text || !selectedConversationId) return;

  const payload = {
    conversation_id: selectedConversationId,
    from: "905452722489",
    to: selectedConversationId,
    text: text,
    direction: "outbound",
    status: "sent",
    timestamp: new Date().toISOString()
  };

  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  input.value = "";
  loadMessages();
};

/* INIT */
loadContacts();
