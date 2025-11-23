import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuth } from "../auth";

export default function SellProperty() {
  const { user } = getAuth();
  const navigate = useNavigate();
  const [propertyId, setPropertyId] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  const handleSell = async () => {
    try {
      await axios.post("http://localhost:5000/api/property/sell", {
        id: propertyId,
        owner: user.eth_address,
        price
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to post for sale");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="p-8 bg-white shadow-md rounded w-96">
        <h1 className="text-2xl font-bold mb-4">Post Property For Sale</h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input placeholder="Property ID" className="w-full p-2 mb-2 border rounded" value={propertyId} onChange={e => setPropertyId(e.target.value)} />
        <input placeholder="Price (ETH)" className="w-full p-2 mb-2 border rounded" value={price} onChange={e => setPrice(e.target.value)} />
        <button onClick={handleSell} className="w-full bg-green-500 text-white p-2 rounded mt-2">Post For Sale</button>
      </div>
    </div>
  );
}
