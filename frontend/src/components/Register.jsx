import { useState } from "react";
import { Link } from "react-router-dom";

export default function Register({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleRegister = async () => {
    setError("");
    setInfo("");
    try {
      const res = await fetch("http://localhost:5000/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, city }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      // Auto-login after registration
      const loginRes = await fetch("http://localhost:5000/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.error || "Login failed");

      localStorage.setItem("token", loginData.token);
      localStorage.setItem("ethAddress", loginData.user.address);
      onLogin(loginData.token);
    } catch (err) {
      if (err.message.includes("Email already used")) {
        setInfo("You already have an account. ");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="p-8 bg-white shadow-md rounded w-96">
        <h1 className="text-2xl font-bold mb-6">Register</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <input
          type="text"
          placeholder="Name"
          className="w-full p-2 mb-4 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-4 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="text"
          placeholder="City"
          className="w-full p-2 mb-4 border rounded"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button
          onClick={handleRegister}
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Register
        </button>
      
          <div className="text-black-500 mt-2 text-center">You Already have an account? 
             <Link to="/login" className="underline text-blue-500">Login here</Link>
          </div>
        
      </div>
    </div>
  );
}
