const signUpButton = document.getElementById("sign-up-button");
const loginButton = document.getElementById("login-button");
const loginForm = document.getElementById("login_form");

const signUpUsername = document.getElementById("sign_up_username");
const signUpPassword = document.getElementById("sign_up_password");
const signUpConfirmPassword = document.getElementById(
  "sign_up_confirm_password"
);

const loginUsername = document.getElementById("login_username");
const loginPassword = document.getElementById("login_password");

if (loginButton) {
  loginButton.addEventListener("click", login);
}

if (signUpButton) {
  signUpButton.addEventListener("click", register);
}

// {
//   "users": [
//     {
//       "id": 1,
//       "username": "moataz",
//       "password": "hashed_password",
//       "notes": [
//         {
//           "id": 101,
//           "title": "First note",
//           "content": "Hello world",
//           "createdAt": "2026-01-01",
//           "updatedAt": "2026-01-02"
//         },
//         {
//           "id": 102,
//           "title": "Second note",
//           "content": "Another note",
//           "createdAt": "2026-01-03",
//           "updatedAt": "2026-01-03"
//         }
//       ]
//     }
//   ]
// }

function register() {
  const username = signUpUsername.value;
  const password = signUpPassword.value;
  const confirmPassword = signUpConfirmPassword.value;

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    signUpConfirmPassword.value = "";
    signUpConfirmPassword.focus();
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const existingUser = users.find((user) => user.username === username);

  if (existingUser) {
    alert("User already exists");
    return;
  }

  if (password.length < 8) {
    alert("Password must be at least 8 characters long");
    return;
  }

  const id = users.length + 1;

  const user = {
    id,
    username,
    password,
    notes: [],
  };

  users.push(user);
  localStorage.setItem("users", JSON.stringify(users));
  alert("User registered successfully");
}

function login() {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
  });

  const username = loginUsername.value;
  const password = loginPassword.value;

  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const user = users.find((user) => user.username === username);

  if (!user) {
    alert("User not found");
    return;
  }

  if (user.password !== password) {
    alert("Incorrect password");
    return;
  }

  localStorage.setItem("current_user", JSON.stringify(user.id));
  loginForm.submit();
}
