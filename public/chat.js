let socket;
let token = '';
let currentRoom = '';

function show(elementId) {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('chat-container').style.display = 'none';
  document.getElementById('chat-room').style.display = 'none';
  document.getElementById(elementId).style.display = '';
}

// Save token to localStorage on login
async function loginOrRegister(isRegister) {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) {
    document.getElementById('login-msg').innerText = 'Username and password required.';
    return;
  }
  const url = isRegister ? '/api/auth/register' : '/api/auth/login';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (res.ok && data.token) {
    token = data.token;
    localStorage.setItem('chat_token', token); // Save token
    show('chat-container');
    loadRooms();
    connectSocket();
  } else {
    document.getElementById('login-msg').innerText = data.msg || 'Error';
  }
}

document.getElementById('login-btn').onclick = () => loginOrRegister(false);
document.getElementById('register-btn').onclick = () => loginOrRegister(true);
document.getElementById('logout-btn').onclick = () => {
  token = '';
  localStorage.removeItem('chat_token');
  location.reload();
};

document.getElementById('username').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('password').focus();
});
document.getElementById('password').addEventListener('keydown', e => {
  if (e.key === 'Enter') loginOrRegister(false);
});

async function loadRooms() {
  const res = await fetch('/api/rooms');
  const rooms = await res.json();
  const list = document.getElementById('room-list');
  list.innerHTML = '<h3>Rooms</h3>';
  rooms.forEach(room => {
    const btn = document.createElement('button');
    btn.innerText = room;
    btn.onclick = () => joinRoom(room);
    list.appendChild(btn);
  });
}

function connectSocket() {
  socket = io({ auth: { token } });
  socket.on('connect', () => {});
  socket.on('message', addMessage);
  socket.on('roomHistory', msgs => {
    document.getElementById('messages').innerHTML = '';
    msgs.forEach(addMessage);
  });
}

function joinRoom(room) {
  if (currentRoom) socket.emit('leaveRoom', currentRoom);
  currentRoom = room;
  document.getElementById('room-title').innerText = room;
  document.getElementById('chat-room').style.display = '';
  // Do NOT hide the room list or chat container
  socket.emit('joinRoom', room);
}

document.getElementById('send-btn').onclick = sendMessage;
document.getElementById('message-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const input = document.getElementById('message-input');
  const msg = input.value.trim();
  if (!msg) return;
  socket.emit('message', { room: currentRoom, content: msg });
  input.value = '';
}

function addMessage(msg) {
  const div = document.createElement('div');
  div.innerHTML = `<span style='color:#64748b;'>[${new Date(msg.timestamp).toLocaleTimeString()}]</span> <b>${escapeHtml(msg.sender)}</b>: ${escapeHtml(msg.content)}`;
  document.getElementById('messages').appendChild(div);
  document.getElementById('messages').scrollTop = 99999;
}

function escapeHtml(text) {
  return text.replace(/[&<>"]/g, function(c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
  });
}

// On page load, restore session if token exists
window.addEventListener('DOMContentLoaded', () => {
  const savedToken = localStorage.getItem('chat_token');
  if (savedToken) {
    token = savedToken;
    show('chat-container');
    loadRooms();
    connectSocket();
  }
});
