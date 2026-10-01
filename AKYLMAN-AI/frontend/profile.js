const userId =
    localStorage.getItem("user_id");

const token =
    localStorage.getItem("access_token");


if (!userId || !token) {

    window.location.href =
        "login.html";

}


const userIdElement =
    document.getElementById(
        "userId"
    );


const usernameElement =
    document.getElementById(
        "username"
    );


const passwordForm =
    document.getElementById(
        "passwordForm"
    );


const messageElement =
    document.getElementById(
        "message"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const backButton =
    document.getElementById(
        "backButton"
    );


/* =========================
   ЗАГРУЗКА ПРОФИЛЯ
========================= */

async function loadProfile() {

    try {

        const response =
            await fetch(
                "http://127.0.0.1:8000/profile",
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            messageElement.textContent =
                data.detail ||
                "Не удалось загрузить профиль.";

            return;

        }


        userIdElement.textContent =
            data.id;


        usernameElement.textContent =
            data.username;


    } catch (error) {

        messageElement.textContent =
            "Не удалось подключиться к серверу.";

    }

}


/* =========================
   СМЕНА ПАРОЛЯ
========================= */

passwordForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const oldPassword =
            document.getElementById(
                "oldPassword"
            ).value;


        const newPassword =
            document.getElementById(
                "newPassword"
            ).value;


        const confirmPassword =
            document.getElementById(
                "confirmPassword"
            ).value;


        if (
            newPassword !==
            confirmPassword
        ) {

            messageElement.textContent =
                "Новые пароли не совпадают.";

            return;

        }


        if (newPassword.length < 6) {

            messageElement.textContent =
                "Новый пароль должен содержать минимум 6 символов.";

            return;

        }


        try {

            const response =
                await fetch(
                    "http://127.0.0.1:8000/change-password",
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`

                        },

                        body:
                            JSON.stringify({

                                old_password:
                                    oldPassword,

                                new_password:
                                    newPassword

                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                messageElement.textContent =
                    data.detail ||
                    "Не удалось изменить пароль.";

                return;

            }


            messageElement.textContent =
                "Пароль успешно изменён.";


            passwordForm.reset();


        } catch (error) {

            messageElement.textContent =
                "Не удалось подключиться к серверу.";

        }

    }
);


/* =========================
   ВОЗВРАТ К ЧАТАМ
========================= */

backButton.addEventListener(
    "click",
    function () {

        window.location.href =
            "index.html";

    }
);


/* =========================
   ВЫХОД
========================= */

logoutButton.addEventListener(
    "click",
    function () {

        localStorage.removeItem(
            "user_id"
        );

        localStorage.removeItem(
            "access_token"
        );


        window.location.href =
            "login.html";

    }
);


/* =========================
   ЗАПУСК
========================= */

loadProfile();