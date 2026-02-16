import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminRoute from "./components/Routes/AdminRoute.jsx";
import ProtectedRoute from "./components/Routes/ProtectedRoute.jsx";
import PublicRoute from "./components/Routes/PublicRoute.jsx";
import Register from "./pages/Register/Register.jsx";
import Login from "./pages/Login/Login.jsx";
import Home from "./pages/Home/Home.jsx";
import UserProfile from "./pages/UserProfile/UserProfile.jsx";
import EditProfile from "./pages/UserProfile/EditProfile.jsx";
import Nav from "./components/Nav/Nav.jsx";
import { ToastContainer } from "react-toastify";
import InventoryLayout from "./pages/inventory/InventoryLayout.jsx";
import EditInventory from "./pages/inventory/EditInventory.jsx";
import ViewInventory from "./pages/inventory/ViewInventory.jsx";
import AddInventory from "./pages/inventory/AddInventory.jsx";
import PurchaseInvoice from "./pages/inventory/PurchaseInvoice.jsx";
import InventoryList from "./pages/inventory/InventoryList.jsx";
import VendorLayout from "./pages/vendor/VendorLayout.jsx";
import AddVendor from "./pages/vendor/AddVendor.jsx";
import VendorList from "./pages/vendor/VendorList.jsx";
import EditVendor from "./pages/vendor/EditVendor.jsx";
import ViewVendor from "./pages/vendor/ViewVendor.jsx";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <Router>
      <Nav />

      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        newestOnTop
        theme="colored"
      />

      <Routes>
        {/* ✅ Home */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* ✅ User Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        {/* ✅ Edit Profile */}
        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        {/* ✅ ADMIN: INVENTORY (Nested) */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <InventoryLayout />
              </AdminRoute>
            </ProtectedRoute>
          }
        >
          <Route path="add-inventory" element={<AddInventory />} />
          <Route path="inventory-list" element={<InventoryList />} />
          <Route path="purchase-invoice" element={<PurchaseInvoice />} />
          <Route path="edit/:id" element={<EditInventory />} />
          <Route path="view/:id" element={<ViewInventory />} />
        </Route>

        {/* ✅ ADMIN: VENDOR (Nested) */}
        <Route
          path="/vendor"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <VendorLayout />
              </AdminRoute>
            </ProtectedRoute>
          }
        >
          <Route path="add-vendor" element={<AddVendor />} />
          <Route path="vendor-list" element={<VendorList />} />
          <Route path="edit/:id" element={<EditVendor />} />
          <Route path="view/:id" element={<ViewVendor />} />
        </Route>

        {/* ✅ Public */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* ✅ Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}