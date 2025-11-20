import { useState } from "react";
import LandList from "./components/LandList";
import AddLand from "./components/AddLand";
import TransferLand from "./components/TransferLand";

export default function App() {
  const [refresh, setRefresh] = useState(false);

  const triggerRefresh = () => setRefresh((prev) => !prev);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Land Registry DApp</h1>
      <AddLand onAdd={triggerRefresh} />
      <TransferLand onTransfer={triggerRefresh} />
      <LandList key={refresh} />
    </div>
  );
}
