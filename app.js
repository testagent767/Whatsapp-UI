const BASE_API =
  "https://5wfq05ex.rpcld.cc/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let activeConversationId = null;

/* ---------------- LOAD CONTACTS ---------------- */

function loadContacts() {
  fetch(BASE_API)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("chatList");
      list.innerHTML = "";

      data.forEach(item => {
        if (!item.Phone_number) return;

        const div = document.createElement("div");
        div.className = "chat-item";

        div.innerHTML = `
          <div class="name">${item.Name || item.Phone_number}</div>
          <div class="preview">${item.Last_message_preview || ""}</div>
        `;

        div.onclick = () =>
          openChat(item.Phone_number, item.Name || item.Phone_number);

        list.appendChild(div);
      });
    });
}

/* ---------------- OPEN CHAT ---------------- */

function openChat(phone, label) {
  activeConversationId = phone;
  document.getElementById("chatHeader").innerText = label;
  loadMessages();
}

/* ---------------- LOAD MESSAGES ---------------- */

function loadMessages() {
  if (!activeConversationId) return;

  fetch(`${BASE_API}?conversation_id=${activeConversationId}`)
    .then(res => res.json())
    .then(data => {
      const box = document.getElementById("messages");
      box.innerHTML = "";

      if (!Array.isArray(data) || data.length === 0) {
        box.innerHTML = "<div>No messages</div>";
        return;
      }

      // SORT BY TIMESTAMP
      data.sort(
        (a, b) => new Date(a.Timestamp) - new Date(b.Timestamp)
      );

      data.forEach(m => {
        const dir =
          m.direction === "outbond" || m.direction === "outbound"
            ? "outbound"
            : "inbound";

        const msg = document.createElement("div");
        msg.className = `msg ${dir}`;
        msg.innerHTML = `
          <div>${m.Text || ""}</div>
          <div class="time">
            ${new Date(m.Timestamp).toLocaleTimeString()}
          </div>
        `;

        box.appendChild(msg);
      });

      box.scrollTop = box.scrollHeight;
    });
}

/* ---------------- SEND MESSAGE ---------------- */

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text || !activeConversationId) return;

  // optimistic UI
  const box = document.getElementById("messages");
  const msg = document.createElement("div");
  msg.className = "msg outbound";
  msg.innerHTML = `<div>${text}</div>`;
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;

  fetch(BASE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: activeConversationId,
      to: activeConversationId,
      Text: text,
      direction: "outbond"
    })
  });

  input.value = "";
}

/* ---------------- POLLING ---------------- */

loadContacts();
setInterval(loadContacts, 3000);

setInterval(() => {
  if (activeConversationId) loadMessages();
}, 3000);
