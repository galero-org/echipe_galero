import React, { useState, useEffect } from "react";
import type { Team, PlayerPreferences } from "../lib/types";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";

interface Props {
  teams: Team[];
  teamCount: number;
  edition_id: string;
  numarEditie?: number;
  playersPerTeam?: number;
  preferences?: PlayerPreferences;
  allPlayers?: any[];
}

interface TeamGeneration {
  id: string;
  created_at: string;
  created_by_user_id: string;
  team_count: number;
  players_per_team: number;
  user_profile?: {
    username: string;
    full_name: string;
  };
}

const GeneratedTeamsDisplay: React.FC<Props> = ({
  teams,
  teamCount,
  edition_id,
  numarEditie = 0,
  playersPerTeam = 6,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [generations, setGenerations] = useState<TeamGeneration[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showGrades, setShowGrades] = useState(true);

  if (!teams || teams.length === 0) return null;

  useEffect(() => {
    const fetchGenerations = async () => {
      try {
        const response = await fetch(
          `/api/team-generations?edition_id=${edition_id}`,
        );
        if (response.ok) {
          const data = await response.json();
          setGenerations(data || []);
        }
      } catch (err) {
        console.error("Error loading history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchGenerations();
  }, [edition_id]);

  const saveGeneration = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/team-generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edition_id,
          team_count: teamCount,
          players_per_team: playersPerTeam,
          generated_teams: teams,
        }),
      });

      if (response.ok) {
        const newGeneration = await response.json();
        setGenerations([newGeneration, ...generations]);
        alert("✅ Generare salvată!");
      } else {
        alert("❌ Eroare la salvare");
      }
    } catch (err) {
      console.error("Error saving:", err);
      alert("❌ Eroare la salvare");
    } finally {
      setIsSaving(false);
    }
  };

  const exportAsImage = async () => {
    const element = document.getElementById("teams-capture");
    if (!element) return;

    // Ascunde notele temporar pentru export
    const gradeElements = element.querySelectorAll(".grade-display");
    gradeElements.forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });

    const canvas = await html2canvas(element);
    const dataUrl = canvas.toDataURL("image/png");

    // Readaparetează notele
    gradeElements.forEach((el) => {
      (el as HTMLElement).style.display = "";
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `echipe-ed${numarEditie}-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  };

  const gridColsClass = () => {
    if (teamCount <= 1) return "lg:grid-cols-1";
    if (teamCount === 2) return "lg:grid-cols-2";
    if (teamCount === 3) return "lg:grid-cols-3";
    return "lg:grid-cols-4";
  };

  const allPlayersInTeams = teams
    .flatMap((team) => team.players)
    .sort((a, b) => (b.grade || 0) - (a.grade || 0));

  const maxAvgGrade = Math.max(...teams.map((t) => t.averageGrade || 0));
  const minAvgGrade = Math.min(...teams.map((t) => t.averageGrade || 0));
  const gradeRange = maxAvgGrade - minAvgGrade;

  const totalAvg = teams.reduce((acc, t) => acc + (t.averageGrade || 0), 0);
  const getWinChance = (avg: number) =>
    totalAvg ? ((avg / totalAvg) * 100).toFixed(1) : "0";

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
      },
    }),
    exit: { opacity: 0, scale: 0.95, y: -10 },
  };

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-3">
        2. Echipe Generate
      </h2>

      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={exportAsImage}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          📥 Exportă imaginea
        </button>
        <button
          onClick={saveGeneration}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {isSaving ? "Se salvează..." : "💾 Salvează generarea"}
        </button>
        <button
          onClick={() => setShowGrades(!showGrades)}
          className={`px-4 py-2 rounded-md transition ${
            showGrades
              ? "bg-yellow-600 text-white hover:bg-yellow-700"
              : "bg-gray-600 text-white hover:bg-gray-700"
          }`}
        >
          {showGrades ? "👁️ Ascunde notele" : "👁️ Arată notele"}
        </button>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
        >
          📋 Istoric ({generations.length})
        </button>
      </div>

      {showHistory && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200 max-h-60 overflow-y-auto">
          <h3 className="font-semibold text-purple-900 mb-3">
            📜 Generări Anterioare
          </h3>
          {loadingHistory ? (
            <p className="text-gray-600 text-sm">Se încarcă...</p>
          ) : generations.length > 0 ? (
            <div className="space-y-2">
              {generations.map((gen) => (
                <div
                  key={gen.id}
                  className="p-3 bg-white rounded-md border-l-4 border-purple-500 text-sm"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {gen.user_profile?.full_name ||
                          gen.user_profile?.username ||
                          "Unknown"}
                      </p>
                      <p className="text-xs text-gray-600">
                        {gen.team_count} echipe × {gen.players_per_team}{" "}
                        jucători
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(gen.created_at).toLocaleString("ro-RO")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Niciun istoric disponibil</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
          <h3 className="font-bold text-lg text-yellow-900 mb-3">
            🌟 Top Jucători
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allPlayersInTeams.slice(0, 24).map((player, idx) => (
              <div
                key={player.id}
                className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm border-l-2 border-yellow-400 hover:shadow-md transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">
                    #{idx + 1} {player.full_name}
                  </p>
                  {player.position === "GK" && (
                    <span className="text-xs text-purple-600 font-bold">
                      🧤 Portar
                    </span>
                  )}
                </div>
                <div className="text-right ml-2">
                  {showGrades && (
                    <span className="font-bold text-yellow-700 text-lg grade-display">
                      {player.grade || 0}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <h3 className="font-bold text-lg text-blue-900 mb-4">
            📊 Comparare Echipe
          </h3>
          <div className="space-y-4">
            {teams.map((team) => {
              const barWidth =
                gradeRange > 0
                  ? ((team.averageGrade! - minAvgGrade) / gradeRange) * 100
                  : 50;
              const isStrongest = team.averageGrade === maxAvgGrade;
              const isWeakest = team.averageGrade === minAvgGrade;

              return (
                <div key={team.name} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-gray-800">
                      {team.name}
                      <span className="text-xs text-gray-600 ml-1">
                        ({team.players.length} j.)
                      </span>
                    </span>
                    <div className="text-right">
                      <span
                        className={`font-bold text-base ${
                          isStrongest
                            ? "text-green-700"
                            : isWeakest
                              ? "text-red-600"
                              : "text-blue-700"
                        }`}
                      >
                        {team.averageGrade?.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-600 ml-2">
                        T: {team.totalGrade}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-5 bg-white/60 rounded-full overflow-hidden border border-blue-300 shadow-sm">
                    <div
                      className={`h-full rounded-full flex items-center justify-center transition-all ${
                        isStrongest
                          ? "bg-gradient-to-r from-green-400 to-green-600"
                          : isWeakest
                            ? "bg-gradient-to-r from-red-400 to-red-600"
                            : "bg-gradient-to-r from-blue-400 to-blue-600"
                      }`}
                      style={{ width: `${Math.max(barWidth, 8)}%` }}
                    >
                      <span className="text-xs font-bold text-white mix-blend-multiply">
                        {barWidth > 15 ? `${Math.round(barWidth)}%` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-700 flex justify-between">
                    <span>
                      Șanse:{" "}
                      <strong>{getWinChance(team.averageGrade || 0)}%</strong>
                    </span>
                    {isStrongest && (
                      <span className="font-bold text-green-700">
                        🏆 FAVORITĂ
                      </span>
                    )}
                    {isWeakest && (
                      <span className="font-bold text-red-600">⚠️ SLABĂ</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-white/70 rounded-md border-l-4 border-blue-400">
            <p className="text-xs font-semibold text-gray-800">
              Diferență:{" "}
              <strong
                className={
                  gradeRange < 1
                    ? "text-green-700"
                    : gradeRange < 3
                      ? "text-yellow-700"
                      : "text-red-600"
                }
              >
                {gradeRange.toFixed(2)}
              </strong>{" "}
              puncte
              {gradeRange < 1 && " ✅ Foarte echilibrate"}
              {gradeRange >= 1 && gradeRange < 3 && " ⚠️ Echilibrate"}
              {gradeRange >= 3 && " ❌ Dezechilibrate"}
            </p>
          </div>
        </div>
      </div>

      <div
        id="teams-capture"
        className="relative bg-white p-6 rounded-xl shadow-xl overflow-hidden"
      >
        <img
          src="/images/galero-logo.jpg"
          alt="Galero Background"
          className="absolute opacity-10 inset-0 w-full h-full object-contain pointer-events-none z-0"
        />

        <div className="mb-8 text-center border-b pb-4 relative z-10">
          <img
            src="/images/galero-logo.jpg"
            alt="Galero Logo"
            className="mx-auto h-20 mb-2 rounded-full border border-gray-300 shadow"
          />
          <h1 className="text-2xl font-bold text-gray-800">
            🏆 Galero - Ediția #{numarEditie}
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
                <ul className="space-y-1.5">
                  {team.players.map((player) => (
                    <li
                      key={player.id}
                      className="text-sm p-2 bg-white/60 rounded-md shadow-sm flex justify-between items-center hover:bg-white/80 transition"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{player.full_name}</span>
                        {player.totalEditions !== undefined && (
                          <span
                            className={`text-xs ml-1 ${
                              player.totalEditions === 1
                                ? "text-red-400 font-semibold"
                                : "text-gray-500"
                            }`}
                          >
                            {player.totalEditions === 1
                              ? "(Nou)"
                              : `(${player.totalEditions} prez.)`}
                          </span>
                        )}
                        {player.position === "GK" && (
                          <span className="text-xs ml-1 font-bold text-purple-600">
                            🧤 GK
                          </span>
                        )}
                      </div>
                      <div className="text-right ml-2">
                        {showGrades && (
                          <span className="font-bold text-blue-700 text-base grade-display">
                            {player.grade || 0}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
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
