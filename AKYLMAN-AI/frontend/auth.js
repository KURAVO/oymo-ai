const API_URL = "http://127.0.0.1:8000";

function showError(message) {
    const element =
        document.getElementById("authError");

    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.add("show");
}

async function submitAuth(
    path,
    username,
    password
) {
    const response = await fetch(
        `${API_URL}${path}`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                password: password
            })
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch (_) {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.detail ||
            "Ошибка авторизации."
        );
    }

    if (!data.access_token) {
        throw new Error(
            "Сервер не вернул токен авторизации."
        );
    }

    localStorage.setItem(
        "access_token",
        data.access_token
    );

    localStorage.setItem(
        "user_id",
        String(data.user_id)
    );

    window.location.href =
        "index.html";
}

document
    .querySelector("form")
    ?.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const button =
                document.getElementById(
                    "submitButton"
                );

            const username =
                document.getElementById(
                    "username"
                )?.value.trim();

            const password =
                document.getElementById(
                    "password"
                )?.value;

            if (!username || !password) {
                showError(
                    "Заполните все поля."
                );
                return;
            }

            if (username.length < 3) {
                showError(
                    "Имя пользователя должно содержать минимум 3 символа."
                );
                return;
            }

            if (password.length < 6) {
                showError(
                    "Пароль должен содержать минимум 6 символов."
                );
                return;
            }

            button.disabled = true;

            button.textContent =
                "Создание…";

            try {

                await submitAuth(
                    "/register",
                    username,
                    password
                );

            } catch (error) {

                showError(
                    error.message
                );

                button.disabled = false;

                button.textContent =
                    "Создать аккаунт";
            }
        }
    );