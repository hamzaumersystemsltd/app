import { Outlet } from "react-router-dom";

export default function VendorLayout() {
  return (
    <div>
      {/* <h2>Vendor Panel</h2> */}
      <Outlet />
    </div>
  );
}