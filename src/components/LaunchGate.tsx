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
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setRemainingTime(
        `${days} zile, ${hours} ore, ${minutes} minute, ${seconds} secunde`,
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] p-4 text-center">
      <h1 className="mb-4 text-3xl font-bold text-primary md:text-5xl">
        În curând...
      </h1>
      <p className="mb-8 max-w-xl text-lg text-text">
        Clasamentul va fi publicat pe
        <strong className="text-primary">
          {" "}
          13 iulie 2025, ora 17:00 (ora României)
        </strong>
        .
      </p>
      <div className="rounded-lg bg-surface p-4 font-mono text-2xl text-primary shadow-md md:text-4xl">
        {remainingTime}
      </div>
    </div>
  );
};

export default LaunchGate;
