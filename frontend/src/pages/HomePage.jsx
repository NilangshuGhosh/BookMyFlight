import { useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Search, MapPin, Calendar, Plane, Filter } from 'lucide-react';

const HomePage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const airports = [
        { code: 'CCU', name: 'Kolkata' },
        { code: 'DEL', name: 'Delhi' },
        { code: 'BLR', name: 'Bengaluru' },
        { code: 'BOM', name: 'Mumbai' }
    ];

    const [searchParams, setSearchParams] = useState({ source: 'CCU', destination: 'DEL', date: '' });
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookingState, setBookingState] = useState({ id: null, loading: false });
    
    // New State for Sorting
    const [sortBy, setSortBy] = useState('price_asc');

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setFlights([]);

        try {
            const response = await api.get('/flights/search', {
                params: {
                    source: searchParams.source,
                    destination: searchParams.destination,
                    date: searchParams.date || null
                }
            });
            
            if (Array.isArray(response.data)) {
                setFlights(response.data);
                if (response.data.length === 0) setError('No flights found for this route.');
            } else {
                setError('Server connection error. Please ensure the backend is running.');
            }
        } catch (err) {
            setError('Failed to fetch flights. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBookFlight = async (flightId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        setBookingState({ id: flightId, loading: true });
        try {
            await api.post('/bookings/create', { flightId });
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to book flight.');
            setBookingState({ id: null, loading: false });
        }
    };

    // Smart Sorting Logic: Re-calculates only when flights or sortBy changes
    const sortedFlights = useMemo(() => {
        const sorted = [...flights];
        if (sortBy === 'price_asc') sorted.sort((a, b) => a.basePrice - b.basePrice);
        if (sortBy === 'price_desc') sorted.sort((a, b) => b.basePrice - a.basePrice);
        if (sortBy === 'time_asc') sorted.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));
        return sorted;
    }, [flights, sortBy]);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Where are you flying?</h1>
                <p className="text-blue-100 mb-6">Discover the best flights for your next journey.</p>
                
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm">
                    <div className="flex-1 flex items-center border rounded-lg px-3 py-2 text-gray-900">
                        <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                        <select 
                            className="w-full bg-transparent outline-none cursor-pointer"
                            value={searchParams.source}
                            onChange={(e) => setSearchParams({ ...searchParams, source: e.target.value })}
                        >
                            {airports.map(apt => (
                                <option key={`src-${apt.code}`} value={apt.code}>{apt.name} ({apt.code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 flex items-center border rounded-lg px-3 py-2 text-gray-900">
                        <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                        <select 
                            className="w-full bg-transparent outline-none cursor-pointer"
                            value={searchParams.destination}
                            onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                        >
                            {airports.map(apt => (
                                <option key={`dest-${apt.code}`} value={apt.code}>{apt.name} ({apt.code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 flex items-center border rounded-lg px-3 py-2 text-gray-900">
                        <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                        <input 
                            type="date" 
                            className="w-full bg-transparent outline-none"
                            value={searchParams.date}
                            onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center min-w-[120px]"
                    >
                        {loading ? 'Searching...' : <><Search className="w-4 h-4 mr-2"/> Search</>}
                    </button>
                </form>
            </div>

            {error && <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>}

            {/* Sorting Controls & Flight List */}
            {flights.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                        <span className="font-medium text-gray-700">{flights.length} flights found</span>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Filter className="w-4 h-4" />
                            <span>Sort by:</span>
                            <select 
                                className="border-b-2 border-blue-600 outline-none bg-transparent font-medium text-gray-900 cursor-pointer"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="price_asc">Price (Lowest to Highest)</option>
                                <option value="price_desc">Price (Highest to Lowest)</option>
                                <option value="time_asc">Departure Time (Earliest)</option>
                            </select>
                        </div>
                    </div>

                    {sortedFlights.map(flight => (
                        <div key={flight.id} className="bg-white border rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between hover:shadow-md transition-shadow">
                            <div className="flex-1 flex justify-between items-center w-full md:pr-12">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{new Date(flight.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    <div className="text-sm text-gray-500">{flight.sourceAirportCode}</div>
                                </div>
                                
                                <div className="flex-1 flex flex-col items-center px-4">
                                    <div className="text-xs text-gray-400 mb-1">{flight.airline} • {flight.flightNumber}</div>
                                    <div className="w-full flex items-center">
                                        <div className="h-px bg-gray-300 flex-1"></div>
                                        <Plane className="w-4 h-4 mx-2 text-blue-500" />
                                        <div className="h-px bg-gray-300 flex-1"></div>
                                    </div>
                                    {flight.status !== 'SCHEDULED' && (
                                        <div className="mt-1 text-xs font-bold text-red-500">{flight.status}</div>
                                    )}
                                </div>

                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{new Date(flight.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    <div className="text-sm text-gray-500">{flight.destinationAirportCode}</div>
                                </div>
                            </div>

                            <div className="mt-6 md:mt-0 md:border-l md:pl-8 flex flex-col items-center justify-center min-w-[150px]">
                                <div className="text-2xl font-bold text-gray-900 mb-3">₹{flight.basePrice}</div>
                                <button 
                                    onClick={() => handleBookFlight(flight.id)}
                                    disabled={bookingState.id === flight.id && bookingState.loading}
                                    className="w-full bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                                >
                                    {bookingState.id === flight.id && bookingState.loading ? 'Booking...' : 'Book Now'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HomePage;
// import { useState, useContext } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { AuthContext } from '../context/AuthContext';
// import api from '../api/axios';
// import { Search, MapPin, Calendar, Clock, ArrowRight,Plane } from 'lucide-react';

// const HomePage = () => {
//     const { user } = useContext(AuthContext);
//     const navigate = useNavigate();

//     // The 4 airports we seeded in V2__seed_data.sql
//     const airports = [
//         { code: 'CCU', name: 'Kolkata' },
//         { code: 'DEL', name: 'Delhi' },
//         { code: 'BLR', name: 'Bengaluru' },
//         { code: 'BOM', name: 'Mumbai' }
//     ];

//     const [searchParams, setSearchParams] = useState({ source: 'CCU', destination: 'DEL', date: '' });
//     const [flights, setFlights] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [bookingState, setBookingState] = useState({ id: null, loading: false });

// const handleSearch = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         setError('');
//         setFlights([]);

//         try {
//             const response = await api.get('/flights/search', {
//                 params: {
//                     source: searchParams.source,
//                     destination: searchParams.destination,
//                     date: searchParams.date || null
//                 }
//             });
            
//             // SECURITY CHECK: Ensure the backend actually returned an array
//             if (Array.isArray(response.data)) {
//                 setFlights(response.data);
//                 if (response.data.length === 0) setError('No flights found for this route.');
//             } else {
//                 console.error("Backend returned invalid data:", response.data);
//                 setError('Server connection error. Please ensure the backend is running.');
//             }
            
//         } catch (err) {
//             setError('Failed to fetch flights. Please try again.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleBookFlight = async (flightId) => {
//         if (!user) {
//             navigate('/login'); // Force login if not authenticated
//             return;
//         }

//         setBookingState({ id: flightId, loading: true });
//         try {
//             await api.post('/bookings/create', { flightId });
//             navigate('/dashboard'); // Redirect to their bookings after success
//         } catch (err) {
//             alert(err.response?.data?.message || 'Failed to book flight.');
//             setBookingState({ id: null, loading: false });
//         }
//     };

//     return (
//         <div className="max-w-5xl mx-auto p-6 space-y-8">
//             {/* Search Hero Section */}
//             <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg">
//                 <h1 className="text-3xl font-bold mb-2">Where are you flying?</h1>
//                 <p className="text-blue-100 mb-6">Discover the best flights for your next journey.</p>
                
//                 <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm">
//                     {/* Source Dropdown */}
//                     <div className="flex-1 flex items-center border rounded-lg px-3 py-2 text-gray-900">
//                         <MapPin className="w-5 h-5 text-gray-400 mr-2" />
//                         <select 
//                             className="w-full bg-transparent outline-none cursor-pointer"
//                             value={searchParams.source}
//                             onChange={(e) => setSearchParams({ ...searchParams, source: e.target.value })}
//                         >
//                             {airports.map(apt => (
//                                 <option key={`src-${apt.code}`} value={apt.code}>{apt.name} ({apt.code})</option>
//                             ))}
//                         </select>
//                     </div>

//                     {/* Destination Dropdown */}
//                     <div className="flex-1 flex items-center border rounded-lg px-3 py-2 text-gray-900">
//                         <MapPin className="w-5 h-5 text-gray-400 mr-2" />
//                         <select 
//                             className="w-full bg-transparent outline-none cursor-pointer"
//                             value={searchParams.destination}
//                             onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
//                         >
//                             {airports.map(apt => (
//                                 <option key={`dest-${apt.code}`} value={apt.code}>{apt.name} ({apt.code})</option>
//                             ))}
//                         </select>
//                     </div>

//                     {/* Date Picker (Optional) */}
//                     <div className="flex-1 flex items-center border rounded-lg px-3 py-2 text-gray-900">
//                         <Calendar className="w-5 h-5 text-gray-400 mr-2" />
//                         <input 
//                             type="date" 
//                             className="w-full bg-transparent outline-none"
//                             value={searchParams.date}
//                             onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
//                         />
//                     </div>

//                     <button 
//                         type="submit" 
//                         disabled={loading}
//                         className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center min-w-[120px]"
//                     >
//                         {loading ? 'Searching...' : <><Search className="w-4 h-4 mr-2"/> Search</>}
//                     </button>
//                 </form>
//             </div>

//             {/* Error Message */}
//             {error && <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>}

//             {/* Flight Results */}
//             <div className="space-y-4">
//                 {flights.map(flight => (
//                     <div key={flight.id} className="bg-white border rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between hover:shadow-md transition-shadow">
                        
//                         {/* Flight Info */}
//                         <div className="flex-1 flex justify-between items-center w-full md:pr-12">
//                             <div className="text-center">
//                                 <div className="text-2xl font-bold text-gray-900">{new Date(flight.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
//                                 <div className="text-sm text-gray-500">{flight.sourceAirportCode}</div>
//                             </div>
                            
//                             <div className="flex-1 flex flex-col items-center px-4">
//                                 <div className="text-xs text-gray-400 mb-1">{flight.airline} • {flight.flightNumber}</div>
//                                 <div className="w-full flex items-center">
//                                     <div className="h-px bg-gray-300 flex-1"></div>
//                                     <Plane className="w-4 h-4 mx-2 text-blue-500" />
//                                     <div className="h-px bg-gray-300 flex-1"></div>
//                                 </div>
//                             </div>

//                             <div className="text-center">
//                                 <div className="text-2xl font-bold text-gray-900">{new Date(flight.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
//                                 <div className="text-sm text-gray-500">{flight.destinationAirportCode}</div>
//                             </div>
//                         </div>

//                         {/* Price & Book Button */}
//                         <div className="mt-6 md:mt-0 md:border-l md:pl-8 flex flex-col items-center justify-center min-w-[150px]">
//                             <div className="text-2xl font-bold text-gray-900 mb-3">₹{flight.basePrice}</div>
//                             <button 
//                                 onClick={() => handleBookFlight(flight.id)}
//                                 disabled={bookingState.id === flight.id && bookingState.loading}
//                                 className="w-full bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
//                             >
//                                 {bookingState.id === flight.id && bookingState.loading ? 'Booking...' : 'Book Now'}
//                             </button>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default HomePage;