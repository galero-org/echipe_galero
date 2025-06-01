// src/components/CountdownApp.tsx
import React, { useState, useEffect } from "react";

// Data și ora de lansare a aplicației (8 Iunie 2025, ora 20:00 EEST)
// Am setat data exactă pentru a simula o săptămână înainte de azi,
// ca să poți vedea beneficiile aparând progresiv.
// Astăzi este 1 Iunie 2025, ora 20:00, deci 8 Iunie este într-o săptămână.
const LAUNCH_DATE = new Date("2025-06-08T20:00:00+03:00").getTime(); // +03:00 pentru EEST (Ora de Vară a Europei de Est)

// Definirea beneficiilor aplicației, cu o dată de "dezvăluire" pentru fiecare
const BENEFITS = [
  {
    date: new Date("2025-06-02T00:00:00+03:00").getTime(), // Luni, 2 Iunie
    title: "Meciuri Organizate Fără Efort",
    description:
      "Gata cu mesajele interminabile! Aplicația noastră îți permite să te înscrii la meciuri și să vezi cine participă, totul cu doar câteva tap-uri. Simplu, rapid, eficient!",
  },
  {
    date: new Date("2025-06-03T00:00:00+03:00").getTime(), // Marți, 3 Iunie
    title: "Notificări Instant - Fii Mereu la Curent",
    description:
      "Nu rata niciodată o miuță! Primești notificări în timp real despre disponibilitatea terenului, schimbări de orar sau anunțuri importante de la organizatori. Fii informat, joacă mai mult!",
  },
  {
    date: new Date("2025-06-04T00:00:00+03:00").getTime(), // Miercuri, 4 Iunie
    title: "Istoric și Statistici Personale",
    description:
      "Urmărește-ți progresul! Aplicația îți înregistrează prezențele la meciuri și îți oferă statistici simple despre activitatea ta. Vezi cât de activ ești și unde te poți îmbunătăți.",
  },
  {
    date: new Date("2025-06-05T00:00:00+03:00").getTime(), // Joi, 5 Iunie
    title: "Comunicare Simplificată cu Echipa",
    description:
      "Păstrează legătura cu ceilalți jucători! Chat-ul integrat îți permite să discuți cu colegii de echipă, să planificați strategii sau pur și simplu să vă tachinați prietenește.",
  },
  {
    date: new Date("2025-06-06T00:00:00+03:00").getTime(), // Vineri, 6 Iunie
    title: "Vot pentru Jucătorul Meciului & Feedback",
    description:
      "Recunoaște valoarea! După fiecare meci, poți vota jucătorul preferat și poți oferi feedback rapid organizatorilor pentru o experiență de joc tot mai bună.",
  },
  {
    date: new Date("2025-06-07T00:00:00+03:00").getTime(), // Sâmbătă, 7 Iunie
    title: "Galerie Foto & Video Direct în Aplicație",
    description:
      "Retrăiește momentele cheie! Toate fotografiile și clipurile video de la meciuri vor fi disponibile direct în aplicație, ușor de accesat și de împărtășit cu prietenii.",
  },
  {
    date: new Date("2025-06-08T00:00:00+03:00").getTime(), // Duminica, 8 Iunie (ziua lansării, afișăm ultimul beneficiu major și link-ul de download)
    title: "Acces Rapid la Toate Meciurile Galero Iași",
    description:
      "Nu mai căuta! Aplicația centralizează toate informațiile despre meciurile Galero Iași. Vezi programul, disponibilitatea și înscrie-te instant la următoarea miuță. Tot fotbalul nostru de sâmbătă, la un tap distanță!",
  },
];

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLaunched: boolean;
}

const CountdownApp: React.FC = () => {
  const [countdown, setCountdown] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLaunched: false,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = LAUNCH_DATE - now;

      if (distance < 0) {
        clearInterval(interval);
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isLaunched: true,
        });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds, isLaunched: false });
    }, 1000);

    // Curățare la demontarea componentei
    return () => clearInterval(interval);
  }, []); // [] asigură că useEffect rulează o singură dată la montare

  const now = new Date().getTime();
  const revealedBenefits = BENEFITS.filter((benefit) => now >= benefit.date);

  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-8 text-center">
        Aplicația Galero Iași - Vine Miuța pe Telefon!
      </h1>

      <p className="text-xl md:text-2xl text-gray-300 mb-12 text-center max-w-2xl">
        Ne pregătim să ducem experiența fotbalului de sâmbătă la un nou nivel!
        Aplicația Galero Iași este aproape gata și îți va aduce toate
        beneficiile direct pe smartphone.
      </p>

      {/* Countdown Section */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center mb-16"
        id="countdown-section"
      >
        {countdown.isLaunched ? (
          <p className="col-span-full text-4xl font-bold text-green-500">
            Aplicația a fost lansată!
          </p>
        ) : (
          <>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-5xl md:text-7xl font-bold text-blue-500">
                {countdown.days}
              </div>
              <div className="text-lg md:text-xl text-gray-400">Zile</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-5xl md:text-7xl font-bold text-blue-500">
                {countdown.hours}
              </div>
              <div className="text-lg md:text-xl text-gray-400">Ore</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-5xl md:text-7xl font-bold text-blue-500">
                {countdown.minutes}
              </div>
              <div className="text-lg md:text-xl text-gray-400">Minute</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-5xl md:text-7xl font-bold text-blue-500">
                {countdown.seconds}
              </div>
              <div className="text-lg md:text-xl text-gray-400">Secunde</div>
            </div>
          </>
        )}
      </div>

      {/* Benefits Section */}
      <div className="w-full max-w-4xl bg-gray-800 p-8 rounded-lg shadow-xl mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-6 text-center">
          Ce îți aduce noua Aplicație Galero Iași?
        </h2>
        <div id="app-benefits" className="flex flex-col gap-6">
          {revealedBenefits.length > 0 ? (
            revealedBenefits.map((benefit, index) => (
              <div key={index} className="bg-gray-700 p-5 rounded-md shadow-md">
                <h3 className="text-2xl font-semibold text-blue-400 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-300">{benefit.description}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 text-lg mt-8">
              Stai aproape! Descoperă un nou beneficiu al aplicației în fiecare
              zi!
            </p>
          )}
        </div>

        {countdown.isLaunched && (
          <div id="download-app-section" className="text-center mt-12">
            <p className="text-2xl text-green-400 font-semibold mb-4">
              Aplicația este Disponibilă!
            </p>
            <a
              href="[LINK_MAGAZIN_ANDROID]"
              target="_blank"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 mr-4"
            >
              Descarcă pentru Android
            </a>
            <a
              href="[LINK_MAGAZIN_IOS]"
              target="_blank"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300"
            >
              Descarcă pentru iOS
            </a>
            <p className="text-sm text-gray-400 mt-4">
              Sau scanează codul QR de pe site-ul principal!
            </p>
          </div>
        )}
      </div>

      <p className="text-gray-400 text-center text-sm">
        © 2025 Galero Football Iași. Toate drepturile rezervate.
      </p>
    </section>
  );
};

export default CountdownApp;
