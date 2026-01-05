const WEBHOOK =
  "https://5wfq05ex.rpcld.cc/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let contacts = [];
let selectedContact = null;

/* ---------- CONTACTS ---------- */

async function fetchContacts() {
  const res = await fetch(WEBHOOK);
  contacts = await res.json();

  contacts.sort(
    (a, b) =>
      new Date(b.Last_message_timestamp) -
      new Date(a.Last_message_timestamp)
  );

  renderContacts();
}

function renderContacts() {
  const el = document.getElementById("contacts");
  el.innerHTML = "";

  contacts.forEach((c) => {
    const div = document.createElement("div");
    div.className = "contact";
    if (selectedContact?.Phone_number === c.Phone_number)
      div.classList.add("active");

    div.innerHTML = `
      <div class="contact-top">
        <span class="name">${c.Name}</span>
        <span class="toggle" onclick="toggleAI(event,'${c.Phone_number}',${c.automate_response})">
          ${c.automate_response ? "🤖" : "✋"}
        </span>
      </div>
      <div class="contact-top">
        <span class="preview">${c.Last_message_preview || ""}</span>
        ${c.unread ? `<span class="dot"></span>` : ""}
      </div>
    `;

    div.onclick = () => selectContact(c);
    el.appendChild(div);
  });
}

async function toggleAI(e, phone, current) {
  e.stopPropagation();

  await fetch(WEBHOOK, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: phone,
      automate_response: !current,
    }),
  });

  fetchContacts();
}

/* ---------- SELECT CONTACT ---------- */

async function selectContact(contact) {
  selectedContact = contact;

  document.getElementById("chatHeader").innerText =
    `${contact.Name} • ${contact.Phone_number}`;

  // optimistic unread
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

  startMessagesPolling();
}

/* ---------- MESSAGES ---------- */

async function fetchMessages() {
  if (!selectedContact) return;

  const res = await fetch(
    `${WEBHOOK}?conversation_id=${selectedContact.Phone_number}`
  );
  const msgs = await res.json();
  renderMessages(msgs);
}

function renderMessages(msgs) {
  const el = document.getElementById("messages");
  el.innerHTML = "";

  let lastDay = null;

  msgs
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .forEach((m) => {
      const day = new Date(m.timestamp).toDateString();
      if (day !== lastDay) {
        el.innerHTML += `<div class="day">${day}</div>`;
        lastDay = day;
      }

      el.innerHTML += `
        <div class="msg ${m.direction}">
          <div class="bubble">${m.text}</div>
          <div class="time">
            ${new Date(m.timestamp).toLocaleTimeString()}
          </div>
        </div>
      `;
    });

  el.scrollTop = el.scrollHeight;
}

/* ---------- SEND ---------- */

async function sendMessage() {
  if (!selectedContact) return;

  const input = document.getElementById("textInput");
  const text = input.value.trim();
  if (!text) return;

  const payload = {
    conversation_id: selectedContact.Phone_number,
    from: "905452722489",
    to: selectedContact.Phone_number,
    text,
    direction: "outbound",
    status: "sent",
    timestamp: new Date().toISOString(),
  };

  input.value = "";

  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  fetchMessages();
}

/* ---------- POLLING ---------- */

fetchContacts();
setInterval(fetchContacts, 10000);
setInterval(fetchMessages, 2000);
