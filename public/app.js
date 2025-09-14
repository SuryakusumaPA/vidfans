async function apiRequest(url, method = 'GET', data) {
  const options = { method, headers: {} };
  if (data) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const authDiv = document.getElementById('auth');
const userArea = document.getElementById('userArea');
const userNameDisplay = document.getElementById('userNameDisplay');
const videoList = document.getElementById('videoList');
const sellForm = document.getElementById('sellForm');
const boxButton = document.getElementById('boxButton');

function showError(message) {
  alert(message);
}

async function loadUser () {
  try {
    const user = await apiRequest('/api/me');
    if (user) {
      authDiv.style.display = 'none';
      userArea.style.display = 'block';
      userNameDisplay.textContent = user.username;
      loadVideos();
    } else {
      authDiv.style.display = 'block';
      userArea.style.display = 'none';
    }
  } catch (e) {
    showError(e.message);
  }
}

async function loadVideos() {
  try {
    const videos = await apiRequest('/api/videos');
    videoList.innerHTML = '';
    videos.forEach(v => {
      const li = document.createElement('li');
      li.textContent = `${v.title} - $${v.price.toFixed(2)}`;
      videoList.appendChild(li);
    });
  } catch (e) {
    showError(e.message);
  }
}

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  try {
    await apiRequest('/api/login', 'POST', { username, password });
    await loadUser ();
  } catch (e) {
    showError(e.message);
  }
});

registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  try {
    await apiRequest('/api/register', 'POST', { username, password });
    alert('Registered successfully! You can now log in.');
    registerForm.reset();
  } catch (e) {
    showError(e.message);
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await apiRequest('/api/logout', 'POST');
    await loadUser ();
  } catch (e) {
    showError(e.message);
  }
});

sellForm.addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('videoTitle').value.trim();
  const price = parseFloat(document.getElementById('videoPrice').value);
  if (!title || isNaN(price) || price < 0) {
    showError('Please enter valid title and price');
    return;
  }
  try {
    await apiRequest('/api/videos', 'POST', { title, price });
    sellForm.reset();
    loadVideos();
  } catch (e) {
    showError(e.message);
  }
});

boxButton.addEventListener('click', () => {
  alert('Box button clicked!');
});

// Initial load
loadUser ();