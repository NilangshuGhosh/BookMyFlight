import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { Ticket, Plane, Calendar, CheckCircle, Search, Ban, AlertTriangle, X } from 'lucide-react';

const Dashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    // New State for Live Search
    const [searchTerm, setSearchTerm] = useState('');
    const [cancelModal, setCancelModal] = useState({
        open: false,
        booking: null,
        submitting: false,
        modalError: ''
    });

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await api.get('/bookings/my-bookings');
                setBookings(response.data);
            } catch {
                setError('Failed to load your bookings. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const handleConfirmCancel = async () => {
        const { booking } = cancelModal;
        if (!booking) return;

        setMessage('');
        setError('');
        setCancelModal((prev) => ({ ...prev, submitting: true, modalError: '' }));

        try {
            const response = await api.post(`/bookings/${booking.id}/cancel`);
            setBookings((prev) =>
                prev.map((item) => (item.id === booking.id ? response.data : item))
            );
            setMessage(`Booking ${booking.pnr} cancelled and ${booking.seatsBooked ?? 1} seat(s) released.`);
            setCancelModal({ open: false, booking: null, submitting: false, modalError: '' });
        } catch (err) {
            const msg = err.response?.data?.message
                || (typeof err.response?.data === 'string' ? err.response.data : null)
                || 'Failed to cancel booking.';
            setCancelModal((prev) => ({ ...prev, submitting: false, modalError: msg }));
        }
    };

    // Smart Filtering Logic: Filters bookings instantly as you type
    const filteredBookings = useMemo(() => {
        if (!searchTerm) return bookings;
        const lowerTerm = searchTerm.toLowerCase();
        
        return bookings.filter(booking => 
            booking.pnr.toLowerCase().includes(lowerTerm) ||
            booking.airline.toLowerCase().includes(lowerTerm) ||
            booking.sourceAirport.toLowerCase().includes(lowerTerm) ||
            booking.destinationAirport.toLowerCase().includes(lowerTerm)
        );
    }, [bookings, searchTerm]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-64px)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <Ticket className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
                        <p className="text-gray-500">Manage your upcoming flights and tickets</p>
                    </div>
                </div>

                {/* The Search Bar */}
                {bookings.length>0 && (
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search by PNR, City, Airline..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm"
                        />
                    </div>
                )}
            </div>

            {message && (
                <div className="p-4 text-green-700 bg-green-50 rounded-lg border border-green-200 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 shrink-0" /> {message}
                </div>
            )}

            {error && (
                <div className="p-4 text-red-600 bg-red-50 rounded-lg border border-red-100">
                    {error}
                </div>
            )}

            {!loading && bookings.length === 0 && !error && (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                    <Plane className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900">No bookings yet</h3>
                    <p className="text-gray-500 mt-1">When you book a flight, it will appear here.</p>
                </div>
            )}

            {filteredBookings.length === 0 && bookings.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                    No tickets match "{searchTerm}"
                </div>
            )}

            <div className="grid gap-6">
                {filteredBookings.map((booking) => (
                    <div key={booking.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">PNR:</span>
                                <span className="text-lg font-bold text-blue-600 tracking-widest">{booking.pnr}</span>
                            </div>
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${
                                booking.status === 'CONFIRMED'
                                    ? 'text-green-600 bg-green-50 border-green-200'
                                    : 'text-red-600 bg-red-50 border-red-200'
                            }`}>
                                {booking.status === 'CONFIRMED' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                <span className="text-sm font-medium">{booking.status}</span>
                            </div>
                        </div>

                        <div className="p-6 flex flex-col md:flex-row items-center justify-between">
                            <div className="flex-1 flex justify-between items-center w-full md:pr-12">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900">{booking.sourceAirport}</div>
                                </div>
                                
                                <div className="flex-1 flex flex-col items-center px-4">
                                    <div className="text-sm font-medium text-gray-500 mb-2">{booking.airline} • {booking.flightNumber}</div>
                                    <div className="w-full flex items-center">
                                        <div className="h-px bg-gray-300 flex-1"></div>
                                        <Plane className="w-5 h-5 mx-2 text-blue-500" />
                                        <div className="h-px bg-gray-300 flex-1"></div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900">{booking.destinationAirport}</div>
                                </div>
                            </div>

                            <div className="mt-6 md:mt-0 md:border-l md:pl-8 flex flex-col items-center justify-center min-w-[200px]">
                                <div className="flex items-center text-gray-500 mb-1 text-sm">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Booked: {new Date(booking.createdAt).toLocaleDateString()}
                                </div>
                                <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full mb-2">
                                    {booking.seatsBooked ?? 1} {(booking.seatsBooked ?? 1) === 1 ? 'Seat' : 'Seats'}
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    ₹{booking.totalPrice}
                                </div>
                                {booking.status === 'CONFIRMED' && (
                                    <button
                                        type="button"
                                        onClick={() => setCancelModal({ open: true, booking, submitting: false, modalError: '' })}
                                        className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                                    >
                                        <Ban className="w-3.5 h-3.5 mr-1" /> Cancel Ticket
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {cancelModal.open && cancelModal.booking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                                <h3 className="text-lg font-bold text-gray-900">Cancel Booking</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCancelModal({ open: false, booking: null, submitting: false, modalError: '' })}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg border text-sm text-gray-700 space-y-1">
                            <div className="font-bold text-blue-700">PNR: {cancelModal.booking.pnr}</div>
                            <div>{cancelModal.booking.airline} • {cancelModal.booking.flightNumber}</div>
                            <div>{cancelModal.booking.sourceAirport} → {cancelModal.booking.destinationAirport}</div>
                            <div>
                                {cancelModal.booking.seatsBooked ?? 1} {(cancelModal.booking.seatsBooked ?? 1) === 1 ? 'Seat' : 'Seats'} • ₹{cancelModal.booking.totalPrice}
                            </div>
                        </div>

                        <p className="text-sm text-gray-600">
                            Are you sure you want to cancel this booking? Your reserved seat(s) will be released immediately.
                        </p>

                        {cancelModal.modalError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                {cancelModal.modalError}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                disabled={cancelModal.submitting}
                                onClick={() => setCancelModal({ open: false, booking: null, submitting: false, modalError: '' })}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Keep Ticket
                            </button>
                            <button
                                type="button"
                                disabled={cancelModal.submitting}
                                onClick={handleConfirmCancel}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-60"
                            >
                                {cancelModal.submitting ? 'Cancelling...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

// import { useState, useEffect } from 'react';
// import api from '../api/axios';
// import { Ticket, Plane, Calendar, CheckCircle } from 'lucide-react';

// const Dashboard = () => {
//     const [bookings, setBookings] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');

//     useEffect(() => {
//         const fetchBookings = async () => {
//             try {
//                 // The Axios interceptor automatically attaches your JWT token!
//                 const response = await api.get('/bookings/my-bookings');
//                 setBookings(response.data);
//             } catch (err) {
//                 setError('Failed to load your bookings. Please try again later.');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchBookings();
//     }, []);

//     if (loading) {
//         return (
//             <div className="flex justify-center items-center h-[calc(100vh-64px)]">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//             </div>
//         );
//     }

//     return (
//         <div className="max-w-5xl mx-auto p-6 space-y-8">
//             <div className="flex items-center space-x-3 mb-8">
//                 <div className="p-3 bg-blue-100 rounded-full text-blue-600">
//                     <Ticket className="w-8 h-8" />
//                 </div>
//                 <div>
//                     <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
//                     <p className="text-gray-500">Manage your upcoming flights and tickets</p>
//                 </div>
//             </div>

//             {error && (
//                 <div className="p-4 text-red-600 bg-red-50 rounded-lg border border-red-100">
//                     {error}
//                 </div>
//             )}

//             {!loading && bookings.length === 0 && !error && (
//                 <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
//                     <Plane className="w-12 h-12 text-gray-300 mx-auto mb-4" />
//                     <h3 className="text-xl font-medium text-gray-900">No bookings yet</h3>
//                     <p className="text-gray-500 mt-1">When you book a flight, it will appear here.</p>
//                 </div>
//             )}

//             <div className="grid gap-6">
//                 {bookings.map((booking) => (
//                     <div key={booking.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
//                         {/* Ticket Header */}
//                         <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
//                             <div className="flex items-center space-x-2">
//                                 <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">PNR:</span>
//                                 <span className="text-lg font-bold text-blue-600 tracking-widest">{booking.pnr}</span>
//                             </div>
//                             <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
//                                 <CheckCircle className="w-4 h-4" />
//                                 <span className="text-sm font-medium">{booking.status}</span>
//                             </div>
//                         </div>

//                         {/* Ticket Body */}
//                         <div className="p-6 flex flex-col md:flex-row items-center justify-between">
//                             {/* Route Info */}
//                             <div className="flex-1 flex justify-between items-center w-full md:pr-12">
//                                 <div className="text-center">
//                                     <div className="text-3xl font-bold text-gray-900">{booking.sourceAirport}</div>
//                                 </div>
                                
//                                 <div className="flex-1 flex flex-col items-center px-4">
//                                     <div className="text-sm font-medium text-gray-500 mb-2">{booking.airline} • {booking.flightNumber}</div>
//                                     <div className="w-full flex items-center">
//                                         <div className="h-px bg-gray-300 flex-1"></div>
//                                         <Plane className="w-5 h-5 mx-2 text-blue-500" />
//                                         <div className="h-px bg-gray-300 flex-1"></div>
//                                     </div>
//                                 </div>

//                                 <div className="text-center">
//                                     <div className="text-3xl font-bold text-gray-900">{booking.destinationAirport}</div>
//                                 </div>
//                             </div>

//                             {/* Booking Meta */}
//                             <div className="mt-6 md:mt-0 md:border-l md:pl-8 flex flex-col items-center justify-center min-w-[200px]">
//                                 <div className="flex items-center text-gray-500 mb-2 text-sm">
//                                     <Calendar className="w-4 h-4 mr-2" />
//                                     Booked: {new Date(booking.createdAt).toLocaleDateString()}
//                                 </div>
//                                 <div className="text-2xl font-bold text-gray-900">
//                                     ₹{booking.totalPrice}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default Dashboard;