document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // LOG IN USERNAME AND PS
  if (username === "admin" && password === "admin123") {
    sessionStorage.setItem("adminLoggedIn", "true");
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid username or password");
  }
});
 

