import { useState } from "react";
import axios from "axios";
import { getAuth } from "../auth";
import { useNavigate } from "react-router-dom";

export default function AddProperty() {
  const { user, token } = getAuth();
  const navigate = useNavigate();

  const [plotId, setPlotId] = useState(""); // NEW
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading user...
      </div>
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate required fields
      if (!plotId || !location || !size) {
        setError("Plot ID, Location, and Size are required.");
        setLoading(false);
        return;
      }

      const propertyData = {
  plotId,
  location,
  size_km2: parseFloat(size),
  price_eth: parseFloat(price) || 0,
};

      const res = await axios.post(
        "http://localhost:5000/api/property/add",
        propertyData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // optional if backend uses JWT
            "Content-Type": "application/json",
          },
        }
      );

      alert("Property added successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Add property error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to add property.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Add Property</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Plot ID"
          value={plotId}
          onChange={(e) => setPlotId(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Size (km²)"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Price (ETH)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
        >
          {loading ? "Adding..." : "Add Property"}
        </button>
      </form>
    </div>
  );
}
