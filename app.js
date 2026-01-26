const LOGIN_WEBHOOK = "https://bjl82de9.rpcl.app/webhook-test/login";
const MAIN_WEBHOOK = "https://bjl82de9.rpcl.app/webhook/d7f6f778-8271-4ade-8b4f-2137cbf684b44";

let AUTH_TOKEN = null;

/* ================= LOGIN ================= */
document.getElementById("loginBtn").onclick = login;

async function login() {
  const password = document.getElementById("passwordInput").value.trim();
  const errorBox = document.getElementById("loginError");
  errorBox.innerText = "";

  if (!password) {
    errorBox.innerText = "Password required";
    return;
  }

  try {
    const res = await fetch(LOGIN_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    // IMPORTANT LOGIC
    if (Array.isArray(data) && data[0]?.token) {
      AUTH_TOKEN = data[0].token;
      unlockApp();
    } else {
      errorBox.innerText = "Wrong password";
    }

  } catch (err) {
    errorBox.innerText = "Server error";
  }
}

function unlockApp() {
  document.getElementById("loginScreen").style.display = "none";
  document.querySelector(".app").classList.add("active");
  loadContacts();
}

/* ================= HEADERS ================= */
function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + AUTH_TOKEN
  };
}

/* ================= CONTACTS ================= */
let contacts = [];
let selectedContact = null;

async function loadContacts() {
  const res = await fetch(MAIN_WEBHOOK, { headers: authHeaders() });
  contacts = await res.json();
  renderContacts();
}

function renderContacts() {
  const list = document.getElementById("contactList");
  list.innerHTML = "";

  contacts.forEach(c => {
    const li = document.createElement("li");
    li.className = "contact";
    li.innerText = c.Name || c.Phone_number;
    li.onclick = () => selectContact(c);
    list.appendChild(li);
  });
}

function selectContact(c) {
  selectedContact = c;
  document.getElementById("chatName").innerText = c.Name || "Unknown";
  document.getElementById("chatNumber").innerText = c.Phone_number;
}
