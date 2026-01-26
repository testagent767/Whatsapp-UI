const LOGIN_WEBHOOK = "https://bjl82de9.rpcl.app/webhook/login";
const WHATSAPP_WEBHOOK = "https://bjl82de9.rpcl.app/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let TOKEN = null;
let selectedContact = null;

/* LOGIN */
async function login() {
  const password = document.getElementById("passwordInput").value;
  const errorEl = document.getElementById("loginError");
  errorEl.textContent = "";

  const res = await fetch(LOGIN_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  const data = await res.json();

  // ✅ ARRAY RESPONSE FIX
  if (Array.isArray(data) && data[0] && data[0].token) {
    TOKEN = data[0].token;
    document.getElementById("loginScreen").style.display = "none";
    loadContacts();
  } else {
    errorEl.textContent = "Wrong password";
  }
}

/* LOAD CONTACTS */
async function loadContacts() {
  const res = await fetch(WHATSAPP_WEBHOOK, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });

  const data = await res.json();
  const list = document.getElementById("contactList");
  list.innerHTML = "";

  data.contacts?.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c.name || c.number;
    li.onclick = () => openChat(c);
    list.appendChild(li);
  });
}

/* OPEN CHAT */
function openChat(contact) {
  selectedContact = contact;
  document.getElementById("chatName").textContent = contact.name || "Chat";
  document.getElementById("chatNumber").textContent = contact.number;
  document.getElementById("messages").innerHTML = "";
}

/* SEND MESSAGE */
document.getElementById("sendBtn").onclick = async () => {
  const input = document.getElementById("messageInput");
  if (!input.value || !selectedContact) return;

  appendMessage(input.value, "outgoing");

  await fetch(WHATSAPP_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`
    },
    body: JSON.stringify({
      to: selectedContact.number,
      message: input.value
    })
  });

  input.value = "";
};

/* UI MESSAGE */
function appendMessage(text, type) {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.textContent = text;
  document.getElementById("messages").appendChild(msg);
      }
