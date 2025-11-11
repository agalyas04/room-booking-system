import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

const TimePicker = ({ value, onChange, name, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const dropdownRef = useRef(null);

  // Generate hours 1-12
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  
  // Generate minutes 00-59
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // Convert 24-hour format to 12-hour format for display
  useEffect(() => {
    if (value) {
      const [hours24, mins] = value.split(':');
      const hour24 = parseInt(hours24, 10);
      const period = hour24 >= 12 ? 'PM' : 'AM';
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      
      setSelectedHour(hour12.toString().padStart(2, '0'));
      setSelectedMinute(mins);
      setSelectedPeriod(period);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Convert 12-hour format to 24-hour format for form submission
  const convertTo24Hour = (hour12, minute, period) => {
    let hour24 = parseInt(hour12, 10);
    
    if (period === 'AM') {
      if (hour24 === 12) hour24 = 0;
    } else {
      if (hour24 !== 12) hour24 += 12;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minute}`;
  };

  const handleTimeChange = (hour, minute, period) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    
    const time24 = convertTo24Hour(hour, minute, period);
    onChange({ target: { name, value: time24 } });
  };

  const displayValue = value ? `${selectedHour}:${selectedMinute} ${selectedPeriod}` : '';

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 cursor-pointer bg-white flex items-center justify-between"
      >
        <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue || 'Select time'}
        </span>
        <Clock className="h-4 w-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="flex">
            {/* Hours */}
            <div className="flex-1 border-r border-gray-200">
              <div className="text-xs font-semibold text-gray-500 p-2 border-b border-gray-200 text-center">
                Hour
              </div>
              <div className="max-h-48 overflow-y-auto">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => handleTimeChange(hour, selectedMinute, selectedPeriod)}
                    className={`px-3 py-2 cursor-pointer text-center hover:bg-pink-50 ${
                      selectedHour === hour ? 'bg-pink-100 text-pink-900 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {hour}
                  </div>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1 border-r border-gray-200">
              <div className="text-xs font-semibold text-gray-500 p-2 border-b border-gray-200 text-center">
                Minute
              </div>
              <div className="max-h-48 overflow-y-auto">
                {minutes.map((minute) => (
                  <div
                    key={minute}
                    onClick={() => handleTimeChange(selectedHour, minute, selectedPeriod)}
                    className={`px-3 py-2 cursor-pointer text-center hover:bg-pink-50 ${
                      selectedMinute === minute ? 'bg-pink-100 text-pink-900 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {minute}
                  </div>
                ))}
              </div>
            </div>

            {/* AM/PM */}
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-500 p-2 border-b border-gray-200 text-center">
                Period
              </div>
              <div>
                <div
                  onClick={() => handleTimeChange(selectedHour, selectedMinute, 'AM')}
                  className={`px-3 py-2 cursor-pointer text-center hover:bg-pink-50 ${
                    selectedPeriod === 'AM' ? 'bg-pink-100 text-pink-900 font-semibold' : 'text-gray-700'
                  }`}
                >
                  AM
                </div>
                <div
                  onClick={() => handleTimeChange(selectedHour, selectedMinute, 'PM')}
                  className={`px-3 py-2 cursor-pointer text-center hover:bg-pink-50 ${
                    selectedPeriod === 'PM' ? 'bg-pink-100 text-pink-900 font-semibold' : 'text-gray-700'
                  }`}
                >
                  PM
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
