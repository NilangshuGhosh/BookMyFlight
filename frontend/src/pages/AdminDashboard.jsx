import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AirportSelect from '../components/AirportSelect';
import {
    ShieldAlert,
    CheckCircle,
    Plus,
    X,
    Clock,
    RotateCcw,
    Ban,
    Info,
    Plane,
    AlertTriangle,
    MapPin,
    Search
} from 'lucide-react';

const formatDuration = (departureTime, arrivalTime) => {
    const diffMs = new Date(arrivalTime) - new Date(departureTime);
    if (Number.isNaN(diffMs) || diffMs <= 0) return 'N/A';
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
};

const addMinutesFormatted = (isoString, minutes) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    const adjusted = new Date(date.getTime() + minutes * 60000);
    return adjusted.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getLocalDateTimeMin = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const AdminDashboard = () => {
    const [flights, setFlights] = useState([]);
    const [airports, setAirports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Admin flight search, filtering & sorting state
    const [searchInput, setSearchInput] = useState('');
    const [activeQuery, setActiveQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [includeDeparted, setIncludeDeparted] = useState(false);
    const [sortBy, setSortBy] = useState('departure_asc');

    // Creation form toggle & state
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        airline: 'IndiGo',
        flightNumber: '',
        sourceAirportCode: '',
        destinationAirportCode: '',
        departureTime: '',
        arrivalTime: '',
        basePrice: ''
    });

    // Modals: full flight details & status update confirmation
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        flight: null,
        targetStatus: '',
        delayMinutes: 30,
        submitting: false,
        modalError: ''
    });

    const applyFlightsResponse = (data) => {
        if (data && Array.isArray(data.content)) {
            setFlights(data.content);
            setTotalPages(data.totalPages || 1);
            setTotalElements(data.totalElements ?? data.content.length);
        } else if (Array.isArray(data)) {
            setFlights(data);
            setTotalPages(1);
            setTotalElements(data.length);
        } else {
            setFlights([]);
            setTotalPages(1);
            setTotalElements(0);
        }
    };

    const fetchFlights = async (
        targetPage = page,
        targetQuery = activeQuery,
        targetStatus = statusFilter,
        targetIncludeDeparted = includeDeparted,
        targetSortBy = sortBy
    ) => {
        try {
            const response = await api.get('/admin/flights', {
                params: {
                    query: targetQuery,
                    status: targetStatus,
                    includeDeparted: targetIncludeDeparted,
                    sortBy: targetSortBy,
                    page: targetPage,
                    size: 10
                }
            });
            applyFlightsResponse(response.data);
        } catch {
            setError('Failed to load flights.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;
        const loadAirports = async () => {
            try {
                const airportsRes = await api.get('/airports');
                if (!active) return;
                if (Array.isArray(airportsRes.data)) {
                    setAirports(airportsRes.data);
                    if (airportsRes.data.length >= 2) {
                        setFormData((prev) => ({
                            ...prev,
                            sourceAirportCode: prev.sourceAirportCode || airportsRes.data[0].airportCode,
                            destinationAirportCode: prev.destinationAirportCode || airportsRes.data[1].airportCode
                        }));
                    }
                }
            } catch {
                // Handled by flight fetch error if backend unavailable
            }
        };
        loadAirports();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        const loadFlights = async () => {
            try {
                const flightsRes = await api.get('/admin/flights', {
                    params: {
                        query: activeQuery,
                        status: statusFilter,
                        includeDeparted,
                        sortBy,
                        page,
                        size: 10
                    }
                });
                if (!active) return;
                applyFlightsResponse(flightsRes.data);
            } catch {
                if (active) setError('Failed to load admin flights.');
            } finally {
                if (active) setLoading(false);
            }
        };
        loadFlights();
        return () => {
            active = false;
        };
    }, [activeQuery, statusFilter, includeDeparted, sortBy, page]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setError('');
        setPage(0);
        setActiveQuery(searchInput.trim());
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setActiveQuery('');
        setPage(0);
    };

    const getAirportLabel = (code) => {
        const match = airports.find((a) => a.airportCode === code);
        return match ? `${match.cityName} (${match.airportCode}) — ${match.airportName}` : code;
    };

    const openStatusConfirmation = (flight, targetStatus) => {
        setConfirmModal({
            open: true,
            flight,
            targetStatus,
            delayMinutes: flight.delayMinutes && flight.delayMinutes > 0 ? flight.delayMinutes : 30,
            submitting: false,
            modalError: ''
        });
    };

    const closeConfirmModal = () => {
        setConfirmModal({
            open: false,
            flight: null,
            targetStatus: '',
            delayMinutes: 30,
            submitting: false,
            modalError: ''
        });
    };

    const handleConfirmStatusUpdate = async () => {
        const { flight, targetStatus, delayMinutes } = confirmModal;
        if (!flight) return;

        if (targetStatus === 'DELAYED' && (!delayMinutes || Number(delayMinutes) <= 0)) {
            setConfirmModal((prev) => ({
                ...prev,
                modalError: 'Please enter a valid delay duration greater than 0 minutes.'
            }));
            return;
        }

        setMessage('');
        setError('');
        setConfirmModal((prev) => ({ ...prev, submitting: true, modalError: '' }));

        try {
            const response = await api.put(`/admin/flights/${flight.id}/status`, null, {
                params: {
                    newStatus: targetStatus,
                    ...(targetStatus === 'DELAYED' ? { delayMinutes: Number(delayMinutes) } : {})
                }
            });
            setMessage(typeof response.data === 'string' ? response.data : `Flight status updated to ${targetStatus}.`);
            closeConfirmModal();
            setSelectedFlight(null);
            await fetchFlights(page);
        } catch (err) {
            const errMsg = typeof err.response?.data === 'string' ? err.response.data : 'Failed to update flight status.';
            setConfirmModal((prev) => ({
                ...prev,
                submitting: false,
                modalError: errMsg
            }));
        }
    };

    const handleCreateFlight = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (formData.sourceAirportCode === formData.destinationAirportCode) {
            setError('Source and destination airports must be different.');
            return;
        }
        if (new Date(formData.departureTime) >= new Date(formData.arrivalTime)) {
            setError('Departure time must be earlier than arrival time.');
            return;
        }

        try {
            await api.post('/admin/flights/create', formData);
            setMessage(`Flight ${formData.flightNumber.toUpperCase()} created successfully!`);
            setShowForm(false);
            setFormData((prev) => ({
                ...prev,
                flightNumber: '',
                departureTime: '',
                arrivalTime: '',
                basePrice: ''
            }));
            await fetchFlights(page);
        } catch (err) {
            const errMsg = typeof err.response?.data === 'string' ? err.response.data : 'Failed to create flight. Check your inputs.';
            setError(errMsg);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (loading) return <div className="text-center mt-20 text-gray-500">Loading admin panel...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-red-100 rounded-full text-red-600">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
                        <p className="text-gray-500">Manage flight schedules, delays, and inventory (click any row for full details)</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        to="/admin/airports"
                        className="flex items-center border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <MapPin className="w-4 h-4 mr-2" /> Manage Airports
                    </Link>
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        {showForm ? <><X className="w-4 h-4 mr-2" /> Close Form</> : <><Plus className="w-4 h-4 mr-2" /> Add New Flight</>}
                    </button>
                </div>
            </div>

            {message && (
                <div className="p-4 text-green-700 bg-green-50 rounded-lg flex items-center border border-green-200">
                    <CheckCircle className="w-5 h-5 mr-2 shrink-0" /> {message}
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
                            <input type="text" name="flightNumber" placeholder="e.g. 6E-999" required value={formData.flightNumber} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md uppercase" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Base Price (₹)</label>
                            <input type="number" min="1" step="0.01" name="basePrice" placeholder="5000" required value={formData.basePrice} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Source Airport</label>
                            <div className="border rounded-md px-3 py-2 bg-white">
                                <AirportSelect
                                    airports={airports}
                                    value={formData.sourceAirportCode}
                                    onChange={(code) => setFormData({ ...formData, sourceAirportCode: code })}
                                    placeholder="Select source airport"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Destination Airport</label>
                            <div className="border rounded-md px-3 py-2 bg-white">
                                <AirportSelect
                                    airports={airports}
                                    value={formData.destinationAirportCode}
                                    onChange={(code) => setFormData({ ...formData, destinationAirportCode: code })}
                                    placeholder="Select destination airport"
                                />
                            </div>
                        </div>
                        <div className="hidden md:block"></div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Departure Time</label>
                            <input
                                type="datetime-local"
                                name="departureTime"
                                min={getLocalDateTimeMin()}
                                required
                                value={formData.departureTime}
                                onChange={handleInputChange}
                                className="mt-1 w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Arrival Time</label>
                            <input
                                type="datetime-local"
                                name="arrivalTime"
                                min={formData.departureTime || getLocalDateTimeMin()}
                                required
                                value={formData.arrivalTime}
                                onChange={handleInputChange}
                                className="mt-1 w-full p-2 border rounded-md"
                            />
                        </div>
                        
                        <div className="md:col-span-3 flex justify-end mt-2">
                            <button
                                type="submit"
                                disabled={airports.length < 2}
                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                            >
                                Save Flight
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ADMIN FLIGHT SEARCH, FILTER & SORT TOOLBAR */}
            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by Flight ID, No., Airline, Code, or City..."
                                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Search
                        </button>
                        {activeQuery && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="px-3 py-2 text-sm text-gray-600 hover:text-red-600 border rounded-lg"
                            >
                                Clear
                            </button>
                        )}
                    </form>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span className="font-medium text-gray-700">{totalElements} flights</span>

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(0);
                            }}
                            className="border rounded-lg px-3 py-2 bg-white text-gray-800 font-medium outline-none"
                        >
                            <option value="ALL">Status: All</option>
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="DELAYED">Delayed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setPage(0);
                            }}
                            className="border rounded-lg px-3 py-2 bg-white text-gray-800 font-medium outline-none"
                        >
                            <option value="departure_asc">Sort: Departure (Earliest)</option>
                            <option value="departure_desc">Sort: Departure (Latest)</option>
                            <option value="price_asc">Sort: Price (Low to High)</option>
                            <option value="price_desc">Sort: Price (High to Low)</option>
                            <option value="id_desc">Sort: Flight ID (Newest)</option>
                        </select>

                        <label className="inline-flex items-center space-x-2 cursor-pointer select-none bg-gray-50 border rounded-lg px-3 py-2">
                            <input
                                type="checkbox"
                                checked={includeDeparted}
                                onChange={(e) => {
                                    setIncludeDeparted(e.target.checked);
                                    setPage(0);
                                }}
                                className="rounded text-blue-600"
                            />
                            <span className="text-gray-700 font-medium">Show Past Flights</span>
                        </label>
                    </div>
                </div>
            </div>

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
                        {flights.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500">
                                    No flights found matching your filters.
                                </td>
                            </tr>
                        ) : (
                            flights.map((flight) => {
                                const isCancelled = flight.status === 'CANCELLED';
                                const isDelayed = flight.status === 'DELAYED';
                                const isDeparted = new Date(flight.departureTime) < new Date();

                                return (
                                    <tr
                                        key={flight.id}
                                        onClick={() => setSelectedFlight(flight)}
                                        className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                                    >
                                        <td className="p-4 font-medium text-gray-900">
                                            {flight.airline} <br/>
                                            <span className="text-sm text-gray-500">#{flight.id} • {flight.flightNumber}</span>
                                        </td>
                                        <td className="p-4">
                                            {flight.sourceAirportCode} → {flight.destinationAirportCode}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {new Date(flight.departureTime).toLocaleString([], {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                flight.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                                                isDelayed ? 'bg-amber-100 text-amber-800' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {flight.status}
                                                {isDelayed && flight.delayMinutes > 0 && ` (+${flight.delayMinutes}m)`}
                                            </span>
                                        </td>
                                        <td
                                            className="p-4 text-right space-x-2 whitespace-nowrap"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setSelectedFlight(flight)}
                                                className="inline-flex items-center text-xs bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded hover:bg-gray-200 transition-colors"
                                                title="View Full Flight Details"
                                            >
                                                <Info className="w-3.5 h-3.5 mr-1" /> Details
                                            </button>

                                            {isDeparted ? (
                                                <span className="text-xs font-medium text-gray-500 italic ml-2">
                                                    Departed (Locked)
                                                </span>
                                            ) : !isCancelled ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => openStatusConfirmation(flight, 'DELAYED')}
                                                        className="inline-flex items-center text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded hover:bg-amber-100 transition-colors"
                                                    >
                                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                                        {isDelayed ? 'Update Delay' : 'Delay'}
                                                    </button>

                                                    {isDelayed && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openStatusConfirmation(flight, 'SCHEDULED')}
                                                            className="inline-flex items-center text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded hover:bg-green-100 transition-colors"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Revert to Normal
                                                        </button>
                                                    )}

                                                    <span className="inline-block h-4 w-px bg-gray-200 align-middle mx-1" />

                                                    <button
                                                        type="button"
                                                        onClick={() => openStatusConfirmation(flight, 'CANCELLED')}
                                                        className="inline-flex items-center text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded hover:bg-red-100 transition-colors"
                                                    >
                                                        <Ban className="w-3.5 h-3.5 mr-1" /> Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-xs font-medium text-red-500 italic ml-2">
                                                    Cancelled (Locked)
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 space-x-4">
                    <button
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                        Page {page + 1} of {totalPages}
                    </span>
                    <button
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* FULL FLIGHT DETAILS MODAL */}
            {selectedFlight && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setSelectedFlight(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 space-y-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between border-b pb-4">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <Plane className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {selectedFlight.airline} • {selectedFlight.flightNumber}
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Flight ID #{selectedFlight.id}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedFlight(null)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border">
                            <div>
                                <div className="text-xs uppercase font-semibold text-gray-500">Departure</div>
                                <div className="font-semibold text-gray-900 mt-1">
                                    {getAirportLabel(selectedFlight.sourceAirportCode)}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    Scheduled: {new Date(selectedFlight.departureTime).toLocaleString()}
                                </div>
                                {selectedFlight.status === 'DELAYED' && selectedFlight.delayMinutes > 0 && (
                                    <div className="text-sm font-medium text-amber-700 mt-1">
                                        Estimated: {addMinutesFormatted(selectedFlight.departureTime, selectedFlight.delayMinutes)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="text-xs uppercase font-semibold text-gray-500">Arrival</div>
                                <div className="font-semibold text-gray-900 mt-1">
                                    {getAirportLabel(selectedFlight.destinationAirportCode)}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    Scheduled: {new Date(selectedFlight.arrivalTime).toLocaleString()}
                                </div>
                                {selectedFlight.status === 'DELAYED' && selectedFlight.delayMinutes > 0 && (
                                    <div className="text-sm font-medium text-amber-700 mt-1">
                                        Estimated: {addMinutesFormatted(selectedFlight.arrivalTime, selectedFlight.delayMinutes)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 border rounded-xl">
                                <div className="text-xs text-gray-500">Duration</div>
                                <div className="font-bold text-gray-900 mt-1">
                                    {formatDuration(selectedFlight.departureTime, selectedFlight.arrivalTime)}
                                </div>
                            </div>
                            <div className="p-3 border rounded-xl">
                                <div className="text-xs text-gray-500">Base Price</div>
                                <div className="font-bold text-gray-900 mt-1">₹{selectedFlight.basePrice}</div>
                            </div>
                            <div className="p-3 border rounded-xl">
                                <div className="text-xs text-gray-500">Status</div>
                                <div className="font-bold text-gray-900 mt-1">
                                    {selectedFlight.status}
                                    {selectedFlight.status === 'DELAYED' && selectedFlight.delayMinutes > 0
                                        ? ` (+${selectedFlight.delayMinutes} min)`
                                        : ''}
                                </div>
                            </div>
                        </div>

                        {new Date(selectedFlight.departureTime) < new Date() ? (
                            <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600">
                                This flight has already departed and can no longer be modified.
                            </div>
                        ) : selectedFlight.status !== 'CANCELLED' ? (
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openStatusConfirmation(selectedFlight, 'DELAYED')}
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100"
                                    >
                                        <Clock className="w-4 h-4 mr-1.5" />
                                        {selectedFlight.status === 'DELAYED' ? 'Update Delay Time' : 'Mark Delayed'}
                                    </button>
                                    {selectedFlight.status === 'DELAYED' && (
                                        <button
                                            type="button"
                                            onClick={() => openStatusConfirmation(selectedFlight, 'SCHEDULED')}
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-1.5" /> Revert to Scheduled
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openStatusConfirmation(selectedFlight, 'CANCELLED')}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    <Ban className="w-4 h-4 mr-1.5" /> Cancel Flight
                                </button>
                            </div>
                        ) : (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                This flight has been cancelled. Cancelled flights cannot be reverted or modified.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ADMIN STATUS CHANGE CONFIRMATION POP-UP */}
            {confirmModal.open && confirmModal.flight && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className={`w-6 h-6 ${
                                    confirmModal.targetStatus === 'CANCELLED' ? 'text-red-600' :
                                    confirmModal.targetStatus === 'DELAYED' ? 'text-amber-600' :
                                    'text-green-600'
                                }`} />
                                <h3 className="text-lg font-bold text-gray-900">
                                    {confirmModal.targetStatus === 'DELAYED' && 'Confirm Flight Delay'}
                                    {confirmModal.targetStatus === 'SCHEDULED' && 'Revert Flight to Scheduled'}
                                    {confirmModal.targetStatus === 'CANCELLED' && 'Confirm Flight Cancellation'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={closeConfirmModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg border text-sm text-gray-700">
                            <div className="font-semibold text-gray-900">
                                {confirmModal.flight.airline} • {confirmModal.flight.flightNumber}
                            </div>
                            <div>
                                Route: {confirmModal.flight.sourceAirportCode} → {confirmModal.flight.destinationAirportCode}
                            </div>
                            <div>
                                Current Status: <span className="font-semibold">{confirmModal.flight.status}</span>
                                {' → '}
                                New Status: <span className="font-semibold">{confirmModal.targetStatus}</span>
                            </div>
                        </div>

                        {confirmModal.targetStatus === 'DELAYED' && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Delayed by how many minutes?
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {[15, 30, 45, 60, 120].map((mins) => (
                                        <button
                                            key={mins}
                                            type="button"
                                            onClick={() => setConfirmModal((prev) => ({ ...prev, delayMinutes: mins }))}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                                                Number(confirmModal.delayMinutes) === mins
                                                    ? 'bg-amber-600 text-white border-amber-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-amber-50'
                                            }`}
                                        >
                                            +{mins}m
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    value={confirmModal.delayMinutes}
                                    onChange={(e) => setConfirmModal((prev) => ({ ...prev, delayMinutes: e.target.value }))}
                                    className="w-full p-2 border rounded-lg text-sm"
                                    placeholder="Custom delay in minutes"
                                />
                            </div>
                        )}

                        {confirmModal.targetStatus === 'SCHEDULED' && (
                            <p className="text-sm text-gray-600">
                                This will clear the active delay ({confirmModal.flight.delayMinutes || 0} mins) and restore the flight status back to <strong>SCHEDULED</strong>.
                            </p>
                        )}

                        {confirmModal.targetStatus === 'CANCELLED' && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                <strong>Warning:</strong> Cancelling a flight is permanent and cannot be reverted back to Scheduled or Delayed. Passengers will no longer be able to book it.
                            </div>
                        )}

                        {confirmModal.modalError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                {confirmModal.modalError}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                disabled={confirmModal.submitting}
                                onClick={closeConfirmModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                disabled={confirmModal.submitting}
                                onClick={handleConfirmStatusUpdate}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 ${
                                    confirmModal.targetStatus === 'CANCELLED'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : confirmModal.targetStatus === 'DELAYED'
                                        ? 'bg-amber-600 hover:bg-amber-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {confirmModal.submitting
                                    ? 'Updating...'
                                    : confirmModal.targetStatus === 'CANCELLED'
                                    ? 'Confirm Cancellation'
                                    : confirmModal.targetStatus === 'DELAYED'
                                    ? 'Confirm Delay'
                                    : 'Confirm Revert'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
