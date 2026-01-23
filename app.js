const LOGIN_WEBHOOK = "https://bjl82de9.rpcl.app/webhook/login";
const WEBHOOK =
  "https://bjl82de9.rpcl.app/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let TOKEN = localStorage.getItem("token");

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + TOKEN
  };
}

/* =====================
   LOGIN
===================== */
async function login() {
  const password = document.getElementById("passwordInput").value;

  const res = await fetch(LOGIN_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  const data = await res.json();

  if (data.token) {
    TOKEN = data.token;
    localStorage.setItem("token", TOKEN);
    document.getElementById("loginScreen").style.display = "none";
    loadContacts();
  } else {
    alert("Wrong password");
  }
}

/* =====================
   ORIGINAL LOGIC (AYNI)
===================== */
let contacts = [];
let selectedContact = null;
let poller = null;
let lastTimestamp = null;

async function loadContacts() {
  const res = await fetch(WEBHOOK, { headers: getHeaders() });
  contacts = await res.json();

  contacts.sort(
    (a, b) =>
      new Date(b.Last_message_timestamp) -
      new Date(a.Last_message_timestamp)
  );

  renderContacts();
}

function renderContacts() {
  const list = document.getElementById("contactList");
  list.innerHTML = "";

  contacts.forEach(c => {
    const li = document.createElement("li");
    li.className = "contact";

    if (selectedContact?.Phone_number === c.Phone_number) {
      li.classList.add("active");
    }

    li.innerHTML = `
      <div class="contact-name">${c.Name || "Unknown"}</div>
      <div class="contact-preview">${c.Last_message_preview || ""}</div>
      ${c.unread ? `<span class="unread-dot"></span>` : ""}
    `;

    li.onclick = () => selectContact(c);
    list.appendChild(li);
  });
}

/* =====================
   INIT
===================== */
if (TOKEN) {
  document.getElementById("loginScreen").style.display = "none";
  loadContacts();
    }
