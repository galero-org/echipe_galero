import React, { useState, useMemo } from "react";
import type { Team } from "../lib/types";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";

interface Props {
  teams: Team[];
  teamCount: number;
  edition_id: string;
  numarEditie?: number;
  playersPerTeam?: number;
}

/** Un jucător așa cum apare în interiorul unei echipe generate. */
type TeamPlayer = Team["players"][number];

// --- Constante ---------------------------------------------------------------

/** Clasă CSS folosită pentru a ascunde notele la exportul imaginii (vezi useExportTeamsAsImage). */
const GRADE_DISPLAY_CLASS = "grade-display";

/** ID-ul elementului DOM capturat la exportul imaginii. */
const CAPTURE_ELEMENT_ID = "teams-capture";

const CARD_VARIANTS = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
  exit: { opacity: 0, scale: 0.95, y: -10 },
};

// --- Helpers pure (fără efecte secundare) -------------------------------------

/** Extrage clasa de culoare text din string-ul de clase al echipei (ex: "border-blue-500 bg-blue-100 text-blue-800"). */
function getTeamTextColorClass(team: Team): string {
  return team.color ? team.color.split(" ")[2] : "text-gray-800";
}

/** Procent din suma mediilor tuturor echipelor — folosit doar ca indicator orientativ, nu o probabilitate reală. */
function formatWinChance(teamAverage: number, totalAverage: number): string {
  return totalAverage ? ((teamAverage / totalAverage) * 100).toFixed(1) : "0";
}

function getGridColsClass(teamCount: number): string {
  if (teamCount <= 1) return "lg:grid-cols-1";
  if (teamCount === 2) return "lg:grid-cols-2";
  if (teamCount === 3) return "lg:grid-cols-3";
  return "lg:grid-cols-4";
}

function getPlayerGrade(player: TeamPlayer): number {
  return player.grade || 0;
}

// --- Hooks (logică cu efecte secundare, separată de randare) ------------------

/** Gestionează salvarea generării curente de echipe prin POST către API. */
function useSaveTeamGeneration(params: {
  editionId: string;
  teamCount: number;
  playersPerTeam: number;
  teams: Team[];
}) {
  const [isSaving, setIsSaving] = useState(false);

  const saveGeneration = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/team-generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edition_id: params.editionId,
          team_count: params.teamCount,
          players_per_team: params.playersPerTeam,
          generated_teams: params.teams,
        }),
      });

      if (response.ok) {
        alert("✅ Generare salvată!");
      } else {
        alert("❌ Eroare la salvare");
      }
    } catch (err) {
      console.error("Error saving team generation:", err);
      alert("❌ Eroare la salvare");
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, saveGeneration };
}

/** Exportă elementul cu id-ul dat ca imagine PNG, ascunzând temporar notele (dacă sunt vizibile). */
function useExportTeamsAsImage(numarEditie: number) {
  const exportAsImage = async () => {
    const element = document.getElementById(CAPTURE_ELEMENT_ID);
    if (!element) return;

    const gradeElements = element.querySelectorAll<HTMLElement>(
      `.${GRADE_DISPLAY_CLASS}`,
    );
    gradeElements.forEach((el) => (el.style.display = "none"));

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `echipe-ed${numarEditie}-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (err) {
      console.error("Error exporting teams image:", err);
      alert("❌ Eroare la exportarea imaginii");
    } finally {
      // Garantăm refacerea vizibilității notelor chiar dacă exportul eșuează.
      gradeElements.forEach((el) => (el.style.display = ""));
    }
  };

  return exportAsImage;
}

// --- Subcomponente -------------------------------------------------------------

const Toolbar: React.FC<{
  isSaving: boolean;
  showGrades: boolean;
  onExport: () => void;
  onSave: () => void;
  onToggleGrades: () => void;
}> = ({ isSaving, showGrades, onExport, onSave, onToggleGrades }) => (
  <div className="flex gap-3 mb-6 flex-wrap">
    <button
      type="button"
      onClick={onExport}
      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
    >
      📥 Exportă imaginea
    </button>
    <button
      type="button"
      onClick={onSave}
      disabled={isSaving}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
    >
      {isSaving ? "Se salvează..." : "💾 Salvează generarea"}
    </button>
    <button
      type="button"
      onClick={onToggleGrades}
      className={`px-4 py-2 rounded-md transition ${
        showGrades
          ? "bg-yellow-600 text-white hover:bg-yellow-700"
          : "bg-gray-600 text-white hover:bg-gray-700"
      }`}
    >
      {showGrades ? "👁️ Ascunde notele" : "👁️ Arată notele"}
    </button>
  </div>
);

const TopPlayersPanel: React.FC<{
  players: TeamPlayer[];
  showGrades: boolean;
}> = ({ players, showGrades }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
    <div className="lg:col-span-1 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
      <h3 className="font-bold text-lg text-yellow-900 mb-3">
        🌟 Top Jucători
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {players.slice(0, 24).map((player, idx) => (
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
                <span
                  className={`font-bold text-yellow-700 text-lg ${GRADE_DISPLAY_CLASS}`}
                >
                  {getPlayerGrade(player)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PlayerRow: React.FC<{ player: TeamPlayer; showGrades: boolean }> = ({
  player,
  showGrades,
}) => (
  <li className="text-sm p-2 bg-white/70 rounded-md shadow-sm flex justify-between items-center hover:bg-white/90 transition">
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
        <span className="text-xs ml-1 font-bold text-purple-600">🧤 GK</span>
      )}
    </div>
    <div className="text-right ml-2">
      {showGrades && (
        <span
          className={`font-bold text-blue-700 text-base ${GRADE_DISPLAY_CLASS}`}
        >
          {getPlayerGrade(player)}
        </span>
      )}
    </div>
  </li>
);

const TeamCard: React.FC<{
  team: Team;
  idx: number;
  totalAvg: number;
  showGrades: boolean;
}> = ({ team, idx, totalAvg, showGrades }) => {
  const textColorClass = getTeamTextColorClass(team);

  return (
    <motion.div
      layout
      custom={idx}
      variants={CARD_VARIANTS}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`rounded-xl shadow-lg p-4 sm:p-5 border-t-4 bg-white bg-opacity-90 ${
        team.color || "border-gray-500 text-gray-800"
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className={`text-lg sm:text-xl font-bold ${textColorClass}`}>
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
        <span className={`font-bold text-lg ${textColorClass}`}>
          {team.averageGrade?.toFixed(2)}
        </span>
      </p>
      <p className="mb-3 text-sm">
        Șanse de câștig:{" "}
        <span className="font-semibold text-green-700">
          {formatWinChance(team.averageGrade || 0, totalAvg)}%
        </span>
      </p>

      <h4 className="text-sm font-medium mb-2">Jucători:</h4>
      <ul className="space-y-1">
        {team.players.map((player) => (
          <PlayerRow key={player.id} player={player} showGrades={showGrades} />
        ))}
      </ul>
    </motion.div>
  );
};

// --- Componenta principală ------------------------------------------------------

const GeneratedTeamsDisplay: React.FC<Props> = ({
  teams,
  teamCount,
  edition_id,
  numarEditie = 0,
  playersPerTeam = 6,
}) => {
  const [showGrades, setShowGrades] = useState(true);

  const { isSaving, saveGeneration } = useSaveTeamGeneration({
    editionId: edition_id,
    teamCount,
    playersPerTeam,
    teams,
  });
  const exportAsImage = useExportTeamsAsImage(numarEditie);

  const allPlayersInTeams = useMemo(
    () =>
      teams
        .flatMap((team) => team.players)
        .sort((a, b) => getPlayerGrade(b) - getPlayerGrade(a)),
    [teams],
  );

  const totalAvg = useMemo(
    () => teams.reduce((acc, t) => acc + (t.averageGrade || 0), 0),
    [teams],
  );

  const gridColsClass = useMemo(() => getGridColsClass(teamCount), [teamCount]);

  if (!teams || teams.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-3">
        2. Echipe Generate
      </h2>

      <Toolbar
        isSaving={isSaving}
        showGrades={showGrades}
        onExport={exportAsImage}
        onSave={saveGeneration}
        onToggleGrades={() => setShowGrades((v) => !v)}
      />

      <TopPlayersPanel players={allPlayersInTeams} showGrades={showGrades} />

      <div
        id={CAPTURE_ELEMENT_ID}
        className="relative bg-white p-4 sm:p-6 rounded-xl shadow-xl overflow-hidden"
      >
        <img
          src="/images/galero-logo.jpg"
          alt="Galero Background"
          className="absolute opacity-10 inset-0 w-full h-full object-contain pointer-events-none z-0"
        />

        <div className="mb-6 text-center border-b pb-3 relative z-10">
          <img
            src="/images/galero-logo.jpg"
            alt="Galero Logo"
            className="mx-auto h-16 sm:h-20 mb-2 rounded-full border border-gray-300 shadow"
          />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            🏆 Galero - Ediția #{numarEditie}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            powered by <strong>www.galero.ro</strong> · Șanse egale · Fair Play
          </p>
        </div>

        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className={`relative z-10 grid grid-cols-1 md:grid-cols-2 ${gridColsClass} gap-4 sm:gap-6`}
          >
            {teams.map((team, idx) => (
              <TeamCard
                key={team.name + "-" + idx}
                team={team}
                idx={idx}
                totalAvg={totalAvg}
                showGrades={showGrades}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GeneratedTeamsDisplay;
