const API =
  "https://5wfq05ex.rpcld.cc/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let activeConversation = null;

// Load conversations
fetch(API)
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById("chatList");
    list.innerHTML = "";

    data.forEach(c => {
      const div = document.createElement("div");
      div.className = "chat-item";
      div.innerHTML = `
        <b>${c.phone_number}</b><br/>
        <small>${c.last_message_preview || ""}</small>
      `;
      div.onclick = () => loadMessages(c.conversation_id);
      list.appendChild(div);
    });
  });

// Load messages
function loadMessages(conversationId) {
  activeConversation = conversationId;

  fetch(`${API}?conversation_id=${conversationId}`)
    .then(res => res.json())
    .then(data => {
      const box = document.getElementById("messages");
      box.innerHTML = "";

      data.forEach(m => {
        const div = document.createElement("div");
        div.className = `msg ${m.direction}`;
        div.textContent = m.text;
        box.appendChild(div);
      });

      box.scrollTop = box.scrollHeight;
    });
}

// Send message
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
      text: text
    })
  });
}
