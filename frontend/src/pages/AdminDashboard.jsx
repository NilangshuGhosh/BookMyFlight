import { useState, useEffect } from 'react';
import api from '../api/axios';
import { ShieldAlert, CheckCircle, Plus, X } from 'lucide-react';

const AdminDashboard = () => {
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    // Toggle for the creation form
    const [showForm, setShowForm] = useState(false);
    
    // State for the new flight
    const [formData, setFormData] = useState({
        airline: 'IndiGo',
        flightNumber: '',
        sourceAirportCode: 'CCU',
        destinationAirportCode: 'DEL',
        departureTime: '',
        arrivalTime: '',
        basePrice: ''
    });

    const fetchFlights = async () => {
        try {
            const response = await api.get('/flights/upcoming');
            setFlights(response.data);
        } catch (err) {
            setError('Failed to load flights.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlights();
    }, []);

    const handleStatusUpdate = async (flightId, newStatus) => {
        setMessage(''); setError('');
        try {
            await api.put(`/admin/flights/${flightId}/status`, null, { params: { newStatus } });
            setMessage(`Flight status updated to ${newStatus} successfully.`);
            fetchFlights();
        } catch (err) {
            setError(err.response?.data || 'Failed to update status.');
        }
    };

    const handleCreateFlight = async (e) => {
        e.preventDefault();
        setMessage(''); setError('');
        try {
            await api.post('/admin/flights/create', formData);
            setMessage(`Flight ${formData.flightNumber} created successfully!`);
            setShowForm(false); // Hide form on success
            setFormData({ ...formData, flightNumber: '', departureTime: '', arrivalTime: '', basePrice: '' }); // Reset fields
            fetchFlights(); // Refresh the table
        } catch (err) {
            setError(err.response?.data || 'Failed to create flight. Check your inputs.');
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (loading) return <div className="text-center mt-20">Loading admin panel...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-red-100 rounded-full text-red-600">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
                        <p className="text-gray-500">Manage flight schedules and inventory</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    {showForm ? <><X className="w-4 h-4 mr-2" /> Close Form</> : <><Plus className="w-4 h-4 mr-2" /> Add New Flight</>}
                </button>
            </div>

            {message && (
                <div className="p-4 text-green-700 bg-green-50 rounded-lg flex items-center border border-green-200">
                    <CheckCircle className="w-5 h-5 mr-2" /> {message}
                </div>
            )}
            
            {error && (
                <div className="p-4 text-red-700 bg-red-50 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* FLIGHT CREATION FORM */}
            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Flight</h2>
                    <form onSubmit={handleCreateFlight} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Airline</label>
                            <input type="text" name="airline" required value={formData.airline} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Flight Number</label>
                            <input type="text" name="flightNumber" placeholder="e.g. 6E-999" required value={formData.flightNumber} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Base Price (₹)</label>
                            <input type="number" name="basePrice" placeholder="5000" required value={formData.basePrice} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Source (Code)</label>
                            <input type="text" name="sourceAirportCode" maxLength="3" required value={formData.sourceAirportCode} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md uppercase" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Destination (Code)</label>
                            <input type="text" name="destinationAirportCode" maxLength="3" required value={formData.destinationAirportCode} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md uppercase" />
                        </div>
                        <div className="hidden md:block"></div> {/* Spacer */}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Departure Time</label>
                            <input type="datetime-local" name="departureTime" required value={formData.departureTime} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Arrival Time</label>
                            <input type="datetime-local" name="arrivalTime" required value={formData.arrivalTime} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        
                        <div className="md:col-span-3 flex justify-end mt-2">
                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                                Save Flight
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* FLIGHT INVENTORY TABLE */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b text-gray-600 text-sm tracking-wider">
                            <th className="p-4">Flight</th>
                            <th className="p-4">Route</th>
                            <th className="p-4">Departure</th>
                            <th className="p-4">Current Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {flights.map((flight) => (
                            <tr key={flight.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-900">
                                    {flight.airline} <br/>
                                    <span className="text-sm text-gray-500">{flight.flightNumber}</span>
                                </td>
                                <td className="p-4">
                                    {flight.sourceAirportCode} → {flight.destinationAirportCode}
                                </td>
                                <td className="p-4 text-gray-600">
                                    {new Date(flight.departureTime).toLocaleString([], {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                                    })}
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        flight.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                                        flight.status === 'DELAYED' ? 'bg-orange-100 text-orange-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {flight.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <button onClick={() => handleStatusUpdate(flight.id, 'DELAYED')} className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded hover:bg-orange-100 transition-colors">Delay</button>
                                    <button onClick={() => handleStatusUpdate(flight.id, 'CANCELLED')} className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-100 transition-colors">Cancel</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;