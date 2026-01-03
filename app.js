
const API =
  "https://5wfq05ex.rpcld.cc/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let activeConversation = null;

/* ---------------- LOAD CONVERSATIONS ---------------- */

function loadConversations() {
  fetch(API)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("chatList");
      list.innerHTML = "";

      data.forEach(c => {
        const conversationId =
          c.conversation_id || c.phone_number || c.to || c.from;

        const label =
          c.phone_number ||
          c.conversation_id ||
          c.to ||
          "Unknown";

        const div = document.createElement("div");
        div.className = "chat-item";
        div.innerHTML = `
          <b>${label}</b><br/>
          <small>${c.last_message_preview || ""}</small>
        `;

        div.onclick = () => loadMessages(conversationId, label);
        list.appendChild(div);
      });
    })
    .catch(err => console.error("Conversation load error", err));
}

/* ---------------- LOAD MESSAGES ---------------- */

function loadMessages(conversationId, label) {
  activeConversation = conversationId;
  document.getElementById("chatHeader").textContent = label;

  fetch(`${API}?conversation_id=${conversationId}`)
    .then(res => res.json())
    .then(data => {
      const box = document.getElementById("messages");
      box.innerHTML = "";

      data.forEach(m => {
        const div = document.createElement("div");
        div.className = `msg ${m.direction || "inbound"}`;
        div.textContent = m.text || "";
        box.appendChild(div);
      });

      box.scrollTop = box.scrollHeight;
    })
    .catch(err => console.error("Message load error", err));
}

/* ---------------- SEND MESSAGE ---------------- */

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();

  if (!text || !activeConversation) return;

  // optimistic UI
  const box = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = "msg outbound";
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;

  input.value = "";

  fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: activeConversation,
      text: text,
      direction: "outbound",
      status: "sent"
    })
  }).catch(err => console.error("Send error", err));
}

/* ---------------- POLLING ---------------- */

loadConversations();
setInterval(loadConversations, 2000);

if (activeConversation) {
  setInterval(() => {
    loadMessages(activeConversation);
  }, 2000);
}
