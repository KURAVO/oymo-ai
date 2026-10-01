// ============================================================
// ДОБАВЛЕНИЕ СООБЩЕНИЯ
// ============================================================
function addMessage(role, content) {
    if (!messagesContainer) {
        return;
    }

    const messageElement = document.createElement("div");

    messageElement.className =
        `message ${role}`;

    const sender = document.createElement("div");

    sender.className =
        "name";

    sender.textContent =
        role === "user"
            ? "Вы"
            : "ОЮМО AI";

    const bubble = document.createElement("div");

    bubble.className =
        "bubble";

    bubble.textContent =
        content;

    messageElement.appendChild(
        sender
    );

    messageElement.appendChild(
        bubble
    );

    messagesContainer.appendChild(
        messageElement
    );

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;
}
