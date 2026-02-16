import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from '@/pages/Dashboard';
import { Calendar } from '@/pages/Calendar';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[var(--color-bg-primary)] transition-colors duration-300">
        <Navigation />
        <main className="pt-16 min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
