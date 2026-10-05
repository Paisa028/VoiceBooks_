import {
  Link,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import {
  GuestRoute,
  ProtectedRoute,
} from './components/RouteGuards.jsx';

import AppLayout from './components/AppLayout.jsx';


// ==================================================
// AUTHENTICATION / ONBOARDING
// ==================================================

import BusinessSetup from './pages/BusinessSetup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Ledger from './pages/Ledger.jsx';
import Reports from './pages/Reports.jsx';
import Integrations from './pages/Integrations.jsx';
import Settings from './pages/Settings.jsx';

import ForgotPassword from './pages/ForgotPassword.jsx';
import Login from './pages/Login.jsx';
import Onboarding from './pages/Onboarding.jsx';
import OnboardingSuccess from './pages/OnboardingSuccess.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import RoleSelection from './pages/RoleSelection.jsx';
import SageConnection from './pages/SageConnection.jsx';
import Signup from './pages/Signup.jsx';


// ==================================================
// TRANSACTIONS
// ==================================================

import NewTransaction from './pages/transactions/NewTransaction.jsx';
import ManualTransaction from './pages/transactions/ManualTransaction.jsx';
import VoiceCapture from './pages/transactions/VoiceCapture.jsx';
import Clarification from './pages/transactions/Clarification.jsx';
import TransactionReview from './pages/transactions/TransactionReview.jsx';
import TransactionSuccess from './pages/transactions/TransactionSuccess.jsx';
import TransactionHistory from './pages/transactions/TransactionHistory.jsx';
import TransactionDetails from './pages/transactions/TransactionDetails.jsx';


// ==================================================
// ACCOUNTANT
// ==================================================

import AccountantDashboard from './pages/accountant/AccountantDashboard.jsx';
import AccountantProfile from './pages/accountant/AccountantProfile.jsx';
import ApprovedTransactions from './pages/accountant/ApprovedTransactions.jsx';
import ClientManagement from './pages/accountant/Clients.jsx';
import ClientDetails from './pages/accountant/ClientDetails.jsx';
import ReturnedTransactions from './pages/accountant/ReturnedTransactions.jsx';
import AccountantTransactionReview from './pages/accountant/TransactionReview.jsx';


// ==================================================
// ROUTE HELPERS
// ==================================================

const guest = (element) => (
  <GuestRoute>
    {element}
  </GuestRoute>
);

const onboarding = (element) => (
  <ProtectedRoute requireOnboarded={false}>
    {element}
  </ProtectedRoute>
);


// ==================================================
// APP
// ==================================================

export default function App() {
  return (
    <Routes>

      {/* ==================================================
          PUBLIC / AUTH ROUTES
      ================================================== */}

      <Route
        path="/login"
        element={guest(<Login />)}
      />

      <Route
        path="/signup"
        element={guest(<Signup />)}
      />

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


      {/* ==================================================
          ONBOARDING
      ================================================== */}

      <Route
        path="/onboarding"
        element={onboarding(<Onboarding />)}
      />

      <Route
        path="/onboarding/sage"
        element={onboarding(<SageConnection />)}
      />

      <Route
        path="/onboarding/success"
        element={
          <ProtectedRoute>
            <OnboardingSuccess />
          </ProtectedRoute>
        }
      />


      {/* ==================================================
          BUSINESS OWNER APP
          ALL THESE PAGES USE THE SIDEBAR
      ================================================== */}

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >

        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* ================================================
            TRANSACTIONS
        ================================================ */}

        <Route
          path="/transactions/new"
          element={<NewTransaction />}
        />

        <Route
          path="/transactions/manual"
          element={<ManualTransaction />}
        />

        <Route
          path="/transactions/voice"
          element={<VoiceCapture />}
        />

        <Route
          path="/transactions/clarification"
          element={<Clarification />}
        />

        <Route
          path="/transactions/review"
          element={<TransactionReview />}
        />

        <Route
          path="/transactions/success"
          element={<TransactionSuccess />}
        />

        <Route
          path="/transactions"
          element={<TransactionHistory />}
        />

        <Route
          path="/transactions/:id"
          element={<TransactionDetails />}
        />


        {/* ================================================
            LEDGER
        ================================================ */}

        <Route
          path="/ledger"
          element={<Ledger />}
        />


        {/* ================================================
            REPORTS
        ================================================ */}

        <Route
          path="/reports"
          element={<Reports />}
        />


        {/* ================================================
            INTEGRATIONS
        ================================================ */}

        <Route
          path="/integrations"
          element={<Integrations />}
        />


        {/* ================================================
            SETTINGS
        ================================================ */}

        <Route
          path="/settings"
          element={<Settings />}
        />


        {/* ================================================
            ACCOUNTANT
        ================================================ */}

        <Route
          path="/accountant"
          element={<AccountantDashboard />}
        />

        <Route
          path="/accountant/clients"
          element={<ClientManagement />}
        />

        <Route
          path="/accountant/clients/:id"
          element={<ClientDetails />}
        />

        <Route
          path="/accountant/review/:id"
          element={<AccountantTransactionReview />}
        />

        <Route
          path="/accountant/approved"
          element={<ApprovedTransactions />}
        />

        <Route
          path="/accountant/returned"
          element={<ReturnedTransactions />}
        />

        <Route
          path="/accountant/profile"
          element={<AccountantProfile />}
        />

      </Route>


      {/* ==================================================
          DEFAULT
      ================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <main className="notfound">
            <h1>Page not found</h1>

            <p>
              The page you're looking for doesn't exist.{' '}

              <Link to="/dashboard">
                Go to your dashboard
              </Link>
            </p>
          </main>
        }
      />

    </Routes>
  );
}