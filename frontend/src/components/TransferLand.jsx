import { useState } from "react";
import { transferProperty } from "../api/landApi";

export default function TransferLand({ onTransfer }) {
  const [plotId, setPlotId] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // For inline errors
  const [success, setSuccess] = useState(""); // Optional success message

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(newOwner)) {
      setError("Please enter a valid Ethereum address (0x followed by 40 hex characters).");
      return;
    }

    if (!plotId || isNaN(plotId)) {
      setError("Please enter a valid plot ID.");
      return;
    }

    setLoading(true);
    try {
      await transferProperty(Number(plotId), newOwner);
      setPlotId("");
      setNewOwner("");
      setSuccess(`Property ${plotId} transferred successfully!`);
      onTransfer(); // refresh the property list or trigger updates
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Failed to transfer property.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border mb-4 rounded bg-gray-50 shadow-sm"
    >
      <h2 className="text-lg font-bold mb-2">Transfer Property</h2>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          type="number"
          placeholder="Plot ID"
          value={plotId}
          onChange={(e) => setPlotId(e.target.value)}
          className="border p-2 rounded w-full sm:w-32"
          required
        />
        <input
          type="text"
          placeholder="New Owner Address"
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          className="border p-2 rounded w-full sm:w-64"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded mt-2 sm:mt-0"
        >
          {loading ? "Transferring..." : "Transfer"}
        </button>
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">{success}</p>}
    </form>
  );
}
