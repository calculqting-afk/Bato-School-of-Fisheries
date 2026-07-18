import { auth } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginSubmitBtn = document.getElementById("login-submit-btn");
const loginPassword = document.getElementById("login-password");
const togglePasswordBtn = document.getElementById("toggle-password-btn");
const showIcon = togglePasswordBtn.querySelector(".admin-password-icon--show");
const hideIcon = togglePasswordBtn.querySelector(".admin-password-icon--hide");

onAuthStateChanged(auth, function (user) {
  if (user) {
    window.location.replace("admin.html");
  }
});

togglePasswordBtn.addEventListener("click", function () {
  var isHidden = loginPassword.type === "password";
  loginPassword.type = isHidden ? "text" : "password";
  togglePasswordBtn.setAttribute("aria-pressed", isHidden ? "true" : "false");
  togglePasswordBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  togglePasswordBtn.title = isHidden ? "Hide password" : "Show password";
  showIcon.hidden = isHidden;
  hideIcon.hidden = !isHidden;
});

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();
  loginError.hidden = true;
  loginSubmitBtn.disabled = true;
  loginSubmitBtn.textContent = "Signing in...";

  var email = document.getElementById("login-email").value.trim();
  var password = loginPassword.value;

  signInWithEmailAndPassword(auth, email, password)
    .catch(function (error) {
      loginError.textContent = error.code === "auth/invalid-credential"
        ? "Invalid email or password. Please try again."
        : "Sign in failed. Please try again.";
      loginError.hidden = false;
    })
    .finally(function () {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.textContent = "Sign In";
    });
});
