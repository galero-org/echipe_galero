import React, { useState, useEffect } from "react";

interface LaunchGateProps {
  targetDate: Date;
  children: React.ReactNode;
}

const LaunchGate: React.FC<LaunchGateProps> = ({ targetDate, children }) => {
  const [isReady, setIsReady] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      // Calculează diferența față de o dată și oră fixă (UTC)
      const timeLeft = targetDate.getTime() - now.getTime();

      if (timeLeft <= 0) {
        setIsReady(true);
        setRemainingTime("Clasamentul este disponibil!");
        return;
      }

      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setRemainingTime(
        `${days} zile, ${hours} ore, ${minutes} minute, ${seconds} secunde`
      );

      setIsReady(false);
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);

    return () => clearInterval(timerId);
  }, [targetDate]);

  if (isReady) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
      <h1 className="text-3xl md:text-5xl font-bold mb-4 text-blue-600">
        În curând...
      </h1>
      <p className="text-lg text-gray-700 mb-8 max-w-xl">
        Clasamentul va fi publicat pe
        <strong className="text-blue-600">
          {" "}
          13 iulie 2025, ora 17:00 (ora României)
        </strong>
        .
      </p>
      <div className="text-2xl md:text-4xl font-mono text-gray-800 bg-white p-4 rounded-lg shadow-md">
        {remainingTime}
      </div>
    </div>
  );
};

export default LaunchGate;
