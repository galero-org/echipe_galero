import React, { useState } from "react";
import type { Team } from "../lib/types";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";

interface Props {
  teams: Team[];
  teamCount: number;
  numarEditie?: number;
}

/** Un jucător așa cum apare în interiorul unei echipe generate. */
type TeamPlayer = Team["players"][number];

// --- Constante ---------------------------------------------------------------

const CAPTURE_ELEMENT_ID = "teams-capture";
const IMAGE_WIDTH = 1080;
const MIN_PORTRAIT_RATIO = 5 / 4;

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

/** Captures the existing cards in a phone-first portrait layout. */
async function createTeamsImage(
  numarEditie: number,
): Promise<File | null> {
  const element = document.getElementById(CAPTURE_ELEMENT_ID);
  if (!element) return null;

  const renderedCanvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 1,
    useCORS: true,
    logging: false,
    width: IMAGE_WIDTH,
    windowWidth: IMAGE_WIDTH,
    onclone: (clonedDocument) => {
      clonedDocument.documentElement.classList.remove("dark");
      clonedDocument.body.classList.remove("dark");
      clonedDocument.documentElement.style.colorScheme = "light";
      clonedDocument.documentElement.style.backgroundColor = "#ffffff";
      clonedDocument.body.style.colorScheme = "light";
      clonedDocument.body.style.backgroundColor = "#ffffff";

      const clonedElement = clonedDocument.getElementById(CAPTURE_ELEMENT_ID);
      if (!clonedElement) return;
      clonedElement.style.width = `${IMAGE_WIDTH}px`;
      clonedElement.style.maxWidth = "none";
      clonedElement.style.minHeight = "0";
      clonedElement.style.overflow = "visible";
      clonedElement.style.backgroundColor = "#ffffff";
      clonedElement.style.padding = "24px";

      const teamGrid =
        clonedElement.querySelector<HTMLElement>("[data-teams-grid]");
      if (teamGrid) {
        teamGrid.style.display = "grid";
        teamGrid.style.gridTemplateColumns = "minmax(0, 1fr)";
        teamGrid.style.gap = "16px";
        teamGrid.style.transform = "none";
      }

      clonedElement
        .querySelectorAll<HTMLElement>("[data-team-card]")
        .forEach((card) => {
          card.style.padding = "18px";
          card.style.borderRadius = "8px";
          card.style.backgroundColor = "#ffffff";
          card.style.opacity = "1";
          card.style.transform = "none";
        });
      clonedElement
        .querySelectorAll<HTMLElement>("[data-team-title]")
        .forEach((title) => {
          title.style.fontSize = "28px";
          title.style.lineHeight = "1.2";
        });
      clonedElement
        .querySelectorAll<HTMLElement>("[data-team-count]")
        .forEach((count) => {
          count.style.fontSize = "17px";
          count.style.whiteSpace = "nowrap";
        });
      clonedElement
        .querySelectorAll<HTMLElement>("[data-team-metric-label]")
        .forEach((label) => {
          label.style.fontSize = "16px";
        });
      clonedElement
        .querySelectorAll<HTMLElement>("[data-team-metric-value]")
        .forEach((value) => {
          value.style.fontSize = "23px";
        });
      clonedElement
        .querySelectorAll<HTMLElement>("[data-team-players-heading]")
        .forEach((heading) => {
          heading.style.fontSize = "19px";
        });
      clonedElement
        .querySelectorAll<HTMLElement>("[data-team-player]")
        .forEach((row) => {
          row.style.padding = "9px 8px";
          row.style.fontSize = "18px";
          row.style.lineHeight = "1.25";
          row.style.color = "#1f2937";
        });
      clonedElement
        .querySelectorAll<HTMLElement>("[data-player-name]")
        .forEach((name) => {
          name.style.display = "inline-block";
          name.style.maxWidth = "100%";
          name.style.overflow = "hidden";
          name.style.textOverflow = "ellipsis";
          name.style.whiteSpace = "nowrap";
        });
      clonedElement
        .querySelectorAll<HTMLElement>("[data-player-presence]")
        .forEach((presence) => {
          presence.style.fontSize = "15px";
          presence.style.whiteSpace = "nowrap";
        });
    },
  });

  const outputWidth = renderedCanvas.width;
  const outputHeight = Math.max(
    renderedCanvas.height,
    Math.ceil(outputWidth * MIN_PORTRAIT_RATIO),
  );
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, outputWidth, outputHeight);
  context.drawImage(renderedCanvas, 0, 0);

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

const Toolbar: React.FC<{ isSharing: boolean; onShare: () => void }> = ({
  isSharing,
  onShare,
}) => (
  <div className="mb-6 flex flex-wrap gap-2">
    <button
      type="button"
      onClick={onShare}
      disabled={isSharing}
      className="rounded-md bg-green-700 px-4 py-2 font-medium text-white transition hover:bg-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
    >
      {isSharing ? "Se pregătește imaginea..." : "Trimite pe WhatsApp"}
    </button>
  </div>
);

function formatPresenceCount(count: number): string {
  return count === 1 ? "(1 prezență)" : `(${count} prezențe)`;
}

const PlayerRow: React.FC<{ player: TeamPlayer }> = ({ player }) => (
  <li
    data-team-player
    className="text-sm p-2 bg-white/70 rounded-md shadow-sm flex justify-between items-center hover:bg-white/90 transition"
  >
    <div className="flex-1">
      <span data-player-name className="font-medium">
        {player.full_name}
      </span>
      {player.totalEditions !== undefined && (
        <span data-player-presence className="ml-1 text-xs text-gray-500">
          {formatPresenceCount(player.totalEditions)}
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
      data-team-card
      className={`rounded-xl shadow-lg p-4 sm:p-5 border-t-4 bg-white bg-opacity-90 ${
        team.color || "border-gray-500 text-gray-800"
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3
          data-team-title
          className={`text-lg sm:text-xl font-bold ${textColorClass}`}
        >
          {team.name}
        </h3>
        <span
          data-team-count
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            team.color || "bg-gray-200 text-gray-700"
          }`}
        >
          {team.players.length} jucători
        </span>
      </div>

      <dl className="mb-3 grid grid-cols-1 gap-2 text-sm">
        <div className="rounded-md bg-gray-50 px-3 py-2">
          <dt data-team-metric-label className="text-xs text-gray-500">
            AVG notă
          </dt>
          <dd
            data-team-metric-value
            className={`font-semibold ${textColorClass}`}
          >
            {(team.averageGrade ?? 0).toFixed(2)}
          </dd>
        </div>
      </dl>

      <h4 data-team-players-heading className="text-sm font-medium mb-2">
        Jucători:
      </h4>
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
  numarEditie = 0,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const gridColsClass = getGridColsClass(teamCount);

  const handleShare = async () => {
    setIsSharing(true);
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
    } finally {
      setIsSharing(false);
    }
  };

  if (!teams || teams.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-3">
        2. Echipe Generate
      </h2>

      <Toolbar isSharing={isSharing} onShare={handleShare} />

      <div
        id={CAPTURE_ELEMENT_ID}
        className="relative overflow-hidden rounded-xl bg-white p-4 shadow-xl sm:p-6"
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
            data-teams-grid
            layout
            className={`relative z-10 grid grid-cols-1 md:grid-cols-2 ${gridColsClass} gap-4 sm:gap-6`}
          >
            {teams.map((team, idx) => (
              <TeamCard key={team.name + "-" + idx} team={team} idx={idx} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GeneratedTeamsDisplay;
