
import { Link, Navigate, Route, Routes } from "react-router-dom";

import {
  GuestRoute,
  ProtectedRoute,
} from "./components/RouteGuards.jsx";

import AppLayout from "./components/AppLayout.jsx";
import { useAuth } from "./hooks/useAuth.js";

// Authentication and onboarding
import BusinessSetup from "./pages/BusinessSetup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Ledger from "./pages/Ledger.jsx";
import Reports from "./pages/Reports.jsx";
import Integrations from "./pages/Integrations.jsx";
import Settings from "./pages/Settings.jsx";
import ManageAccess from "./pages/ManageAccess.jsx";

import ForgotPassword from "./pages/ForgotPassword.jsx";
import Login from "./pages/Login.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import OnboardingSuccess from "./pages/OnboardingSuccess.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import RoleSelection from "./pages/RoleSelection.jsx";
import SageConnection from "./pages/SageConnection.jsx";
import Signup from "./pages/Signup.jsx";

// Transactions
import NewTransaction from "./pages/transactions/NewTransaction.jsx";
import ManualTransaction from "./pages/transactions/ManualTransaction.jsx";
import VoiceCapture from "./pages/transactions/VoiceCapture.jsx";
import Clarification from "./pages/transactions/Clarification.jsx";
import TransactionReview from "./pages/transactions/TransactionReview.jsx";
import TransactionSuccess from "./pages/transactions/TransactionSuccess.jsx";
import TransactionHistory from "./pages/transactions/TransactionHistory.jsx";
import TransactionDetails from "./pages/transactions/TransactionDetails.jsx";

// Accountant
import AccountantDashboard from "./pages/accountant/AccountantDashboard.jsx";
import AccountantProfile from "./pages/accountant/AccountantProfile.jsx";
import ApprovedTransactions from "./pages/accountant/ApprovedTransactions.jsx";
import ClientManagement from "./pages/accountant/Clients.jsx";
import ClientDetails from "./pages/accountant/ClientDetails.jsx";
import ReturnedTransactions from "./pages/accountant/ReturnedTransactions.jsx";
import AccountantTransactionReview from "./pages/accountant/TransactionReview.jsx";
import AccountantIntegrations from "./pages/accountant/AccountantIntegrations.jsx";
import AuditorProfile from "./pages/auditor/AuditorProfile.jsx";

// Auditor
import AuditorDashboard from "./pages/auditor/AuditorDashboard.jsx";
import AuditorSettings from "./pages/auditor/AuditorSettings.jsx";
import AuditorBusinesses from "./pages/auditor/AuditorBusinesses.jsx";
import AuditorTransactions from "./pages/auditor/AuditorTransactions.jsx";
import AuditorAuditTrail from "./pages/auditor/AuditorAuditTrail.jsx";


const guest = (element) => (
  <GuestRoute>{element}</GuestRoute>
);

const onboarding = (element) => (
  <ProtectedRoute requireOnboarded={false}>
    {element}
  </ProtectedRoute>
);

function getDashboardPath(role) {
  if (role === "accountant") return "/accountant";
  if (role === "auditor") return "/auditor";

  return "/dashboard";
}

// Front-end role guard. Backend authorization remains required.
function RoleGuard({ roles, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return (
      <Navigate
        to={getDashboardPath(user.role)}
        replace
      />
    );
  }

  return children;
}

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <Navigate
      to={getDashboardPath(user.role)}
      replace
    />
  );
}

function NotFound() {
  const { user } = useAuth();

  const destination = user
    ? getDashboardPath(user.role)
    : "/login";

  return (
    <main className="notfound">
      <h1>Page not found</h1>
      <p>
        The page you're looking for doesn't exist.{" "}
        <Link to={destination}>
          Go to your dashboard
        </Link>
      </p>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public authentication */}
      <Route path="/login" element={guest(<Login />)} />
      <Route path="/signup" element={guest(<Signup />)} />
      <Route
        path="/signup/role"
        element={guest(<RoleSelection />)}
      />
      <Route
        path="/signup/business"
        element={guest(<BusinessSetup />)}
      />
      <Route
        path="/forgot-password"
        element={guest(<ForgotPassword />)}
      />
      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={onboarding(<Onboarding />)}
      />
      <Route
        path="/onboarding/sage"
        element={onboarding(
          <RoleGuard roles={["business_owner"]}>
            <SageConnection />
          </RoleGuard>
        )}
      />
      <Route
        path="/onboarding/success"
        element={
          <ProtectedRoute>
            <OnboardingSuccess />
          </ProtectedRoute>
        }
      />
  
      
<Route
  path="/manage-access"
  element={
    <RoleGuard roles={["business_owner"]}>
      <ManageAccess />
    </RoleGuard>
  }
/>


<Route
  path="/auditor/businesses"
  element={
    <RoleGuard roles={["auditor"]}>
      <AuditorBusinesses />
    </RoleGuard>
  }
/>

<Route
  path="/auditor/transactions"
  element={
    <RoleGuard roles={["auditor"]}>
      <AuditorTransactions />
    </RoleGuard>
  }
/>

<Route
  path="/auditor/audit-trail"
  element={
    <RoleGuard roles={["auditor"]}>
      <AuditorAuditTrail />
    </RoleGuard>
  }
/>



      {/* Authenticated application */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Business Owner */}
        <Route
          element={
            <RoleGuard roles={["business_owner"]}>
              <Dashboard />
            </RoleGuard>
          }
          path="/dashboard"
        />

        <Route
          path="/transactions/new"
          element={
            <RoleGuard roles={["business_owner"]}>
              <NewTransaction />
            </RoleGuard>
          }
        />

        <Route
          path="/transactions/manual"
          element={
            <RoleGuard roles={["business_owner"]}>
              <ManualTransaction />
            </RoleGuard>
          }
        />

        <Route
          path="/transactions/voice"
          element={
            <RoleGuard roles={["business_owner"]}>
              <VoiceCapture />
            </RoleGuard>
          }
        />

        <Route
          path="/transactions/clarification"
          element={
            <RoleGuard roles={["business_owner"]}>
              <Clarification />
            </RoleGuard>
          }
        />

        <Route
          path="/transactions/review"
          element={
            <RoleGuard roles={["business_owner"]}>
              <TransactionReview />
            </RoleGuard>
          }
        />

        <Route
          path="/transactions/success"
          element={
            <RoleGuard roles={["business_owner"]}>
              <TransactionSuccess />
            </RoleGuard>
          }
        />

        <Route
          path="/transactions"
          element={
            <RoleGuard roles={["business_owner"]}>
              <TransactionHistory />
            </RoleGuard>
          }
        />

        <Route
          path="/transactions/:id"
          element={
            <RoleGuard roles={["business_owner"]}>
              <TransactionDetails />
            </RoleGuard>
          }
        />

        <Route
          path="/ledger"
          element={
            <RoleGuard roles={["business_owner"]}>
              <Ledger />
            </RoleGuard>
          }
        />

        <Route
          path="/reports"
          element={
            <RoleGuard roles={["business_owner"]}>
              <Reports />
            </RoleGuard>
          }
        />

        <Route
          path="/integrations"
          element={
            <RoleGuard roles={["business_owner"]}>
              <Integrations />
            </RoleGuard>
          }
        />

        <Route
          path="/settings"
          element={
            <RoleGuard roles={["business_owner"]}>
              <Settings />
            </RoleGuard>
          }
        />

        {/* Accountant */}
        <Route
          path="/accountant"
          element={
            <RoleGuard roles={["accountant"]}>
              <AccountantDashboard />
            </RoleGuard>
          }
        />

        <Route
          path="/accountant/clients"
          element={
            <RoleGuard roles={["accountant"]}>
              <ClientManagement />
            </RoleGuard>
          }
        />

        <Route
          path="/accountant/clients/:id"
          element={
            <RoleGuard roles={["accountant"]}>
              <ClientDetails />
            </RoleGuard>
          }
        />

        <Route
          path="/accountant/review/:id"
          element={
            <RoleGuard roles={["accountant"]}>
              <AccountantTransactionReview />
            </RoleGuard>
          }
        />

        <Route
          path="/accountant/approved"
          element={
            <RoleGuard roles={["accountant"]}>
              <ApprovedTransactions />
            </RoleGuard>
          }
        />

        <Route
          path="/accountant/returned"
          element={
            <RoleGuard roles={["accountant"]}>
              <ReturnedTransactions />
            </RoleGuard>
          }
        />

        <Route
          path="/accountant/profile"
          element={
            <RoleGuard roles={["accountant"]}>
              <AccountantProfile />
            </RoleGuard>
          }
        />

        {/* Auditor placeholder */}
        <Route
          path="/auditor"
          element={
            <RoleGuard roles={["auditor"]}>
              <AuditorDashboard />
            </RoleGuard>
          }
        />

        
<Route
  path="/auditor/settings"
  element={
    <RoleGuard roles={["auditor"]}>
      <AuditorSettings />
    </RoleGuard>
  }
/>

        
<Route
  path="/auditor/profile"
  element={
    <RoleGuard roles={["auditor"]}>
      <AuditorProfile />
    </RoleGuard>
  }
/>

        <Route
  path="/accountant/integrations"
  element={
    <RoleGuard roles={["accountant"]}>
      <AccountantIntegrations />
    </RoleGuard>
  }
/>


      </Route>

      {/* Default routes */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>



  );
}
