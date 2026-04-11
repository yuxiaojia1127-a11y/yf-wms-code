import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/clients/admin-web/components/layout/AppLayout";
import Home from "@/clients/admin-web/pages/Home";
import ProductModels from "@/clients/admin-web/pages/ProductModels";
import ProductAddons from "@/clients/admin-web/pages/ProductAddons";
import ProductPackages from "@/clients/admin-web/pages/ProductPackages";
import ProductInsurance from "@/clients/admin-web/pages/ProductInsurance";
import OrderManage from "@/clients/admin-web/pages/OrderManage";
import PickReturnCalendar from "@/clients/admin-web/pages/PickReturnCalendar";
import DriverProfile from "@/clients/admin-web/pages/DriverProfile";
import DriverVehicle from "@/clients/admin-web/pages/DriverVehicle";
import DriverContract from "@/clients/admin-web/pages/DriverContract";
import DriverAlert from "@/clients/admin-web/pages/DriverAlert";
import AnalyticsDetail from "@/clients/admin-web/pages/AnalyticsDetail";
import AnalyticsProfit from "@/clients/admin-web/pages/AnalyticsProfit";
import RevenueManagementCalendar from "@/clients/admin-web/pages/RevenueManagementCalendar";
import SystemUsers from "@/clients/admin-web/pages/SystemUsers";
import SystemRoles from "@/clients/admin-web/pages/SystemRoles";
import SystemMenus from "@/clients/admin-web/pages/SystemMenus";
import SystemLogs from "@/clients/admin-web/pages/SystemLogs";
import ReceptionMobileApp from "@/clients/reception-mobile/App";
import DriverMobileApp from "@/clients/driver-mobile/App";
import WebsiteApp from "@/clients/website/App";
import BookingApp from "@/clients/booking/App";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/reception/*" element={<ReceptionMobileApp />} />
        <Route path="/driver/*" element={<DriverMobileApp />} />
        <Route path="/site/*" element={<WebsiteApp />} />
        <Route path="/booking/*" element={<BookingApp />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dispatch/schedule" replace />} />

          <Route path="/product/models" element={<ProductModels />} />
          <Route path="/product/addons" element={<ProductAddons />} />
          <Route path="/product/packages" element={<ProductPackages />} />
          <Route path="/product/insurance" element={<ProductInsurance />} />

          <Route path="/order/manage" element={<OrderManage />} />
          <Route path="/order/pick-return" element={<PickReturnCalendar />} />

          <Route path="/dispatch/schedule" element={<Home />} />
          <Route path="/dispatch/revenue-calendar" element={<RevenueManagementCalendar />} />

          <Route path="/driver/profile" element={<DriverProfile />} />
          <Route path="/driver/vehicle" element={<DriverVehicle />} />
          <Route path="/driver/contract" element={<DriverContract />} />
          <Route path="/driver/alert" element={<DriverAlert />} />

          <Route path="/analytics/detail" element={<AnalyticsDetail />} />
          <Route path="/analytics/profit" element={<AnalyticsProfit />} />

          <Route path="/system/users" element={<SystemUsers />} />
          <Route path="/system/roles" element={<SystemRoles />} />
          <Route path="/system/menus" element={<SystemMenus />} />
          <Route path="/system/logs" element={<SystemLogs />} />

          <Route path="/inventory/schedule" element={<Navigate to="/dispatch/schedule" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/dispatch/schedule" replace />} />
      </Routes>
    </Router>
  );
}
