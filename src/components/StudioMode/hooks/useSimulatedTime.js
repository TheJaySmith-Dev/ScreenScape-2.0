import { useState, useEffect, useCallback } from 'react';

export const useSimulatedTime = () => {
    const [timeState, setTimeState] = useState(() => {
        // Load from localStorage or use default starting time
        const saved = localStorage.getItem('studioMode_simulatedTime');
        return saved ? JSON.parse(saved) : {
            day: 1,
            month: 1,
            year: 2024,
            totalDays: 0 // Total days elapsed for calculations
        };
    });

    useEffect(() => {
        localStorage.setItem('studioMode_simulatedTime', JSON.stringify(timeState));
    }, [timeState]);

    useEffect(() => {
        // Increment day every real second (1 real second = 1 game day)
        const interval = setInterval(() => {
            setTimeState(prev => {
                let newDay = prev.day + 1;
                let newMonth = prev.month;
                let newYear = prev.year;
                let newTotalDays = prev.totalDays + 1;

                // Handle month rollover (30 days per month)
                if (newDay > 30) {
                    newDay = 1;
                    newMonth += 1;
                    // Handle year rollover
                    if (newMonth > 12) {
                        newMonth = 1;
                        newYear += 1;
                    }
                }

                return {
                    day: newDay,
                    month: newMonth,
                    year: newYear,
                    totalDays: newTotalDays
                };
            });
        }, 1000); // 1 second = 1 game day

        return () => clearInterval(interval);
    }, []);

    const getFormattedDate = useCallback(() => {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${timeState.day} ${monthNames[timeState.month - 1]} ${timeState.year}`;
    }, [timeState]);

    const getLast7Days = useCallback(() => {
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
            const daysAgo = timeState.totalDays - i;
            last7.push(daysAgo);
        }
        return last7;
    }, [timeState.totalDays]);

    return {
        ...timeState,
        getFormattedDate,
        getLast7Days
    };
};
