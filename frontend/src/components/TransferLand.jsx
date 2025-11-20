import { useState } from "react";
import { transferProperty } from "../api/landApi";

export default function TransferProperty({ onTransfer }) {
  const [id, setId] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^0x[a-fA-F0-9]{40}$/.test(newOwner)) {
      setMsg("Invalid Ethereum address");
      return;
    }
    setLoading(true); setMsg("");
    try {
      await transferProperty(Number(id), newOwner);
      setId(""); setNewOwner("");
      setMsg("Property transferred successfully!");
      onTransfer();
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.error || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border mb-4 rounded bg-gray-50">
      <h2 className="text-lg font-bold mb-2">Transfer Property</h2>
      <div className="flex gap-2 flex-col sm:flex-row">
        <input type="number" placeholder="Property ID" value={id} onChange={e => setId(e.target.value)} className="border p-2 rounded" required />
        <input type="text" placeholder="New Owner Address" value={newOwner} onChange={e => setNewOwner(e.target.value)} className="border p-2 rounded" required />
        <button type="submit" disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded">
          {loading ? "Transferring..." : "Transfer"}
        </button>
      </div>
      {msg && <p className="mt-2 text-red-500">{msg}</p>}
    </form>
  );
}
