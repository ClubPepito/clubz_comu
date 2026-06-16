import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { AdminLayout, ProtectedRoute } from "@/layouts/AdminLayout"
import Dashboard from "./pages/Dashboard"
import CreateEvent from "./pages/CreateEvent"
import EventDetails from "./pages/EventDetails"
import Events from "./pages/Events"
import Members from "./pages/Members"
import Analytics from "./pages/Analytics"
import CommunitySettings from "./pages/CommunitySettings"
import MembershipRequests from "./pages/MembershipRequests"
import Moderation from "./pages/Moderation"
import Login from "./pages/Login"
import Marketplace from "./pages/Marketplace"
import Developer from "./pages/Developer"
import CliAuth from "./pages/CliAuth"
import { AuthProvider } from "./context/AuthContext"
import { CommunityProvider } from "./context/CommunityContext"

function App() {
  return (
    <Router>
      <AuthProvider>
        <CommunityProvider>
          <Toaster richColors closeButton />
          <AdminLayout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/cli-auth" element={<CliAuth />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
              <Route path="/create/:id" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
              <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
              <Route path="/events/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
              <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
              <Route path="/membership" element={<ProtectedRoute><MembershipRequests /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/moderation" element={<ProtectedRoute><Moderation /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><CommunitySettings /></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
              <Route path="/developer" element={<ProtectedRoute><Developer /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AdminLayout>
        </CommunityProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
