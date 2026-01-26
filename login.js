const LOGIN_WEBHOOK = "https://bjl82de9.rpcl.app/webhook/login";

function login() {
  const password = document.getElementById("passwordInput").value;
  const error = document.getElementById("loginError");
  error.textContent = "";

  fetch(LOGIN_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  })
    .then(res => res.json())
    .then(data => {
      // n8n ARRAY response FIX
      if (Array.isArray(data) && data[0]?.token) {
        document.getElementById("loginScreen").style.display = "none";

        // 🔥 SADECE BURADA WHATSAPP BAŞLAT
        initWhatsapp();
      } else {
        error.textContent = "Wrong password";
      }
    })
    .catch(() => {
      error.textContent = "Login failed";
    });
}
