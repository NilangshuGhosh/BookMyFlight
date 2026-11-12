import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import { Plane, Shield, MapPin, Ticket } from 'lucide-react';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminAirportsPage from './pages/AdminAirportsPage';
import AdminBookingsPage from './pages/AdminBookingsPage';

// --- NAVBAR ---
const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    
    return (
        <nav className="flex items-center justify-between p-4 bg-white shadow-sm border-b">
            <Link to="/" className="flex items-center space-x-2 text-blue-600 font-bold text-xl">
                <Plane className="w-6 h-6" />
                <span>Book My Flight</span>
            </Link>
            <div>
                {user ? (
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Hi, {user.email}</span>
                        
                        {/* Show Admin Links ONLY if user is an ADMIN */}
                        {user.role === 'ADMIN' && (
                            <>
                                <Link to="/admin" className="text-red-600 flex items-center hover:text-red-700 font-medium text-sm">
                                    <Shield className="w-4 h-4 mr-1" /> Admin
                                </Link>
                                <Link to="/admin/airports" className="text-red-600 flex items-center hover:text-red-700 font-medium text-sm">
                                    <MapPin className="w-4 h-4 mr-1" /> Airports
                                </Link>
                                <Link to="/admin/bookings" className="text-red-600 flex items-center hover:text-red-700 font-medium text-sm">
                                    <Ticket className="w-4 h-4 mr-1" /> Bookings
                                </Link>
                            </>
                        )}
                        
                        <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium text-sm">Dashboard</Link>
                        <button onClick={logout} className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                            Logout
                        </button>
                    </div>
                ) : (
                    <Link to="/login" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                        Sign In
                    </Link>
                )}
            </div>
        </nav>
    );
};

// --- ROUTE PROTECTORS ---
const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

// Only allows users with the ADMIN role
const AdminRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user || user.role !== 'ADMIN') return <Navigate to="/" replace />;
    return children;
};

// --- APP COMPONENT ---
function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<AuthPage />} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        
                        {/* Secure Admin Routes */}
                        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                        <Route path="/admin/airports" element={<AdminRoute><AdminAirportsPage /></AdminRoute>} />
                        <Route path="/admin/bookings" element={<AdminRoute><AdminBookingsPage /></AdminRoute>} />
                    </Routes>
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;