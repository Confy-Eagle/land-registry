import { useState } from "react";
import { buyProperty } from "../api/landApi";

export default function BuyProperty({ onBuy }) {
  const [id, setId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg("");
    try {
      await buyProperty(Number(id), amount);
      setId(""); setAmount("");
      setMsg("Purchase initiated! Waiting for admin confirmation.");
      onBuy();
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.error || "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border mb-4 rounded bg-yellow-50">
      <h2 className="text-lg font-bold mb-2">Buy Property</h2>
      <div className="flex gap-2 flex-col sm:flex-row">
        <input type="number" placeholder="Property ID" value={id} onChange={e => setId(e.target.value)} className="border p-2 rounded" required />
        <input type="text" placeholder="Amount (ETH)" value={amount} onChange={e => setAmount(e.target.value)} className="border p-2 rounded" required />
        <button type="submit" disabled={loading} className="bg-orange-500 text-white px-4 py-2 rounded">
          {loading ? "Buying..." : "Buy"}
        </button>
      </div>
      {msg && <p className="mt-2 text-green-500">{msg}</p>}
    </form>
  );
}
