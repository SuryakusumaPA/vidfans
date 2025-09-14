async function fetchUser() {
  const res = await fetch("/api/me");
  return res.json();
}

async function loadVideos() {
  const res = await fetch("/api/videos");
  const videos = await res.json();
  const list = document.getElementById("videoList");
  list.innerHTML = "";
  videos.forEach(video => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${video.title}</strong> - $${video.price}
      ${video.filename ? `<br><video src="/uploads/${video.filename}" width="200" controls></video>` : ""}
      <button class="btn-danger btn-delete" data-id="${video.id}">❌ Hapus</button>
    `;
    li.querySelector(".btn-delete").addEventListener("click", async () => {
      await fetch(`/api/videos/${video.id}`, { method: "DELETE" });
      loadVideos();
    });
    list.appendChild(li);
  });
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (res.ok) location.reload();
  else alert("Login failed");
});

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("regUsername").value;
  const password = document.getElementById("regPassword").value;
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (res.ok) alert("User registered, now login!");
  else alert("Register failed");
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  location.reload();
});

document.getElementById("sellForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const res = await fetch("/api/videos", { method: "POST", body: formData });
  if (res.ok) {
    loadVideos();
    e.target.reset();
  } else {
    const err = await res.json();
    alert(err.error);
  }
});

// On load
fetchUser().then(user => {
  if (user) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("userArea").style.display = "block";
    document.getElementById("userNameDisplay").textContent = user.username;
    loadVideos();
  }
});
