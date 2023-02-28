const FSDB = require("file-system-db");
require("dotenv").config();
const db = new FSDB("secret.json", true);
getProfile();

document.getElementById("submit").addEventListener("click", (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const client_id = process.env.CLIENT_ID;
    const client_secret = process.env.SECRET_KEY;
    const grant_type = "password";
    const data = { username, password, client_id, client_secret, grant_type };

    login(data);
});

async function login(data) {
    try {
        await fetch(`${process.env.API_URL}/oauth/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then(function (d) {
                if (d.access_token) {
                    db.set("token", d.access_token);
                    alert("Login success");
                    getProfile();
                } else {
                    db.set("token", null);
                    alert("Login failed");
                }
            });
    } catch (error) {
        alert("Request failed", error);
    }
}

async function getProfile() {
    try {
        await fetch(`${process.env.API_URL}/user/profile`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${db.get("token")}`,
            }
        }).then((response) => response.json())
            .then(function (d) {
                if (d.id) {
                    document.getElementById("login-form").style.display = "none";
                    document.getElementById("profile").style.display = "block";
                    document.getElementById("profile-name").innerHTML = d.name;
                }else{
                    document.getElementById("login-form").style.display = "block";
                    document.getElementById("profile").style.display = "none";
                }
            });
    } catch (error) {
        console.log("Request failed", error);
    }
}