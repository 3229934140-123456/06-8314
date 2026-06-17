import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "@/store";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Surveys from "@/pages/Surveys";
import CreateSurvey from "@/pages/CreateSurvey";
import SurveyDetail from "@/pages/SurveyDetail";
import Square from "@/pages/Square";
import Review from "@/pages/Review";
import Reports from "@/pages/Reports";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useStore((s) => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useStore((s) => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== "admin") return <Navigate to="/surveys" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/surveys" replace />} />
          <Route path="/surveys" element={<Surveys />} />
          <Route path="/surveys/create" element={<AdminRoute><CreateSurvey /></AdminRoute>} />
          <Route path="/surveys/:id" element={<SurveyDetail />} />
          <Route path="/square" element={<Square />} />
          <Route path="/review" element={<AdminRoute><Review /></AdminRoute>} />
          <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}
