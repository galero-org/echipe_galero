import React from "react";
import type { Team } from "../lib/types";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";

interface Props {
  teams: Team[];
  teamCount: number;
  edition_id: number;
}

const GeneratedTeamsDisplay: React.FC<Props> = ({
  teams,
  teamCount,
  edition_id,
}) => {
  if (!teams || teams.length === 0) return null;

  const exportAsImage = async () => {
    const element = document.getElementById("teams-capture");
    if (!element) return;

    const canvas = await html2canvas(element);
    const dataUrl = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "echipe.png";
    link.click();
  };

  const gridColsClass = () => {
    if (teamCount <= 1) return "lg:grid-cols-1";
    if (teamCount === 2) return "lg:grid-cols-2";
    if (teamCount === 3) return "lg:grid-cols-3";
    return "lg:grid-cols-4";
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.2 } },
  };

  // Calculăm șansele de câștig
  const totalAvg = teams.reduce((acc, t) => acc + (t.averageGrade || 0), 0);
  const getWinChance = (avg: number) =>
    totalAvg ? ((avg / totalAvg) * 100).toFixed(1) : "0";

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-3">
        2. Echipe Generate
      </h2>

      <button
        onClick={exportAsImage}
        className="mb-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
      >
        Exportă imaginea
      </button>

      <div
        id="teams-capture"
        className="relative bg-white p-6 rounded-xl shadow-xl overflow-hidden"
      >
        {/* Fundal imagine Galero */}
        <img
          src="/images/galero-logo.jpg"
          alt="Galero Background"
          className="absolute opacity-10 inset-0 w-full h-full object-contain pointer-events-none"
          style={{ zIndex: 0 }}
        />

        {/* Header Galero */}
        <div className="mb-8 text-center border-b pb-4 relative z-10">
          <img
            src="/images/galero-logo.jpg"
            alt="Galero Logo"
            className="mx-auto h-20 mb-2 rounded-full border border-gray-300 shadow"
          />
          <h1 className="text-2xl font-bold text-gray-800">
            🏆 Galero - Ediția # {edition_id}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            powered by <strong>www.galero.ro</strong> · Șanse egale · Fair Play
          </p>
        </div>

        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className={`relative z-10 grid grid-cols-1 md:grid-cols-2 ${gridColsClass()} gap-6`}
          >
            {teams.map((team, idx) => (
              <motion.div
                layout
                key={team.name + "-" + idx}
                custom={idx}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`rounded-xl shadow-lg p-5 border-t-4 bg-white bg-opacity-90 ${
                  team.color || "border-gray-500 text-gray-800"
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3
                    className={`text-xl font-bold ${
                      team.color ? team.color.split(" ")[2] : "text-gray-800"
                    }`}
                  >
                    {team.name}
                  </h3>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      team.color || "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {team.players.length} jucători
                  </span>
                </div>
                <p className="mb-1 text-sm">
                  Media echipei:{" "}
                  <span
                    className={`font-bold text-lg ${
                      team.color ? team.color.split(" ")[2] : "text-gray-800"
                    }`}
                  >
                    {team.averageGrade?.toFixed(2)}
                  </span>
                </p>
                <p className="mb-4 text-sm">
                  Șanse de câștig:{" "}
                  <span className="font-semibold text-green-700">
                    {getWinChance(team.averageGrade || 0)}%
                  </span>
                </p>
                <h4 className="text-sm font-medium mb-2">Jucători:</h4>         
                     {" "}
                <ul className="space-y-1.5">
                                   {" "}
                  {team.players.map((player) => (
                    <li
                      key={player.id}
                      className="text-sm p-2 bg-white/60 rounded-md shadow-sm"
                    >
                                            {player.full_name}{" "}
                      {/* AICI ESTE LOCUL UNDE ADĂUGĂM NUMĂRUL DE PREZENȚE */}
                      {player.totalEditions !== undefined &&
                        (player.totalEditions === 1 ? (
                          <span className="text-xs text-red-400 ml-1 font-semibold">
                            (Nou)
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 ml-1">
                            ({player.totalEditions} prezențe)
                          </span>
                        ))}
                                           {" "}
                      {player.position === "GK" && (
                        <span role="img" aria-label="portar">
                                                    🧤                        {" "}
                        </span>
                      )}
                                         {" "}
                    </li>
                  ))}
                                 {" "}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GeneratedTeamsDisplay;
