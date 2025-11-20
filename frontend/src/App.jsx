import { useState } from "react";
import AddLand from "./components/AddLand";
import TransferProperty from "./components/TransferLand";
import PropertyList from "./components/LandList";
import BuyProperty from "./components/BuyProperty";

export default function App() {
  const [refresh, setRefresh] = useState(false);
  const triggerRefresh = () => setRefresh(prev => !prev);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Land Registry DApp</h1>
      <AddLand onAdd={triggerRefresh} />
      <TransferProperty onTransfer={triggerRefresh} />
      <BuyProperty onBuy={triggerRefresh} />
      <PropertyList key={refresh} refresh={refresh} />
    </div>
  );
}
