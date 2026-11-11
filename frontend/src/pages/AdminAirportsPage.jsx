import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
    MapPin,
    Plus,
    X,
    Search,
    CheckCircle,
    AlertTriangle,
    ArrowLeft
} from 'lucide-react';

const AdminAirportsPage = () => {
    const [airports, setAirports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Search, Sort & Pagination
    const [searchInput, setSearchInput] = useState('');
    const [activeQuery, setActiveQuery] = useState('');
    const [sortBy, setSortBy] = useState('city_asc');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Create Form & Confirmation Warning Pop-up
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        airportCode: '',
        cityName: '',
        airportName: ''
    });
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        submitting: false,
        modalError: ''
    });

    const fetchAirports = async (targetQuery = activeQuery, targetPage = page, targetSort = sortBy) => {
        try {
            const response = await api.get('/admin/airports', {
                params: {
                    query: targetQuery,
                    page: targetPage,
                    size: 8,
                    sortBy: targetSort
                }
            });
            if (response.data && Array.isArray(response.data.content)) {
                setAirports(response.data.content);
                setTotalPages(response.data.totalPages || 1);
                setTotalElements(response.data.totalElements ?? response.data.content.length);
            } else {
                setAirports([]);
                setTotalPages(1);
                setTotalElements(0);
            }
        } catch {
            setError('Failed to load airports.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const response = await api.get('/admin/airports', {
                    params: {
                        query: activeQuery,
                        page,
                        size: 8,
                        sortBy
                    }
                });
                if (!active) return;
                if (response.data && Array.isArray(response.data.content)) {
                    setAirports(response.data.content);
                    setTotalPages(response.data.totalPages || 1);
                    setTotalElements(response.data.totalElements ?? response.data.content.length);
                } else {
                    setAirports([]);
                    setTotalPages(1);
                    setTotalElements(0);
                }
            } catch {
                if (active) setError('Failed to load airports.');
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [activeQuery, page, sortBy]);

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

    const handleOpenConfirmModal = (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const code = formData.airportCode.trim().toUpperCase();
        const city = formData.cityName.trim();
        const name = formData.airportName.trim();

        if (!/^[A-Z0-9]{2,10}$/.test(code)) {
            setError('Airport code must be 2 to 10 alphanumeric characters (e.g., HYD).');
            return;
        }
        if (!city || !name) {
            setError('City name and airport name are required.');
            return;
        }

        setFormData({ airportCode: code, cityName: city, airportName: name });
        setConfirmModal({ open: true, submitting: false, modalError: '' });
    };

    const handleConfirmCreateAirport = async () => {
        setConfirmModal((prev) => ({ ...prev, submitting: true, modalError: '' }));
        try {
            const response = await api.post('/admin/airports/create', formData);
            const created = response.data;
            setMessage(`Airport ${created.cityName} (${created.airportCode}) added successfully!`);
            setConfirmModal({ open: false, submitting: false, modalError: '' });
            setShowForm(false);
            setFormData({ airportCode: '', cityName: '', airportName: '' });
            setPage(0);
            await fetchAirports(activeQuery, 0, sortBy);
        } catch (err) {
            const errMsg = typeof err.response?.data === 'string'
                ? err.response.data
                : 'Failed to create airport. Check for duplicate code or name.';
            setConfirmModal((prev) => ({ ...prev, submitting: false, modalError: errMsg }));
        }
    };

    if (loading) return <div className="text-center mt-20 text-gray-500">Loading airport management...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <MapPin className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Airport Management</h1>
                        <p className="text-gray-500">Add new airports and search existing hubs</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        to="/admin"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Flights
                    </Link>

                    <button
                        type="button"
                        onClick={() => setShowForm(!showForm)}
                        className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        {showForm ? <><X className="w-4 h-4 mr-1.5" /> Close Form</> : <><Plus className="w-4 h-4 mr-1.5" /> Add New Airport</>}
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

            {/* ADD NEW AIRPORT FORM */}
            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Airport</h2>
                    <form onSubmit={handleOpenConfirmModal} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Airport Code (IATA)</label>
                            <input
                                type="text"
                                name="airportCode"
                                maxLength="10"
                                required
                                placeholder="e.g. HYD"
                                value={formData.airportCode}
                                onChange={(e) => setFormData({ ...formData, airportCode: e.target.value.toUpperCase() })}
                                className="mt-1 w-full p-2 border rounded-md uppercase"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">City Name</label>
                            <input
                                type="text"
                                name="cityName"
                                maxLength="100"
                                required
                                placeholder="e.g. Hyderabad"
                                value={formData.cityName}
                                onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
                                className="mt-1 w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Airport Full Name</label>
                            <input
                                type="text"
                                name="airportName"
                                maxLength="255"
                                required
                                placeholder="e.g. Rajiv Gandhi International Airport"
                                value={formData.airportName}
                                onChange={(e) => setFormData({ ...formData, airportName: e.target.value })}
                                className="mt-1 w-full p-2 border rounded-md"
                            />
                        </div>
                        <div className="md:col-span-3 flex justify-end mt-2">
                            <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                            >
                                Review & Save Airport
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* SEARCH & SORT TOOLBAR */}
            <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by code, city, or airport name..."
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

                <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <span>{totalElements} airports</span>
                    <select
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value);
                            setPage(0);
                        }}
                        className="border rounded-lg px-3 py-2 bg-white text-gray-800 font-medium outline-none"
                    >
                        <option value="city_asc">Sort: City (A-Z)</option>
                        <option value="name_asc">Sort: Airport Name (A-Z)</option>
                        <option value="code_asc">Sort: Code (A-Z)</option>
                    </select>
                </div>
            </div>

            {/* AIRPORTS TABLE */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b text-gray-600 text-sm tracking-wider">
                            <th className="p-4 w-28">Code</th>
                            <th className="p-4 w-48">City</th>
                            <th className="p-4">Airport Name</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {airports.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="p-8 text-center text-gray-500">
                                    No airports found matching your search.
                                </td>
                            </tr>
                        ) : (
                            airports.map((airport) => (
                                <tr key={airport.airportCode} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-md">
                                            {airport.airportCode}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium text-gray-900">{airport.cityName}</td>
                                    <td className="p-4 text-gray-700">{airport.airportName}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 space-x-4">
                    <button
                        disabled={page === 0}
                        onClick={() => setPage((p) => p - 1)}
                        className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                        Page {page + 1} of {totalPages}
                    </span>
                    <button
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* WARNING CONFIRMATION POP-UP MODAL */}
            {confirmModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                                <h3 className="text-lg font-bold text-gray-900">Confirm New Airport</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setConfirmModal({ open: false, submitting: false, modalError: '' })}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                            <strong>Warning:</strong> Airport codes serve as permanent primary keys referenced by scheduled flights and cannot be casually renamed or deleted once flights are created. Please verify the details carefully.
                        </div>

                        <div className="p-4 bg-gray-50 border rounded-xl text-sm space-y-1.5">
                            <div><span className="text-gray-500">Airport Code:</span> <span className="font-bold text-gray-900">{formData.airportCode}</span></div>
                            <div><span className="text-gray-500">City:</span> <span className="font-semibold text-gray-900">{formData.cityName}</span></div>
                            <div><span className="text-gray-500">Airport Name:</span> <span className="font-semibold text-gray-900">{formData.airportName}</span></div>
                        </div>

                        {confirmModal.modalError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                {confirmModal.modalError}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                disabled={confirmModal.submitting}
                                onClick={() => setConfirmModal({ open: false, submitting: false, modalError: '' })}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={confirmModal.submitting}
                                onClick={handleConfirmCreateAirport}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-60"
                            >
                                {confirmModal.submitting ? 'Creating...' : 'Confirm & Create Airport'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAirportsPage;
