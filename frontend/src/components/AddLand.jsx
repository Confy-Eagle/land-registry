import { useEffect, useState } from "react";
import { getAllProperties } from "../api/landApi";

export default function PropertyList({ refresh }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getAllProperties();
        setProperties(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [refresh]);

  if (loading) return <p>Loading properties...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">All Properties</h2>
      {properties.length === 0 ? (
        <p>No properties found.</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Area</th>
              <th className="px-4 py-2">Price (ETH)</th>
              <th className="px-4 py-2">Owner</th>
              <th className="px-4 py-2">For Sale</th>
            </tr>
          </thead>
          <tbody>
            {properties.map(p => (
              <tr key={p.id} className="border-b">
                <td className="px-4 py-2">{p.id}</td>
                <td className="px-4 py-2">{p.location}</td>
                <td className="px-4 py-2">{p.area}</td>
                <td className="px-4 py-2">{p.price}</td>
                <td className="px-4 py-2">{p.owner}</td>
                <td className="px-4 py-2">{p.forSale ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
