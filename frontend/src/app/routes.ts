import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import ExplorePage from "./pages/ExplorePage";
import GuidesPage from "./pages/GuidesPage";
import LoginPage from "./pages/LoginPage";
import HelpPage from "./pages/HelpPage";
import ListTourPage from "./pages/ListTourPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import { AppLayout } from "./components/AppLayout";
import { DestinationDetailPage, PackageDetailPage } from "./pages/PlaceDetailPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute, HotelPartnerRoute, StakeholderRoute, TouristRoute, TransportProviderRoute } from "./components/RoleBasedRoute";
import TouristDashboard from "./pages/tourist/TouristDashboard";
import TouristBookingDetail from "./pages/tourist/TouristBookingDetail";
import TouristBookingCreate from "./pages/tourist/TouristBookingCreate";
import TouristAccommodationBooking from "./pages/tourist/TouristAccommodationBooking";
import TouristVehicleBooking from "./pages/tourist/TouristVehicleBooking";
import PlanMyTrip from "./pages/tourist/PlanMyTrip";
import MyTrip from "./pages/tourist/MyTrip";
import ComparePackages from "./pages/tourist/ComparePackages";
import PackageCustomization from "./pages/tourist/PackageCustomization";
import { DashboardLayout } from "./pages/dashboard/DashboardLayout";
import { DashboardHome } from "./pages/dashboard/DashboardHome";
import { AccommodationManagement } from "./pages/dashboard/AccommodationManagement";
import { GuideManagement } from "./pages/dashboard/GuideManagement";
import { BookingManagement } from "./pages/dashboard/BookingManagement";
import { PackageManagement } from "./pages/dashboard/PackageManagement";
import { DestinationManagement } from "./pages/dashboard/DestinationManagement";
import { VehicleRentalManagement } from "./pages/dashboard/VehicleRentalManagement";
import { TouristManagement } from "./pages/dashboard/TouristManagement";
import { AccessControl } from "./pages/dashboard/AccessControl";
import { StakeholderManagement } from "./pages/dashboard/StakeholderManagement";
import { StakeholderProfile } from "./pages/dashboard/StakeholderProfile";
import { PartnerAccommodationBookings } from "./pages/dashboard/PartnerAccommodationBookings";
import { TransportProviderBookings } from "./pages/dashboard/TransportProviderBookings";

export const router = createBrowserRouter([
  {
    Component: AppLayout,
    children: [
      { path: "/", Component: LandingPage },
  { path: "/explore", Component: ExplorePage },
  { path: "/guides", Component: GuidesPage },
  { path: "/compare-packages", Component: ComparePackages },
  { path: "/login", Component: LoginPage },
  { path: "/help", Component: HelpPage },
  { path: "/list-tour", Component: ListTourPage },
  { path: "/destinations/:id", Component: DestinationDetailPage },
  { path: "/packages/:id", Component: PackageDetailPage },
  { path: "/unauthorized", Component: UnauthorizedPage },
  {
    Component: ProtectedRoute,
    children: [
      {
        Component: TouristRoute,
        children: [
          { path: "/tourist/dashboard", Component: TouristDashboard },
          { path: "/tourist/plan", Component: PlanMyTrip },
          { path: "/tourist/my-trip", Component: MyTrip },
          { path: "/tourist/packages/:id/customize", Component: PackageCustomization },
          { path: "/tourist/bookings/new", Component: TouristBookingCreate },
          { path: "/tourist/bookings/:id", Component: TouristBookingDetail },
          { path: "/tourist/accommodations/:id/book", Component: TouristAccommodationBooking },
          { path: "/tourist/vehicles/:id/book", Component: TouristVehicleBooking },
          { path: "/book", Component: TouristBookingCreate },
        ],
      },
      {
        Component: AdminRoute,
        children: [
          {
            path: "/dashboard",
            Component: DashboardLayout,
            children: [
              { index: true, Component: DashboardHome },
              { path: "accommodations", Component: AccommodationManagement },
              { path: "guides", Component: GuideManagement },
              { path: "bookings", Component: BookingManagement },
              { path: "packages", Component: PackageManagement },
              { path: "destinations", Component: DestinationManagement },
              { path: "vehicles", Component: VehicleRentalManagement },
              { path: "tourists", Component: TouristManagement },
              { path: "access-control", Component: AccessControl },
              { path: "stakeholders", Component: StakeholderManagement },
            ],
          },
        ],
      },
      {
        Component: StakeholderRoute,
        children: [{ path: "/stakeholder", Component: DashboardLayout, children: [
          { index: true, Component: StakeholderProfile },
          { path: "profile", Component: StakeholderProfile },
        ] }],
      },
      {
        Component: HotelPartnerRoute,
        children: [{ path: "/stakeholder/accommodations", Component: DashboardLayout, children: [{ index: true, Component: AccommodationManagement }] },
          { path: "/stakeholder/bookings", Component: DashboardLayout, children: [{ index: true, Component: PartnerAccommodationBookings }] }],
      },
      {
        Component: TransportProviderRoute,
        children: [
          { path: "/stakeholder/vehicles", Component: DashboardLayout, children: [{ index: true, Component: VehicleRentalManagement }] },
          { path: "/stakeholder/vehicle-bookings", Component: DashboardLayout, children: [{ index: true, Component: TransportProviderBookings }] },
        ],
      },
    ],
  },
]);
