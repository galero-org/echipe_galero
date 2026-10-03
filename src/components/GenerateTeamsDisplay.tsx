import React, { useState } from "react";
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

function getGridColsClass(teamCount: number): string {
  if (teamCount <= 1) return "lg:grid-cols-1";
  if (teamCount === 2) return "lg:grid-cols-2";
  if (teamCount === 3) return "lg:grid-cols-3";
  return "lg:grid-cols-4";
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

/** Creează imaginea PNG folosită atât la descărcare, cât și la partajare. */
async function createTeamsImage(numarEditie: number): Promise<File | null> {
  const element = document.getElementById(CAPTURE_ELEMENT_ID);
  if (!element) return null;

  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Imaginea nu a putut fi creată.");

  const date = new Date().toISOString().slice(0, 10);
  return new File([blob], `echipe-ed${numarEditie}-${date}.png`, {
    type: "image/png",
  });
}

function downloadImage(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --- Subcomponente -------------------------------------------------------------

const Toolbar: React.FC<{
  isSaving: boolean;
  onExport: () => void;
  onShare: () => void;
  onSave: () => void;
}> = ({ isSaving, onExport, onShare, onSave }) => (
  <div className="mb-6 flex flex-wrap gap-2">
    <button
      type="button"
      onClick={onShare}
      className="rounded-md bg-green-700 px-4 py-2 font-medium text-white transition hover:bg-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
    >
      Trimite pe WhatsApp
    </button>
    <button
      type="button"
      onClick={onExport}
      className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-800 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
    >
      Descarcă PNG
    </button>
    <button
      type="button"
      onClick={onSave}
      disabled={isSaving}
      className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-800 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 disabled:cursor-wait disabled:opacity-50"
    >
      {isSaving ? "Se salvează..." : "Salvează generarea"}
    </button>
  </div>
);

const PlayerRow: React.FC<{ player: TeamPlayer }> = ({ player }) => (
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
  </li>
);

const TeamCard: React.FC<{
  team: Team;
  idx: number;
}> = ({ team, idx }) => {
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

      <h4 className="text-sm font-medium mb-2">Jucători:</h4>
      <ul className="space-y-1">
        {team.players.map((player) => (
          <PlayerRow key={player.id} player={player} />
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
  const { isSaving, saveGeneration } = useSaveTeamGeneration({
    editionId: edition_id,
    teamCount,
    playersPerTeam,
    teams,
  });
  const gridColsClass = getGridColsClass(teamCount);

  const handleExport = async () => {
    try {
      const image = await createTeamsImage(numarEditie);
      if (image) downloadImage(image);
    } catch (err) {
      console.error("Error exporting teams image:", err);
      alert("Eroare la exportarea imaginii.");
    }
  };

  const handleShare = async () => {
    try {
      const image = await createTeamsImage(numarEditie);
      if (!image) return;

      if (navigator.canShare?.({ files: [image] }) && navigator.share) {
        await navigator.share({
          files: [image],
          title: `Echipe Galero - ediția #${numarEditie}`,
          text: `Echipele pentru ediția #${numarEditie}`,
        });
        return;
      }

      downloadImage(image);
      alert("Imaginea a fost descărcată. Atașeaz-o în grupul WhatsApp.");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Error sharing teams image:", err);
      alert("Eroare la pregătirea imaginii pentru WhatsApp.");
    }
  };

  if (!teams || teams.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-3">
        2. Echipe Generate
      </h2>

      <Toolbar
        isSaving={isSaving}
        onExport={handleExport}
        onShare={handleShare}
        onSave={saveGeneration}
      />

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
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GeneratedTeamsDisplay;
