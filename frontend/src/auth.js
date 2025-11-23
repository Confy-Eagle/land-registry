// src/auth.js
export function setAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getAuth() {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");
  let user = null;

  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch (err) {
    user = null;
  }

  return { token, user };
}
