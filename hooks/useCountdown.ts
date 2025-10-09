import { useState, useEffect } from 'react';

/**
 * A custom React hook that provides a countdown timer to a specific target date.
 * It updates every second and returns the remaining days, hours, minutes, and seconds.
 *
 * @param targetDate - The target date string (e.g., "2024-12-25T00:00:00").
 * @returns An object containing the time left and a flag for when the countdown has ended.
 */
const useCountdown = (targetDate: string) => {
  const countDownDate = new Date(targetDate).getTime();

  const [countDown, setCountDown] = useState(
    countDownDate - new Date().getTime()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const newCountDown = countDownDate - new Date().getTime();
      if (newCountDown > 0) {
        setCountDown(newCountDown);
      } else {
        setCountDown(0);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [countDownDate]);

  return getReturnValues(countDown);
};

const getReturnValues = (countDown: number) => {
  const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, hasEnded: countDown <= 0 };
};

export { useCountdown };