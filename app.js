const API =
  "https://5wfq05ex.rpcld.cc/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let activeContact = null;

/* ---------------- LOAD CONTACTS ---------------- */

function loadContacts() {
  fetch(API)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("chatList");
      list.innerHTML = "";

      data.forEach(item => {
        // IGNORE BROKEN ROWS
        if (!item.Phone_number && !item.Name) return;

        const div = document.createElement("div");
        div.className = "chat-item";

        div.innerHTML = `
          <div class="name">${item.Name || item.Phone_number}</div>
          <div class="preview">${item.Last_message_preview || ""}</div>
        `;

        div.onclick = () => selectChat(item);
        list.appendChild(div);
      });
    })
    .catch(err => console.error("Load contacts error:", err));
}

/* ---------------- SELECT CHAT ---------------- */

function selectChat(contact) {
  activeContact = contact;

  document.getElementById("chatHeader").innerText =
    contact.Name || contact.Phone_number;

  const messages = document.getElementById("messages");
  messages.innerHTML = `
    <div class="placeholder">
      Messages for <b>${contact.Phone_number}</b><br /><br />
      ⚠ Backend does not provide message history yet.
    </div>
  `;
}

/* ---------------- SEND MESSAGE ---------------- */

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();

  if (!text || !activeContact) return;

  fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: activeContact.Phone_number,
      text: text
    })
  });

  input.value = "";
}

/* ---------------- INIT + POLLING ---------------- */

loadContacts();
setInterval(loadContacts, 2000);
