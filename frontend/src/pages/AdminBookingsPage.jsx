import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
    Ticket,
    Search,
    ArrowLeft,
    Plane,
    User as UserIcon,
    X,
    CheckCircle
} from 'lucide-react';

const AdminBookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Paginated table search, status filter & sort
    const [searchInput, setSearchInput] = useState('');
    const [activeQuery, setActiveQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('created_desc');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Direct PNR Lookup (calls GET /api/bookings/pnr/{pnr})
    const [pnrInput, setPnrInput] = useState('');
    const [pnrResult, setPnrResult] = useState(null);
    const [pnrLoading, setPnrLoading] = useState(false);
    const [pnrError, setPnrError] = useState('');

    // Row details modal
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        let active = true;
        const loadBookings = async () => {
            try {
                const response = await api.get('/admin/bookings', {
                    params: {
                        query: activeQuery,
                        status: statusFilter,
                        sortBy,
                        page,
                        size: 10
                    }
                });
                if (!active) return;
                if (response.data && Array.isArray(response.data.content)) {
                    setBookings(response.data.content);
                    setTotalPages(response.data.totalPages || 1);
                    setTotalElements(response.data.totalElements ?? response.data.content.length);
                } else {
                    setBookings([]);
                    setTotalPages(1);
                    setTotalElements(0);
                }
            } catch {
                if (active) setError('Failed to load bookings.');
            } finally {
                if (active) setLoading(false);
            }
        };
        loadBookings();
        return () => {
            active = false;
        };
    }, [activeQuery, statusFilter, sortBy, page]);

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

    const handlePnrLookup = async (e) => {
        e.preventDefault();
        const trimmed = pnrInput.trim().toUpperCase();
        if (!trimmed) return;

        setPnrLoading(true);
        setPnrError('');
        setPnrResult(null);

        try {
            const response = await api.get(`/bookings/pnr/${encodeURIComponent(trimmed)}`);
            setPnrResult(response.data);
        } catch (err) {
            const msg = err.response?.data?.message
                || (typeof err.response?.data === 'string' ? err.response.data : null)
                || `Booking not found for PNR: ${trimmed}`;
            setPnrError(msg);
        } finally {
            setPnrLoading(false);
        }
    };

    if (loading) return <div className="text-center mt-20 text-gray-500">Loading bookings management...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <Ticket className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
                        <p className="text-gray-500">Verify tickets by PNR or browse and search all passenger bookings</p>
                    </div>
                </div>

                <Link
                    to="/admin"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Flights
                </Link>
            </div>

            {/* QUICK DIRECT PNR LOOKUP (calls GET /api/bookings/pnr/{pnr}) */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Quick PNR Verification</h2>
                        <p className="text-xs text-gray-500">Look up an exact ticket via <code>/api/bookings/pnr/&#123;pnr&#125;</code></p>
                    </div>

                    <form onSubmit={handlePnrLookup} className="flex items-center gap-2 w-full md:w-auto">
                        <input
                            type="text"
                            maxLength="10"
                            value={pnrInput}
                            onChange={(e) => setPnrInput(e.target.value.toUpperCase())}
                            placeholder="Enter PNR (e.g. X7B9WQ)"
                            className="px-3 py-2 border rounded-lg text-sm uppercase tracking-wider w-full md:w-56 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={pnrLoading || !pnrInput.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
                        >
                            {pnrLoading ? 'Checking...' : 'Lookup PNR'}
                        </button>
                        {(pnrResult || pnrError) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setPnrInput('');
                                    setPnrResult(null);
                                    setPnrError('');
                                }}
                                className="px-3 py-2 border rounded-lg text-sm text-gray-600 hover:text-red-600"
                            >
                                Clear
                            </button>
                        )}
                    </form>
                </div>

                {pnrError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {pnrError}
                    </div>
                )}

                {pnrResult && (
                    <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">PNR:</span>
                                <span className="text-base font-bold text-blue-700 tracking-widest">{pnrResult.pnr}</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> {pnrResult.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-800 font-medium">
                                {pnrResult.airline} • {pnrResult.flightNumber} ({pnrResult.sourceAirport} → {pnrResult.destinationAirport})
                            </div>
                            <div className="text-xs text-gray-500">
                                Booking ID #{pnrResult.id} • Flight ID #{pnrResult.flightId} • Booked {new Date(pnrResult.createdAt).toLocaleString()}
                            </div>
                        </div>
                        <div className="text-xl font-bold text-gray-900">₹{pnrResult.totalPrice}</div>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-4 text-red-700 bg-red-50 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* ALL BOOKINGS SEARCH, FILTER & SORT TOOLBAR (ALWAYS VISIBLE) */}
            <div className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by PNR, Booking ID, Passenger, Flight, or Airport..."
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
                        <span className="font-medium text-gray-700">{totalElements} bookings</span>

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(0);
                            }}
                            className="border rounded-lg px-3 py-2 bg-white text-gray-800 font-medium outline-none"
                        >
                            <option value="ALL">Status: All</option>
                            <option value="CONFIRMED">Confirmed</option>
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
                            <option value="created_desc">Sort: Booked (Newest)</option>
                            <option value="created_asc">Sort: Booked (Oldest)</option>
                            <option value="price_desc">Sort: Price (High to Low)</option>
                            <option value="price_asc">Sort: Price (Low to High)</option>
                            <option value="pnr_asc">Sort: PNR (A-Z)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ALL BOOKINGS TABLE */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b text-gray-600 text-sm tracking-wider">
                            <th className="p-4">PNR / ID</th>
                            <th className="p-4">Passenger</th>
                            <th className="p-4">Flight & Route</th>
                            <th className="p-4">Total Price</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Booked At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {bookings.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500">
                                    No bookings found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            bookings.map((booking) => (
                                <tr
                                    key={booking.id}
                                    onClick={() => setSelectedBooking(booking)}
                                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                                >
                                    <td className="p-4">
                                        <div className="font-bold text-blue-700 tracking-wider">{booking.pnr}</div>
                                        <div className="text-xs text-gray-500">Booking #{booking.id}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{booking.passengerName}</div>
                                        <div className="text-xs text-gray-500">{booking.passengerEmail}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">
                                            {booking.airline} • {booking.flightNumber}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {booking.sourceAirport} → {booking.destinationAirport}
                                            {booking.departureTime && ` • ${new Date(booking.departureTime).toLocaleDateString()}`}
                                        </div>
                                    </td>
                                    <td className="p-4 font-semibold text-gray-900">₹{booking.totalPrice}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                            booking.status === 'CONFIRMED'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right text-sm text-gray-600">
                                        {booking.createdAt ? new Date(booking.createdAt).toLocaleString([], {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        }) : 'N/A'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

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

            {/* BOOKING FULL DETAILS MODAL */}
            {selectedBooking && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setSelectedBooking(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between border-b pb-4">
                            <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase">Booking Details</div>
                                <h3 className="text-xl font-bold text-blue-700 tracking-wider mt-0.5">
                                    PNR: {selectedBooking.pnr}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">Booking ID #{selectedBooking.id}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedBooking(null)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border space-y-2 text-sm">
                            <div className="flex items-center font-semibold text-gray-900">
                                <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
                                Passenger Information
                            </div>
                            <div>Name: <span className="font-medium text-gray-900">{selectedBooking.passengerName}</span></div>
                            <div>Email: <span className="font-medium text-gray-900">{selectedBooking.passengerEmail}</span></div>
                            <div>User ID: <span className="font-medium text-gray-900">#{selectedBooking.userId}</span></div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border space-y-2 text-sm">
                            <div className="flex items-center font-semibold text-gray-900">
                                <Plane className="w-4 h-4 mr-2 text-blue-600" />
                                Flight Information
                            </div>
                            <div>
                                Flight: <span className="font-medium text-gray-900">{selectedBooking.airline} • {selectedBooking.flightNumber}</span> (Flight #{selectedBooking.flightId})
                            </div>
                            <div>
                                Route: <span className="font-medium text-gray-900">{selectedBooking.sourceAirport} → {selectedBooking.destinationAirport}</span>
                            </div>
                            <div>
                                Departure: <span className="font-medium text-gray-900">
                                    {selectedBooking.departureTime ? new Date(selectedBooking.departureTime).toLocaleString() : 'N/A'}
                                </span>
                            </div>
                            <div>
                                Flight Status: <span className="font-semibold text-gray-900">{selectedBooking.flightStatus}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t text-sm">
                            <div>
                                <div className="text-gray-500">Booking Status</div>
                                <div className="font-bold text-gray-900">{selectedBooking.status}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-gray-500">Total Paid</div>
                                <div className="text-xl font-bold text-gray-900">₹{selectedBooking.totalPrice}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBookingsPage;
