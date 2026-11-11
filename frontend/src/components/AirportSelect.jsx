import { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Search, ChevronDown } from 'lucide-react';

const AirportSelect = ({
    airports = [],
    value,
    onChange,
    placeholder = 'Select airport',
    className = ''
}) => {
    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    const sortedAirports = useMemo(() => {
        return [...airports].sort((a, b) => {
            const cityCmp = (a.cityName || '').localeCompare(b.cityName || '');
            if (cityCmp !== 0) return cityCmp;
            return (a.airportName || '').localeCompare(b.airportName || '');
        });
    }, [airports]);

    const filteredAirports = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        if (!q) return sortedAirports;
        return sortedAirports.filter((apt) =>
            (apt.cityName || '').toLowerCase().includes(q) ||
            (apt.airportCode || '').toLowerCase().includes(q) ||
            (apt.airportName || '').toLowerCase().includes(q)
        );
    }, [sortedAirports, searchText]);

    const selectedAirport = useMemo(() => {
        return airports.find((apt) => apt.airportCode === value) || null;
    }, [airports, value]);

    useEffect(() => {
        if (!open) return;

        const handleOutsideClick = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
                setSearchText('');
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
                setSearchText('');
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    const handleToggle = () => {
        if (open) {
            setOpen(false);
            setSearchText('');
        } else {
            setOpen(true);
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 0);
        }
    };

    const handleSelect = (code) => {
        onChange(code);
        setOpen(false);
        setSearchText('');
    };

    return (
        <div ref={containerRef} className={`relative w-full min-w-0 ${className}`}>
            <button
                type="button"
                onClick={handleToggle}
                className="w-full min-w-0 flex items-center justify-between text-left bg-transparent outline-none cursor-pointer"
            >
                <div className="flex items-center flex-1 min-w-0 pr-2">
                    <MapPin className="w-5 h-5 text-gray-400 mr-2 shrink-0" />
                    {selectedAirport ? (
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-900 truncate">
                                    {selectedAirport.cityName}
                                </span>
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">
                                    {selectedAirport.airportCode}
                                </span>
                            </div>
                            {selectedAirport.airportName && (
                                <div className="text-[11px] text-gray-500 truncate">
                                    {selectedAirport.airportName}
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-400 text-sm">{placeholder}</span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-0 top-full mt-3 w-full sm:w-88 md:w-96 z-40 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                    <div className="p-2.5 border-b bg-gray-50">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Type city, airport name, or code..."
                                className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                        {filteredAirports.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No matching airports found.
                            </div>
                        ) : (
                            filteredAirports.map((apt) => {
                                const isSelected = apt.airportCode === value;
                                return (
                                    <button
                                        key={apt.airportCode}
                                        type="button"
                                        onClick={() => handleSelect(apt.airportCode)}
                                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-start justify-between gap-3 ${
                                            isSelected ? 'bg-blue-50/70' : ''
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="font-semibold text-sm text-gray-900">
                                                {apt.cityName}
                                            </div>
                                            {apt.airportName && (
                                                <div className="text-xs text-gray-500 mt-0.5 leading-snug">
                                                    {apt.airportName}
                                                </div>
                                            )}
                                        </div>
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded shrink-0 ${
                                            isSelected
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {apt.airportCode}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AirportSelect;
