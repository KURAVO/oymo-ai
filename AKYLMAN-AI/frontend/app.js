// ============================================================
// ОЮМО AI — FRONTEND
// ============================================================

const API_URL = "http://127.0.0.1:8000";

// ============================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================

let userId = localStorage.getItem("user_id");
let token = localStorage.getItem("access_token");

let currentChatId = null;

let recognition = null;
let isRecording = false;

// ============================================================
// ПРОВЕРКА АВТОРИЗАЦИИ
// ============================================================

function checkAuth() {
    if (!token || !userId) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

// ============================================================
// ЭЛЕМЕНТЫ
// ============================================================

const chatList =
    document.getElementById("chatList");

const messagesContainer =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const newChatButton =
    document.getElementById("newChatButton");

const fileInput =
    document.getElementById("fileInput");

const uploadButton =
    document.getElementById("uploadButton");

const voiceButton =
    document.getElementById("voiceButton");

// ============================================================
// FILE INPUT
// ============================================================

if (fileInput) {
    fileInput.accept =
        ".txt,.pdf,.docx,.jpg,.jpeg,.png,.webp";
}

// ============================================================
// API REQUEST
// ============================================================

async function apiRequest(endpoint, options = {}) {
    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers["Authorization"] =
            `Bearer ${token}`;
    }

    try {
        const response = await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "user_id"
            );

            window.location.href =
                "login.html";

            return null;
        }

        return response;

    } catch (error) {
        console.error(
            "API ERROR:",
            error
        );

        throw error;
    }
}

// ============================================================
// ДОБАВЛЕНИЕ СООБЩЕНИЯ
// ============================================================

function addMessage(role, content) {
    if (!messagesContainer) {
        return;
    }

    const messageElement =
        document.createElement("div");

    messageElement.className =
        `message ${role}`;

    const nameElement =
        document.createElement("div");

    nameElement.className =
        "name";

    nameElement.textContent =
        role === "user"
            ? "Вы"
            : "ОЮМО AI";

    const bubbleElement =
        document.createElement("div");

    bubbleElement.className =
        "bubble";

    bubbleElement.textContent =
        content;

    messageElement.appendChild(
        nameElement
    );

    messageElement.appendChild(
        bubbleElement
    );

    messagesContainer.appendChild(
        messageElement
    );

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;

    return messageElement;
}

// ============================================================
// ПРИВЕТСТВИЕ
// ============================================================

function showWelcomeMessage() {
    if (!messagesContainer) {
        return;
    }

    messagesContainer.innerHTML = "";

    addMessage(
        "assistant",
        "Привет! Я ОЮМО AI. Задай мне любой вопрос."
    );
}

// ============================================================
// ЗАГРУЗКА ЧАТОВ
// ============================================================

async function loadChats() {
    if (!checkAuth()) {
        return;
    }

    try {
        const response =
            await apiRequest(
                `/chats/${userId}`
            );

        if (!response) {
            return;
        }

        if (!response.ok) {
            console.error(
                "Ошибка загрузки чатов:",
                response.status
            );

            return;
        }

        const chats =
            await response.json();

        renderChatList(chats);

    } catch (error) {
        console.error(
            "Ошибка загрузки чатов:",
            error
        );
    }
}

// ============================================================
// СПИСОК ЧАТОВ
// ============================================================

function renderChatList(chats) {
    if (!chatList) {
        return;
    }

    chatList.innerHTML = "";

    if (
        !Array.isArray(chats) ||
        chats.length === 0
    ) {
        return;
    }

    chats.forEach(chat => {
        const chatElement =
            document.createElement("div");

        chatElement.className =
            "chat-item";

        chatElement.dataset.chatId =
            chat.id;

        const titleButton =
            document.createElement("button");

        titleButton.type =
            "button";

        titleButton.className =
            "chat-item-title";

        titleButton.textContent =
            chat.title ||
            "Новый чат";

        titleButton.addEventListener(
            "click",
            () => {
                openChat(chat.id);
            }
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.type =
            "button";

        deleteButton.className =
            "chat-delete";

        deleteButton.textContent =
            "×";

        deleteButton.title =
            "Удалить чат";

        deleteButton.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                deleteChat(chat.id);
            }
        );

        chatElement.appendChild(
            titleButton
        );

        chatElement.appendChild(
            deleteButton
        );

        chatList.appendChild(
            chatElement
        );
    });

    if (currentChatId) {
        setActiveChat(
            currentChatId
        );
    }
}

// ============================================================
// СОЗДАНИЕ ЧАТА
// ============================================================

async function createChat() {
    if (!checkAuth()) {
        return null;
    }

    try {
        const response =
            await apiRequest(
                "/chats",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        user_id:
                            Number(userId),

                        title:
                            "Новый чат"
                    })
                }
            );

        if (!response) {
            return null;
        }

        if (!response.ok) {
            const errorText =
                await response.text();

            console.error(
                "Ошибка создания чата:",
                errorText
            );

            return null;
        }

        const chat =
            await response.json();

        currentChatId =
            Number(chat.id);

        await loadChats();

        showWelcomeMessage();

        setActiveChat(
            currentChatId
        );

        return currentChatId;

    } catch (error) {
        console.error(
            "Ошибка создания чата:",
            error
        );

        return null;
    }
}

// ============================================================
// ОТКРЫТИЕ ЧАТА
// ============================================================

async function openChat(chatId) {
    if (!checkAuth()) {
        return;
    }

    currentChatId =
        Number(chatId);

    setActiveChat(
        currentChatId
    );

    if (messagesContainer) {
        messagesContainer.innerHTML = "";
    }

    try {
        const response =
            await apiRequest(
                `/chats/${currentChatId}/messages`
            );

        if (!response) {
            return;
        }

        if (!response.ok) {
            console.error(
                "Ошибка загрузки сообщений:",
                response.status
            );

            showWelcomeMessage();

            return;
        }

        const messages =
            await response.json();

        if (
            !Array.isArray(messages) ||
            messages.length === 0
        ) {
            showWelcomeMessage();

            return;
        }

        messages.forEach(message => {
            const role =
                message.role === "user"
                    ? "user"
                    : "assistant";

            addMessage(
                role,
                message.content || ""
            );
        });

    } catch (error) {
        console.error(
            "Ошибка открытия чата:",
            error
        );

        addMessage(
            "assistant",
            "Не удалось загрузить сообщения."
        );
    }
}

// ============================================================
// АКТИВНЫЙ ЧАТ
// ============================================================

function setActiveChat(chatId) {
    if (!chatList) {
        return;
    }

    const items =
        chatList.querySelectorAll(
            ".chat-item"
        );

    items.forEach(item => {
        const itemId =
            Number(
                item.dataset.chatId
            );

        item.classList.toggle(
            "active",
            itemId === Number(chatId)
        );
    });
}

// ============================================================
// ИНДИКАТОР ПЕЧАТИ
// ============================================================

function showTypingIndicator() {
    if (!messagesContainer) {
        return null;
    }

    const element =
        document.createElement("div");

    element.className =
        "message assistant";

    element.dataset.typing =
        "true";

    const name =
        document.createElement("div");

    name.className =
        "name";

    name.textContent =
        "ОЮМО AI";

    const bubble =
        document.createElement("div");

    bubble.className =
        "bubble";

    bubble.textContent =
        "ОЮМО AI печатает...";

    element.appendChild(
        name
    );

    element.appendChild(
        bubble
    );

    messagesContainer.appendChild(
        element
    );

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;

    return element;
}

// ============================================================
// ОТПРАВКА СООБЩЕНИЯ
// ============================================================

async function sendMessage() {
    if (!checkAuth()) {
        return;
    }

    if (!messageInput) {
        return;
    }

    const message =
        messageInput.value.trim();

    if (!message) {
        return;
    }

    if (sendButton) {
        sendButton.disabled = true;
    }

    try {
        // ----------------------------------------------------
        // ЕСЛИ ЧАТА НЕТ — СОЗДАЁМ
        // ----------------------------------------------------

        if (!currentChatId) {
            await createChat();
        }

        if (!currentChatId) {
            addMessage(
                "assistant",
                "Не удалось создать чат."
            );

            return;
        }

        // ----------------------------------------------------
        // СРАЗУ ПОКАЗЫВАЕМ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ
        // ----------------------------------------------------

        addMessage(
            "user",
            message
        );

        // ----------------------------------------------------
        // ОЧИЩАЕМ INPUT
        // ----------------------------------------------------

        messageInput.value = "";

        // ----------------------------------------------------
        // ПОКАЗЫВАЕМ ОЮМО AI ПЕЧАТАЕТ
        // ----------------------------------------------------

        const typingElement =
            showTypingIndicator();

        // ----------------------------------------------------
        // ЗАПРОС К BACKEND
        // ----------------------------------------------------

        const response =
            await apiRequest(
                "/api/v1/ai/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message:
                            message,

                        chat_id:
                            Number(
                                currentChatId
                            )
                    })
                }
            );

        // ----------------------------------------------------
        // УДАЛЯЕМ ИНДИКАТОР
        // ----------------------------------------------------

        if (typingElement) {
            typingElement.remove();
        }

        if (!response) {
            return;
        }

        // ----------------------------------------------------
        // ОШИБКА BACKEND
        // ----------------------------------------------------

        if (!response.ok) {
            let errorMessage =
                "ОЮМО AI не смог обработать запрос.";

            try {
                const errorData =
                    await response.json();

                if (errorData.detail) {
                    errorMessage =
                        errorData.detail;
                }

            } catch (error) {
                console.error(
                    "Ошибка чтения ошибки API:",
                    error
                );
            }

            addMessage(
                "assistant",
                errorMessage
            );

            return;
        }

        // ----------------------------------------------------
        // ОТВЕТ ОЮМО AI
        // ----------------------------------------------------

        const data =
            await response.json();

        console.log(
            "ОЮМО AI RESPONSE:",
            data
        );

        const answer =
            data.message ||
            data.answer ||
            data.response ||
            "ОЮМО AI не получил ответ.";

        addMessage(
            "assistant",
            answer
        );

        // ----------------------------------------------------
        // ОБНОВЛЯЕМ СПИСОК ЧАТОВ
        // ----------------------------------------------------

        await loadChats();

        setActiveChat(
            currentChatId
        );

    } catch (error) {
        console.error(
            "Ошибка отправки сообщения:",
            error
        );

        const typing =
            messagesContainer
                ?.querySelector(
                    '[data-typing="true"]'
                );

        if (typing) {
            typing.remove();
        }

        addMessage(
            "assistant",
            "Не удалось подключиться к ОЮМО AI. Проверь, запущен ли backend."
        );

    } finally {
        if (sendButton) {
            sendButton.disabled = false;
        }

        if (messageInput) {
            messageInput.focus();
        }
    }
}

// ============================================================
// ENTER
// ============================================================

if (messageInput) {
    messageInput.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {
                event.preventDefault();

                sendMessage();
            }
        }
    );
}

// ============================================================
// КНОПКА ОТПРАВКИ
// ============================================================

if (sendButton) {
    sendButton.addEventListener(
        "click",
        sendMessage
    );
}

// ============================================================
// НОВЫЙ ЧАТ
// ============================================================

if (newChatButton) {
    newChatButton.addEventListener(
        "click",
        createChat
    );
}

// ============================================================
// ЗАГРУЗКА ФАЙЛА
// ============================================================

async function uploadFile() {
    if (!checkAuth()) {
        return;
    }

    if (!fileInput) {
        return;
    }

    const file =
        fileInput.files[0];

    if (!file) {
        return;
    }

    try {
        if (!currentChatId) {
            await createChat();
        }

        if (!currentChatId) {
            return;
        }

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );

        if (uploadButton) {
            uploadButton.disabled =
                true;
        }

        const response =
            await apiRequest(
                `/upload?chat_id=${currentChatId}`,
                {
                    method: "POST",
                    body: formData
                }
            );

        if (!response) {
            return;
        }

        if (!response.ok) {
            let errorMessage =
                "Не удалось загрузить файл.";

            try {
                const data =
                    await response.json();

                if (data.detail) {
                    errorMessage =
                        data.detail;
                }

            } catch (error) {
                console.error(
                    "Ошибка чтения ответа:",
                    error
                );
            }

            addMessage(
                "assistant",
                errorMessage
            );

            return;
        }

        addMessage(
            "assistant",
            `Файл «${file.name}» успешно загружен.`
        );

    } catch (error) {
        console.error(
            "Ошибка загрузки файла:",
            error
        );

        addMessage(
            "assistant",
            "Ошибка при загрузке файла."
        );

    } finally {
        fileInput.value = "";

        if (uploadButton) {
            uploadButton.disabled =
                false;
        }
    }
}

// ============================================================
// КНОПКА ФАЙЛА
// ============================================================

if (uploadButton) {
    uploadButton.addEventListener(
        "click",
        () => {
            if (fileInput) {
                fileInput.click();
            }
        }
    );
}

// ============================================================
// ВЫБОР ФАЙЛА
// ============================================================

if (fileInput) {
    fileInput.addEventListener(
        "change",
        async () => {
            if (
                fileInput.files &&
                fileInput.files.length > 0
            ) {
                await uploadFile();
            }
        }
    );
}

// ============================================================
// ГОЛОСОВОЙ ВВОД
// ============================================================

function setupVoiceRecognition() {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        if (voiceButton) {
            voiceButton.style.display =
                "none";
        }

        return;
    }

    recognition =
        new SpeechRecognition();

    recognition.continuous =
        false;

    recognition.interimResults =
        true;

    recognition.lang =
        "ru-RU";

    recognition.onstart = () => {
        isRecording = true;

        if (voiceButton) {
            voiceButton.textContent =
                "⏹️";

            voiceButton.classList.add(
                "recording"
            );
        }
    };

    recognition.onresult =
        event => {
            let transcript = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                transcript +=
                    event.results[i][0]
                        .transcript;
            }

            if (messageInput) {
                messageInput.value =
                    transcript;
            }
        };

    recognition.onerror =
        event => {
            console.error(
                "Voice error:",
                event.error
            );

            isRecording = false;

            if (voiceButton) {
                voiceButton.textContent =
                    "🎤";

                voiceButton.classList.remove(
                    "recording"
                );
            }
        };

    recognition.onend =
        () => {
            isRecording = false;

            if (voiceButton) {
                voiceButton.textContent =
                    "🎤";

                voiceButton.classList.remove(
                    "recording"
                );
            }
        };
}

// ============================================================
// ГОЛОСОВАЯ КНОПКА
// ============================================================

if (voiceButton) {
    setupVoiceRecognition();

    voiceButton.addEventListener(
        "click",
        () => {
            if (!recognition) {
                return;
            }

            if (isRecording) {
                recognition.stop();

                return;
            }

            try {
                recognition.start();

            } catch (error) {
                console.error(
                    "Ошибка запуска микрофона:",
                    error
                );
            }
        }
    );
}

// ============================================================
// ОЗВУЧИВАНИЕ
// ============================================================

function detectSpeechLanguage(text) {
    if (!text) {
        return "ru-RU";
    }

    const kyrgyzPattern =
        /[ңөүҗқғ]/i;

    if (
        kyrgyzPattern.test(text)
    ) {
        return "ky-KG";
    }

    const englishPattern =
        /^[A-Za-z0-9\s.,!?'"-]+$/;

    if (
        englishPattern.test(
            text.trim()
        )
    ) {
        return "en-US";
    }

    return "ru-RU";
}

function speakText(text) {
    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }

    if (!text) {
        return;
    }

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(
            text
        );

    speech.lang =
        detectSpeechLanguage(
            text
        );

    speech.rate =
        1;

    speech.pitch =
        1;

    window.speechSynthesis.speak(
        speech
    );
}

// ============================================================
// УДАЛЕНИЕ ЧАТА
// ============================================================

async function deleteChat(chatId) {
    if (!checkAuth()) {
        return;
    }

    if (!chatId) {
        return;
    }

    try {
        const response =
            await apiRequest(
                `/chats/${chatId}`,
                {
                    method: "DELETE"
                }
            );

        if (!response) {
            return;
        }

        if (!response.ok) {
            console.error(
                "Ошибка удаления чата:",
                response.status
            );

            return;
        }

        if (
            Number(currentChatId) ===
            Number(chatId)
        ) {
            currentChatId =
                null;

            showWelcomeMessage();
        }

        await loadChats();

    } catch (error) {
        console.error(
            "Ошибка удаления:",
            error
        );
    }
}

// ============================================================
// ПРОФИЛЬ
// ============================================================

function openProfile() {
    window.location.href =
        "profile.html";
}

// ============================================================
// ВЫХОД
// ============================================================

function logout() {
    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "user_id"
    );

    window.location.href =
        "login.html";
}

// ============================================================
// ПРОВЕРКА OYMO API
// ============================================================

async function checkOymoStatus() {
    try {
        const response =
            await fetch(
                `${API_URL}/api/v1/ai/status`
            );

        if (!response.ok) {
            return false;
        }

        const data =
            await response.json();

        console.log(
            "ОЮМО AI STATUS:",
            data
        );

        return true;

    } catch (error) {
        console.error(
            "ОЮМО API недоступен:",
            error
        );

        return false;
    }
}

// ============================================================
// ГОРЯЧИЕ КНОПКИ
// ============================================================

document.addEventListener(
    "keydown",
    event => {
        if (
            event.ctrlKey &&
            event.key === "Enter"
        ) {
            event.preventDefault();

            sendMessage();
        }

        if (
            event.key === "Escape" &&
            isRecording &&
            recognition
        ) {
            recognition.stop();
        }
    }
);

// ============================================================
// ЗАПУСК
// ============================================================

async function init() {
    if (!checkAuth()) {
        return;
    }

    await loadChats();

    await checkOymoStatus();

    if (!currentChatId) {
        showWelcomeMessage();
    }

    if (messageInput) {
        messageInput.focus();
    }

    console.log(
        "ОЮМО AI frontend: запущен"
    );
}

init();