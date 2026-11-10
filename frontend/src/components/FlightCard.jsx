import { Plane } from 'lucide-react';

const FlightCard = ({ flight, isDeparted = false, onBook, bookingState }) => {
    const departureDate = new Date(flight.departureTime);
    const arrivalDate = new Date(flight.arrivalTime);
    const isCancelled = flight.status === 'CANCELLED';
    const isDelayed = flight.status === 'DELAYED';

    return (
        <div className={`bg-white border rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between transition-all ${isDeparted ? 'opacity-80 hover:opacity-100 bg-gray-50 border-gray-200' : 'hover:shadow-md'}`}>
            <div className="flex-1 flex justify-between items-center w-full md:pr-12">
                <div className="text-center w-1/4">
                    <div className="text-2xl font-bold text-gray-900">
                        {departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-sm font-medium text-gray-700 mt-1">{flight.sourceAirportCode}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {departureDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center px-4">
                    <div className="text-xs text-gray-500 mb-2 font-medium">{flight.airline} • {flight.flightNumber}</div>
                    <div className="w-full flex items-center">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <Plane className={`w-4 h-4 mx-3 transform translate-x-1 ${isDeparted ? 'text-gray-400' : isCancelled ? 'text-red-400' : isDelayed ? 'text-amber-500' : 'text-blue-500'}`} />
                        <div className="h-px bg-gray-300 flex-1"></div>
                    </div>
                    {isDeparted ? (
                        <div className="mt-2 px-2 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold rounded tracking-wider">DEPARTED</div>
                    ) : isDelayed ? (
                        <div className="mt-2 px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                            DELAYED{flight.delayMinutes > 0 ? ` (+${flight.delayMinutes} min)` : ''}
                        </div>
                    ) : (
                        flight.status !== 'SCHEDULED' && (
                            <div className="mt-2 px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">{flight.status}</div>
                        )
                    )}
                </div>

                <div className="text-center w-1/4">
                    <div className="text-2xl font-bold text-gray-900">
                        {arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-sm font-medium text-gray-700 mt-1">{flight.destinationAirportCode}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {arrivalDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>

            <div className="mt-6 md:mt-0 md:border-l md:pl-8 flex flex-col items-center justify-center min-w-[150px]">
                <div className="text-2xl font-bold text-gray-900 mb-3">₹{flight.basePrice}</div>
                {!isDeparted && onBook && !isCancelled && (
                    <button 
                        onClick={() => onBook(flight.id)}
                        disabled={bookingState?.id === flight.id && bookingState?.loading}
                        className="w-full bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                        {bookingState?.id === flight.id && bookingState?.loading ? 'Booking...' : 'Book Now'}
                    </button>
                )}
                {!isDeparted && isCancelled && (
                    <span className="text-xs font-semibold text-red-600">Booking Unavailable</span>
                )}
            </div>
        </div>
    );
};

export default FlightCard;
