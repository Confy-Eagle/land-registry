import { useEffect, useState } from "react";
import axios from "axios";
import { getAuth } from "../auth";

export default function Dashboard({ onLogout }) {
  const { user } = getAuth();
  const [stats, setStats] = useState({
    totalProperties: 0,
    pendingTransfers: 0,
    verifiedOwners: 0,
    ethereumBalance: 0,
    propertyBalance: 0,
    verified: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading user...</p>
      </div>
    );
  }

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          `http://localhost:5000/api/dashboard/stats?eth_address=${user.eth_address}`
        );
        setStats(res.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard stats.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user.eth_address]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="mb-4 text-red-500 font-semibold">{error}</div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Properties</div>
          <div className="text-2xl font-bold">
            {loading ? "..." : stats.totalProperties}
          </div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Pending Transfers</div>
          <div className="text-2xl font-bold">
            {loading ? "..." : stats.pendingTransfers}
          </div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Verified Owners</div>
          <div className="text-2xl font-bold">
            {loading ? "..." : stats.verifiedOwners}
          </div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Ethereum Balance</div>
          <div className="text-2xl font-bold">
            {loading ? "..." : stats.ethereumBalance} ETH
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Property Balance: {loading ? "..." : stats.propertyBalance}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold mb-2">Account</h3>
          <p>
            <strong>Address:</strong> {user.eth_address}
          </p>
          <p>
            <strong>City:</strong> {user.city}
          </p>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold mb-2">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            <a
              href="/add-property"
              className="bg-blue-500 text-white px-3 py-2 rounded text-center"
            >
              Add Property
            </a>
            <a
              href="/sell-property"
              className="bg-green-500 text-white px-3 py-2 rounded text-center"
            >
              Post For Sale
            </a>
            {!stats.verified && (
              <a
                href="/upload-doc"
                className="bg-gray-700 text-white px-3 py-2 rounded text-center"
              >
                Upload ID
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
