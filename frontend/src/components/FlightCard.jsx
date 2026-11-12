import { useState } from 'react';
import { Plane, Users } from 'lucide-react';

const FlightCard = ({ flight, isDeparted = false, onBook, bookingState }) => {
    const departureDate = new Date(flight.departureTime);
    const arrivalDate = new Date(flight.arrivalTime);
    const isCancelled = flight.status === 'CANCELLED';
    const isDelayed = flight.status === 'DELAYED';

    const totalSeats = flight.totalSeats ?? 180;
    const availableSeats = flight.availableSeats ?? totalSeats;
    const isSoldOut = !isDeparted && !isCancelled && availableSeats <= 0;
    const maxBookable = Math.max(1, Math.min(6, availableSeats));

    const [seats, setSeats] = useState(1);
    const effectiveSeats = Math.min(seats, maxBookable);
    const dynamicTotal = Number(flight.basePrice) * effectiveSeats;

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

                    {!isDeparted && !isCancelled && (
                        <div className={`mt-2 inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            isSoldOut
                                ? 'bg-red-100 text-red-700'
                                : availableSeats <= 10
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700'
                        }`}>
                            <Users className="w-3 h-3 mr-1" />
                            {isSoldOut
                                ? `Sold Out (0 / ${totalSeats})`
                                : availableSeats <= 10
                                ? `Only ${availableSeats} of ${totalSeats} seats left`
                                : `${availableSeats} / ${totalSeats} seats available`}
                        </div>
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

            <div className="mt-6 md:mt-0 md:border-l md:pl-8 flex flex-col items-center justify-center min-w-[180px]">
                <div className="text-2xl font-bold text-gray-900">
                    ₹{Number.isInteger(dynamicTotal) ? dynamicTotal : dynamicTotal.toFixed(2)}
                </div>
                {!isDeparted && !isCancelled && !isSoldOut && effectiveSeats > 1 && (
                    <div className="text-[11px] text-gray-500 mt-0.5">
                        ₹{flight.basePrice} × {effectiveSeats} seats
                    </div>
                )}

                {!isDeparted && onBook && !isCancelled && !isSoldOut && (
                    <div className="w-full mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 border rounded-lg px-2.5 py-1.5">
                            <span>Seats:</span>
                            <select
                                value={effectiveSeats}
                                onChange={(e) => setSeats(Number(e.target.value))}
                                className="bg-transparent font-semibold text-gray-900 outline-none cursor-pointer"
                            >
                                {Array.from({ length: maxBookable }, (_, idx) => idx + 1).map((count) => (
                                    <option key={count} value={count}>
                                        {count} {count === 1 ? 'Seat' : 'Seats'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button 
                            onClick={() => onBook(flight.id, effectiveSeats)}
                            disabled={bookingState?.id === flight.id && bookingState?.loading}
                            className="w-full bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                        >
                            {bookingState?.id === flight.id && bookingState?.loading
                                ? 'Booking...'
                                : `Book ${effectiveSeats} ${effectiveSeats === 1 ? 'Seat' : 'Seats'}`}
                        </button>
                    </div>
                )}

                {!isDeparted && isSoldOut && (
                    <span className="mt-2 text-xs font-semibold text-red-600">Sold Out</span>
                )}
                {!isDeparted && isCancelled && (
                    <span className="mt-2 text-xs font-semibold text-red-600">Booking Unavailable</span>
                )}
            </div>
        </div>
    );
};

export default FlightCard;
