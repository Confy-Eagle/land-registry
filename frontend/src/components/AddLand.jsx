import { useState } from "react";
import { addProperty } from "../api/landApi";

export default function AddLand({ onAdd }) {
  const [plotId, setPlotId] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addProperty(Number(plotId), location);
      setPlotId("");
      setLocation("");
      onAdd(); // refresh list
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border mb-4 rounded">
      <h2 className="text-lg font-bold mb-2">Add Property</h2>
      <input
        type="number"
        placeholder="Plot ID"
        value={plotId}
        onChange={(e) => setPlotId(e.target.value)}
        className="border p-2 mr-2 rounded"
        required
      />
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="border p-2 mr-2 rounded"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
