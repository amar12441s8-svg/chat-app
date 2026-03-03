const socket = io();

let name;
let room;

// JOIN
document.getElementById("joinForm").addEventListener("submit", (e) => {
    e.preventDefault();

    name = document.getElementById("name").value;
    room = document.getElementById("room").value;

    socket.emit("joinRoom", { name, room });

    document.getElementById("joinPage").style.display = "none";
    document.getElementById("chatPage").style.display = "block";
});

// RECEIVE MESSAGE
socket.on("message", (data) => {

    const messages = document.getElementById("messages");
    const div = document.createElement("div");

    const id = data._id ? data._id.toString() : "";

    if (id) {
        div.setAttribute("data-id", id);
    }

    let html = `<b>${data.name}</b><br>${data.text}`;

    if (id && data.name === name) {
        html += `
        <br>
        <button onclick="deleteMsg('${id}')"
        style="background:red;color:white;border:none;padding:5px;">
        Delete
        </button>`;
    }

    div.innerHTML = html;

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
});

// DELETE FUNCTION
function deleteMsg(id) {
    socket.emit("deleteMessage", id);
}

// REMOVE MESSAGE FROM UI
socket.on("messageDeleted", (id) => {

    const messageElement = document.querySelector(
        `[data-id="${id}"]`
    );

    if (messageElement) {
        messageElement.remove();
    }
});

// SEND MESSAGE
function sendMessage() {

    const input = document.getElementById("messageInput");
    const message = input.value;

    if (!message) return;

    socket.emit("sendMessage", { message });

    input.value = "";
}

// ENTER KEY
document.getElementById("messageInput")
.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});