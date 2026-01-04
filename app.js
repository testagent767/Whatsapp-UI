
const BASE_API =
  "https://5wfq05ex.rpcld.cc/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

const MY_NUMBER = "905452722489";
let activeConversationId = null;

/* ---------------- CONTACTS ---------------- */

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

/* ---------------- DATE LABEL ---------------- */

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString();
}

/* ---------------- LOAD MESSAGES ---------------- */

function loadMessages() {
  if (!activeConversationId) return;

  fetch(`${BASE_API}?conversation_id=${activeConversationId}`)
    .then(res => res.json())
    .then(data => {
      const box = document.getElementById("messages");
      box.innerHTML = "";

      if (!Array.isArray(data) || data.length === 0) return;

      data.sort(
        (a, b) => new Date(a.Timestamp) - new Date(b.Timestamp)
      );

      let lastDate = null;

      data.forEach(m => {
        const currentDate = formatDateLabel(m.Timestamp);

        if (currentDate !== lastDate) {
          const dateDiv = document.createElement("div");
          dateDiv.className = "date-separator";
          dateDiv.textContent = currentDate;
          box.appendChild(dateDiv);
          lastDate = currentDate;
        }

        const dir =
          m.direction === "outbond" || m.direction === "outbound"
            ? "outbound"
            : "inbound";

        const msg = document.createElement("div");
        msg.className = `msg ${dir}`;
        msg.innerHTML = `
          <div>${m.Text || m.text || ""}</div>
          <div class="time">
            ${new Date(m.Timestamp).toLocaleTimeString()}
          </div>
        `;

        box.appendChild(msg);
      });

      box.scrollTop = box.scrollHeight;
    });
}

/* ---------------- SEND MESSAGE (NEW JSON) ---------------- */

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text || !activeConversationId) return;

  const now = new Date().toISOString();

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
      from: MY_NUMBER,
      to: activeConversationId,
      text: text,
      direction: "outbound",
      status: "sent",
      timestamp: now
    })
  });

  input.value = "";
}

/* ---------------- POLLING (10s) ---------------- */

loadContacts();
setInterval(loadContacts, 10000);

setInterval(() => {
  if (activeConversationId) loadMessages();
}, 10000);
