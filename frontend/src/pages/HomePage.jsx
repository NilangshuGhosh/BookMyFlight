import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Search, MapPin, Calendar, Filter } from 'lucide-react';
import FlightCard from '../components/FlightCard';

const getLocalTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const HomePage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const todayStr = getLocalTodayString();

    const [airports, setAirports] = useState([
        { airportCode: 'CCU', cityName: 'Kolkata' },
        { airportCode: 'DEL', cityName: 'Delhi' },
        { airportCode: 'BLR', cityName: 'Bengaluru' },
        { airportCode: 'BOM', cityName: 'Mumbai' }
    ]);

    useEffect(() => {
        let active = true;
        const loadAirports = async () => {
            try {
                const response = await api.get('/airports');
                if (active && Array.isArray(response.data) && response.data.length > 0) {
                    setAirports(response.data);
                }
            } catch {
                // Keep initial fallback airport list if request fails
            }
        };
        loadAirports();
        return () => {
            active = false;
        };
    }, []);

    const [searchParams, setSearchParams] = useState({ source: 'CCU', destination: 'DEL', date: '' });
    const [activeSearchParams, setActiveSearchParams] = useState(null);
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookingState, setBookingState] = useState({ id: null, loading: false });
    const [searchPage, setSearchPage] = useState(0);
    const [searchTotalPages, setSearchTotalPages] = useState(1);
    const [searchTotalElements, setSearchTotalElements] = useState(0);
    
    // Sorting state (applied server-side via /api/flights/search)
    const [sortBy, setSortBy] = useState('price_asc');

    // Departed Flights State
    const [showDepartedFlights, setShowDepartedFlights] = useState(false);
    const [departedFlights, setDepartedFlights] = useState([]);
    const [departedLoading, setDepartedLoading] = useState(false);
    const [departedError, setDepartedError] = useState('');
    const [departedPage, setDepartedPage] = useState(0);
    const [departedTotalPages, setDepartedTotalPages] = useState(1);
    const [departedDate, setDepartedDate] = useState('');

    useEffect(() => {
        if (!showDepartedFlights) return;

        const fetchDepartedFlights = async () => {
            setDepartedLoading(true);
            setDepartedError('');
            try {
                const response = await api.get('/flights/departed', {
                    params: {
                        page: departedPage,
                        size: 5,
                        ...(departedDate && { date: departedDate })
                    }
                });
                if (response.data && Array.isArray(response.data.content)) {
                    setDepartedFlights(response.data.content);
                    setDepartedTotalPages(response.data.totalPages);
                } else {
                    setDepartedFlights([]);
                    setDepartedTotalPages(1);
                }
            } catch {
                setDepartedError('Failed to fetch departed flights.');
            } finally {
                setDepartedLoading(false);
            }
        };

        fetchDepartedFlights();
    }, [departedPage, departedDate, showDepartedFlights]);

    const fetchSearchFlights = async (paramsToUse, pageToFetch, sortToUse) => {
        if (paramsToUse.date && paramsToUse.date < todayStr) {
            setFlights([]);
            setSearchTotalPages(1);
            setSearchTotalElements(0);
            setError('Cannot search upcoming flights for a past date. Use "Recently Departed Flights" below.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.get('/flights/search', {
                params: {
                    source: paramsToUse.source,
                    destination: paramsToUse.destination,
                    page: pageToFetch,
                    size: 5,
                    sortBy: sortToUse,
                    ...(paramsToUse.date && { date: paramsToUse.date })
                }
            });
            
            if (response.data && Array.isArray(response.data.content)) {
                setFlights(response.data.content);
                setSearchTotalPages(response.data.totalPages || 1);
                setSearchTotalElements(response.data.totalElements ?? response.data.content.length);
                if (response.data.content.length === 0) {
                    setError('No upcoming flights found for this route and date.');
                }
            } else {
                setFlights([]);
                setError('Server connection error. Please ensure the backend is running.');
            }
        } catch (err) {
            setFlights([]);
            const backendMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message;
            setError(backendMsg || 'Failed to fetch flights. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        const submittedParams = { ...searchParams };
        setActiveSearchParams(submittedParams);
        setSearchPage(0);
        await fetchSearchFlights(submittedParams, 0, sortBy);
    };

    const handleSearchPageChange = async (newPage) => {
        if (!activeSearchParams) return;
        setSearchPage(newPage);
        await fetchSearchFlights(activeSearchParams, newPage, sortBy);
    };

    const handleSortChange = async (newSortBy) => {
        setSortBy(newSortBy);
        if (!activeSearchParams) return;
        setSearchPage(0);
        await fetchSearchFlights(activeSearchParams, 0, newSortBy);
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
                                <option key={`src-${apt.airportCode}`} value={apt.airportCode}>{apt.cityName} ({apt.airportCode})</option>
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
                                <option key={`dest-${apt.airportCode}`} value={apt.airportCode}>{apt.cityName} ({apt.airportCode})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 flex items-center border rounded-lg px-3 py-2 text-gray-900">
                        <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                        <input 
                            type="date" 
                            min={todayStr}
                            className="w-full bg-transparent outline-none"
                            value={searchParams.date}
                            onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                        />
                        {searchParams.date && (
                            <button
                                type="button"
                                onClick={() => setSearchParams({ ...searchParams, date: '' })}
                                className="ml-2 text-xs text-gray-400 hover:text-red-500 font-medium"
                            >
                                Clear
                            </button>
                        )}
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
                        <span className="font-medium text-gray-700">{searchTotalElements} flights found</span>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Filter className="w-4 h-4" />
                            <span>Sort by:</span>
                            <select 
                                className="border-b-2 border-blue-600 outline-none bg-transparent font-medium text-gray-900 cursor-pointer"
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                            >
                                <option value="price_asc">Price (Lowest to Highest)</option>
                                <option value="price_desc">Price (Highest to Lowest)</option>
                                <option value="time_asc">Departure Time (Earliest)</option>
                            </select>
                        </div>
                    </div>

                    {flights.map(flight => (
                        <FlightCard 
                            key={flight.id} 
                            flight={flight} 
                            onBook={handleBookFlight} 
                            bookingState={bookingState} 
                        />
                    ))}

                    {searchTotalPages > 1 && (
                        <div className="flex justify-center items-center mt-6 space-x-4">
                            <button
                                disabled={searchPage === 0 || loading}
                                onClick={() => handleSearchPageChange(searchPage - 1)}
                                className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-sm font-medium text-gray-600">
                                Page {searchPage + 1} of {searchTotalPages}
                            </span>
                            <button
                                disabled={searchPage >= searchTotalPages - 1 || loading}
                                onClick={() => handleSearchPageChange(searchPage + 1)}
                                className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            {/* Departed Flights Section */}
            <div className="mt-16 pt-8 border-t border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Recently Departed Flights</h2>
                        <p className="text-gray-500 text-sm mt-1">Check the status of past flights</p>
                    </div>
                    
                    <button 
                        onClick={() => setShowDepartedFlights(!showDepartedFlights)}
                        className="mt-4 md:mt-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        {showDepartedFlights ? 'Hide Departed Flights' : 'Show Departed Flights'}
                    </button>
                </div>

                {showDepartedFlights && (
                    <>
                        <div className="flex justify-end mb-4">
                            <div className="flex items-center bg-white border rounded-lg px-3 py-2 text-gray-900 shadow-sm w-full md:w-auto">
                                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                <input 
                                    type="date" 
                                    max={todayStr}
                                    className="bg-transparent outline-none text-sm w-full"
                                    value={departedDate}
                                    onChange={(e) => {
                                        setDepartedDate(e.target.value);
                                        setDepartedPage(0); // reset page on date change
                                    }}
                                />
                                {departedDate && (
                                    <button 
                                        onClick={() => { setDepartedDate(''); setDepartedPage(0); }}
                                        className="ml-2 text-xs text-gray-400 hover:text-red-500 font-medium"
                                        type="button"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                {departedLoading && <div className="text-center py-8 text-gray-500 animate-pulse">Loading departed flights...</div>}
                {departedError && <div className="text-center text-red-500 py-4 bg-red-50 rounded-lg">{departedError}</div>}
                
                {!departedLoading && !departedError && departedFlights.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                        No departed flights found for the selected date.
                    </div>
                )}

                {!departedLoading && !departedError && departedFlights.length > 0 && (
                    <div className="space-y-4">
                        {departedFlights.map(flight => (
                            <FlightCard 
                                key={flight.id} 
                                flight={flight} 
                                isDeparted={true} 
                            />
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {!departedLoading && !departedError && departedTotalPages > 1 && (
                    <div className="flex justify-center items-center mt-8 space-x-4">
                        <button 
                            disabled={departedPage === 0}
                            onClick={() => setDepartedPage(p => p - 1)}
                            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm font-medium text-gray-600">
                            Page {departedPage + 1} of {departedTotalPages}
                        </span>
                        <button 
                            disabled={departedPage === departedTotalPages - 1}
                            onClick={() => setDepartedPage(p => p + 1)}
                            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
                    </>
                )}
            </div>
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