import { Outlet } from "react-router-dom";

export default function InventoryLayout() {
  return (
    <div>
      {/* <h2>Inventory Panel</h2> */}
      <Outlet />
    </div>
  );
}