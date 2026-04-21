import React, { useMemo } from "react";

interface StatisticiJucator {
  nume: string;
  gf: number;
  gc: number;
  gt: number;
  prezente: number;
  eficienta: number;
}

interface Meci {
  etapa: string | number;
  echipa1: string;
  scor1: number | string;
  scor2: number | string;
  echipa2: string;
  marcatoriEchipa1: string[];
  marcatoriEchipa2: string[];
}

interface EditieData {
  nume: string;
  prezente: string[];
  meciuri: Meci[];
  golgheteri: string[];
  statistici: StatisticiJucator[];
}

interface EditionPageProps {
  editie: EditieData;
  editionId: string;
}

// --- CONFIGURAȚIE CULORI ECHIPE ---
const CULORI_ECHIPE: { [key: string]: string } = {
  Verde: "text-green-600 border-green-600",
  Albastru: "text-blue-600 border-blue-600",
  Portocaliu: "text-orange-600 border-orange-600",
  Gri: "text-gray-600 border-gray-600",
};
const ECHIPE_VALIDE = ["Verde", "Albastru", "Portocaliu", "Gri"];

// --- INTERFEȚĂ PENTRU CLASAMENT ---
interface ClasamentEntry {
  echipa: string;
  victorii: number;
  egaluri: number;
  infrangeri: number;
  goluriMarcate: number;
  goluriPrimite: number;
  puncte: number;
  golaveraj: number;
  criteriuDeDepartajare?: string;
}

// Interfață pentru statisticile calculate
interface EchipăStatisticiCalculată {
  echipa: string;
  goluriMarcate: number; // Total
  goluriPrimite: number; // Total
  gmCampionat: number;
  gpCampionat: number;
  gmFinala: number;
  gpFinala: number;
}

interface StatAttackDefense {
  echipa: string;
  gm?: number;
  gp?: number;
}

interface StatisticiGeneraleCalculate {
  victoriiGazde: number;
  victoriiOaspeti: number;
  egaluri: number;
  goluriCampionat: number;
  goluriFinale: number;
  totalGoluri: number;
  echipeStats: { [key: string]: EchipăStatisticiCalculată };
  bestAttackCampionat: StatAttackDefense;
  worstAttackCampionat: StatAttackDefense;
  bestDeffenseCampionat: StatAttackDefense;
  worstDeffenseCampionat: StatAttackDefense;
  bestAttackFinala: StatAttackDefense;
  worstAttackFinala: StatAttackDefense;
  bestDeffenseFinala: StatAttackDefense;
  worstDeffenseFinala: StatAttackDefense;
  bestAttackAll: StatAttackDefense;
  worstAttackAll: StatAttackDefense;
  bestDeffenseAll: StatAttackDefense;
  worstDeffenseAll: StatAttackDefense;
}

// --- ⚙️ LOGICA DE FILTRARE ȘI CLASIFICARE ---

/**
 * Determină dacă un rând este un meci valid și îl clasifică.
 * Aceasta este cheia pentru a evita rândurile de antet și clasament din datele tale.
 * @returns "Campionat", "Finala", sau null
 */
const getMatchClassificationStrict = (
  m: Meci
): "Campionat" | "Finala" | null => {
  const scor1 = Number(m.scor1);
  const scor2 = Number(m.scor2);

  if (isNaN(scor1) || isNaN(scor2) || scor1 === null || scor2 === null) {
    return null;
  }

  // 2. Echipele trebuie să fie cele 4 nume valide (excludem rândurile de clasament false)
  if (
    !ECHIPE_VALIDE.includes(m.echipa1) ||
    !ECHIPE_VALIDE.includes(m.echipa2)
  ) {
    return null;
  }

  const etapaStr = String(m.etapa).toUpperCase().trim();
  const isFinala = etapaStr.includes("FINALĂ");
  const isCampionatNumeric =
    /^\d+$/.test(etapaStr) && Number(etapaStr) >= 1 && Number(etapaStr) <= 6; // Presupunem max 6 etape de campionat

  if (isFinala) {
    return "Finala";
  }

  if (isCampionatNumeric) {
    return "Campionat";
  }

  // Ignoră orice altceva (ex. rânduri "Clasament", "Loc" etc., chiar dacă au scoruri numerice 0)
  return null;
};

// --- ⚙️ LOGICA DE CALCUL CLASAMENT (Meciuri Directe) ---

const calculeazaMeciuriDirecte = (
  echipaA: string,
  echipaB: string,
  meciuriToate: Meci[]
) => {
  let puncteA = 0;
  let puncteB = 0;

  meciuriToate.forEach((m) => {
    // Aplică aceeași filtrare strictă
    if (getMatchClassificationStrict(m) !== "Campionat") return;

    const isMatch =
      (m.echipa1 === echipaA && m.echipa2 === echipaB) ||
      (m.echipa1 === echipaB && m.echipa2 === echipaA);

    if (isMatch) {
      const scor1 = Number(m.scor1);
      const scor2 = Number(m.scor2);

      if (m.echipa1 === echipaA) {
        if (scor1 > scor2) puncteA += 3;
        else if (scor1 === scor2) puncteA += 1;
        else if (scor1 < scor2) puncteB += 3;
      } else {
        if (scor1 > scor2) puncteB += 3;
        else if (scor1 === scor2) puncteB += 1;
        else if (scor1 < scor2) puncteA += 3;
      }
    }
  });

  return { puncteA, puncteB };
};

const calculeazaClasament = (
  meciuri: Meci[],
  esteClasamentFinal: boolean
): ClasamentEntry[] => {
  const clasamentMap: { [key: string]: ClasamentEntry } = {};

  // Inițializează intrările doar pentru echipele valide
  ECHIPE_VALIDE.forEach((echipa) => {
    clasamentMap[echipa] = {
      echipa,
      victorii: 0,
      egaluri: 0,
      infrangeri: 0,
      goluriMarcate: 0,
      goluriPrimite: 0,
      puncte: 0,
      golaveraj: 0,
      criteriuDeDepartajare: undefined,
    };
  });

  meciuri.forEach((m) => {
    // Folosește noul filtru strict!
    if (getMatchClassificationStrict(m) !== "Campionat") return;

    const scor1 = Number(m.scor1);
    const scor2 = Number(m.scor2);

    const c1 = clasamentMap[m.echipa1];
    const c2 = clasamentMap[m.echipa2];

    // Dacă din orice motiv o echipă nu e în map (nu ar trebui să se întâmple cu filtrarea strictă)
    if (!c1 || !c2) return;

    // Actualizare Goluri
    c1.goluriMarcate += scor1;
    c1.goluriPrimite += scor2;
    c2.goluriMarcate += scor2;
    c2.goluriPrimite += scor1;

    // Actualizare Puncte/Rezultat
    if (scor1 > scor2) {
      c1.victorii += 1;
      c1.puncte += 3;
      c2.infrangeri += 1;
    } else if (scor1 < scor2) {
      c2.victorii += 1;
      c2.puncte += 3;
      c1.infrangeri += 1;
    } else {
      c1.egaluri += 1;
      c2.egaluri += 1;
      c1.puncte += 1;
      c2.puncte += 1;
    }
  });

  const finalClasament = Object.values(clasamentMap).map((c) => {
    c.golaveraj = c.goluriMarcate - c.goluriPrimite;
    c.criteriuDeDepartajare = undefined;
    return c;
  });

  const compareEntries = (a: ClasamentEntry, b: ClasamentEntry) => {
    // 1. Puncte
    if (b.puncte !== a.puncte) return b.puncte - a.puncte;

    // --- CRITERII DE DEPARTAJARE (Aplicare condiționată DOAR la final) ---
    if (a.puncte === b.puncte && esteClasamentFinal) {
      const meciuriDirecte = calculeazaMeciuriDirecte(
        a.echipa,
        b.echipa,
        meciuri
      );

      // 2. Meciuri Directe (Puncte)
      if (meciuriDirecte.puncteA !== meciuriDirecte.puncteB) {
        const result = meciuriDirecte.puncteB - meciuriDirecte.puncteA;
        if (result < 0) a.criteriuDeDepartajare = "Meciuri Directe (Pct.)";
        else if (result > 0) b.criteriuDeDepartajare = "Meciuri Directe (Pct.)";
        return result;
      }

      // 3. Golaveraj General
      if (b.golaveraj !== a.golaveraj) {
        const result = b.golaveraj - a.golaveraj;
        if (result > 0) a.criteriuDeDepartajare = "Golaveraj General";
        else b.criteriuDeDepartajare = "Golaveraj General";
        return result;
      }

      // 4. Goluri Marcate
      if (b.goluriMarcate !== a.goluriMarcate) {
        const result = b.goluriMarcate - a.goluriMarcate;
        if (result > 0) a.criteriuDeDepartajare = "Goluri Marcate";
        else b.criteriuDeDepartajare = "Goluri Marcate";
        return result;
      }
    }

    return a.echipa.localeCompare(b.echipa);
  };

  // Filtrează echipele care au participat la campionat (au măcar 1 punct)
  const clasamentFiltrat = finalClasament.filter(
    (c) => c.victorii + c.egaluri + c.infrangeri > 0
  );

  clasamentFiltrat.sort(compareEntries);

  return clasamentFiltrat;
};

// --- LOGICA DE CALCUL STATISTICI GENERALE ---

const calculeazaStatisticiGenerale = (
  meciuri: Meci[]
): StatisticiGeneraleCalculate => {
  const stats: Partial<StatisticiGeneraleCalculate> = {
    victoriiGazde: 0,
    victoriiOaspeti: 0,
    egaluri: 0,
    goluriCampionat: 0,
    goluriFinale: 0,
    totalGoluri: 0,
  };

  const echipeStats: {
    [key: string]: EchipăStatisticiCalculată;
  } = {};

  // Inițializează statisticile doar pentru echipele valide
  ECHIPE_VALIDE.forEach((echipa) => {
    echipeStats[echipa] = {
      echipa,
      goluriMarcate: 0,
      goluriPrimite: 0,
      gmCampionat: 0,
      gpCampionat: 0,
      gmFinala: 0,
      gpFinala: 0,
    };
  });

  meciuri.forEach((m) => {
    const type = getMatchClassificationStrict(m);
    if (!type) return; // Ignorează rândurile care nu sunt meciuri reale

    const e1 = m.echipa1;
    const e2 = m.echipa2;
    const scor1 = Number(m.scor1);
    const scor2 = Number(m.scor2);

    if (!echipeStats[e1] || !echipeStats[e2]) return;

    // Calcul total
    stats.totalGoluri! += scor1 + scor2;

    const isCamp = type === "Campionat";
    const isFin = type === "Finala";

    if (isCamp) {
      stats.goluriCampionat! += scor1 + scor2;
    } else if (isFin) {
      stats.goluriFinale! += scor1 + scor2;
    }

    // Rezultate (aplicate ca și cum Echipa 1 ar fi "gazda")
    if (scor1 > scor2) {
      stats.victoriiGazde! += 1;
    } else if (scor1 < scor2) {
      stats.victoriiOaspeti! += 1;
    } else {
      stats.egaluri! += 1;
    }

    // Goluri Echipa 1
    echipeStats[e1].goluriMarcate += scor1;
    echipeStats[e1].goluriPrimite += scor2;
    if (isCamp) {
      echipeStats[e1].gmCampionat += scor1;
      echipeStats[e1].gpCampionat += scor2;
    } else if (isFin) {
      echipeStats[e1].gmFinala += scor1;
      echipeStats[e1].gpFinala += scor2;
    }

    // Goluri Echipa 2
    echipeStats[e2].goluriMarcate += scor2;
    echipeStats[e2].goluriPrimite += scor1;
    if (isCamp) {
      echipeStats[e2].gmCampionat += scor2;
      echipeStats[e2].gpCampionat += scor1;
    } else if (isFin) {
      echipeStats[e2].gmFinala += scor2;
      echipeStats[e2].gpFinala += scor1;
    }
  });

  // Funcție utilitară pentru a găsi cel mai bun/slab
  const findBestWorst = (
    metric: "gm" | "gp",
    type: "Campionat" | "Finala" | "Total"
  ) => {
    const keyM =
      metric === "gm"
        ? type === "Campionat"
          ? "gmCampionat"
          : type === "Finala"
            ? "gmFinala"
            : "goluriMarcate"
        : type === "Campionat"
          ? "gpCampionat"
          : type === "Finala"
            ? "gpFinala"
            : "goluriPrimite";

    const isAttack = metric === "gm";

    // Filtrează echipele care au participat la faza respectivă (au marcat sau primit goluri)
    const statsFiltate = Object.values(echipeStats).filter((s) => {
      if (type === "Total") return s.goluriMarcate + s.goluriPrimite > 0;
      return (
        (type === "Campionat"
          ? s.gmCampionat + s.gpCampionat
          : s.gmFinala + s.gpFinala) > 0
      );
    });

    if (statsFiltate.length === 0) {
      return {
        best: { echipa: "N/A", [metric]: 0 } as StatAttackDefense,
        worst: { echipa: "N/A", [metric]: 0 } as StatAttackDefense,
      };
    }

    let bestValue = isAttack ? -1 : Infinity; // Max GM, Min GP
    let worstValue = isAttack ? Infinity : -1; // Min GM, Max GP
    let bestTeams: string[] = [];
    let worstTeams: string[] = [];

    statsFiltate.forEach((s) => {
      const value = s[keyM as keyof EchipăStatisticiCalculată] as number;

      // BEST (Max GM / Min GP)
      if ((isAttack && value > bestValue) || (!isAttack && value < bestValue)) {
        bestValue = value;
        bestTeams = [s.echipa];
      } else if (value === bestValue) {
        bestTeams.push(s.echipa);
      }

      // WORST (Min GM / Max GP)
      if (
        (isAttack && value < worstValue) ||
        (!isAttack && value > worstValue)
      ) {
        worstValue = value;
        worstTeams = [s.echipa];
      } else if (value === worstValue) {
        worstTeams.push(s.echipa);
      }
    });

    return {
      best: {
        echipa: bestTeams.join(", "),
        [metric]: bestValue,
      } as StatAttackDefense,
      worst: {
        echipa: worstTeams.join(", "),
        [metric]: worstValue,
      } as StatAttackDefense,
    };
  };

  // Extrage statisticile de atac/apărare
  const campionatAttack = findBestWorst("gm", "Campionat");
  const campionatDeffense = findBestWorst("gp", "Campionat");
  const finalaAttack = findBestWorst("gm", "Finala");
  const finalaDeffense = findBestWorst("gp", "Finala");
  const totalAttack = findBestWorst("gm", "Total");
  const totalDeffense = findBestWorst("gp", "Total");

  return {
    ...stats,
    echipeStats: echipeStats as any,
    bestAttackCampionat: campionatAttack.best,
    worstAttackCampionat: campionatAttack.worst,
    bestDeffenseCampionat: campionatDeffense.best,
    worstDeffenseCampionat: campionatDeffense.worst,
    bestAttackFinala: finalaAttack.best,
    worstAttackFinala: finalaAttack.worst,
    bestDeffenseFinala: finalaDeffense.best,
    worstDeffenseFinala: finalaDeffense.worst,
    bestAttackAll: totalAttack.best,
    worstAttackAll: totalAttack.worst,
    bestDeffenseAll: totalDeffense.best,
    worstDeffenseAll: totalDeffense.worst,
  } as StatisticiGeneraleCalculate;
};

// --- COMPONENTE DE AFIȘARE (Rămân neschimbate sau cu mici ajustări) ---

const ClasamentTabel: React.FC<{
  clasament: ClasamentEntry[];
  showTieBreaker: boolean;
}> = ({ clasament, showTieBreaker }) => (
  <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden text-sm mt-4">
    <thead className="bg-blue-100">
      <tr>
        <th className="py-2 px-3 text-left font-bold text-gray-700">#</th>
        <th className="py-2 px-3 text-left font-bold text-gray-700">Echipa</th>
        <th className="py-2 px-3 font-bold text-gray-700">V</th>
        <th className="py-2 px-3 font-bold text-gray-700">E</th>
        <th className="py-2 px-3 font-bold text-gray-700">Î</th>
        <th className="py-2 px-3 font-bold text-gray-700">GM</th>
        <th className="py-2 px-3 font-bold text-gray-700">GP</th>
        <th className="py-2 px-3 font-bold text-gray-700">GA</th>
        <th className="py-2 px-3 font-bold text-gray-700">Pct</th>
      </tr>
    </thead>
    <tbody>
      {clasament.map((c, index) => (
        <tr
          key={c.echipa}
          className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
        >
          <td className="py-2 px-3 text-center">{index + 1}</td>

          <td
            className={`py-2 px-3 font-semibold ${CULORI_ECHIPE[c.echipa] || "text-gray-800"}`}
          >
            {c.echipa}

            {showTieBreaker && c.criteriuDeDepartajare && (
              <span className="block text-xs font-normal text-red-500 mt-0.5">
                (Dep. prin: {c.criteriuDeDepartajare})
              </span>
            )}
          </td>

          <td className="py-2 px-3 text-center">{c.victorii}</td>
          <td className="py-2 px-3 text-center">{c.egaluri}</td>
          <td className="py-2 px-3 text-center">{c.infrangeri}</td>
          <td className="py-2 px-3 text-center">{c.goluriMarcate}</td>
          <td className="py-2 px-3 text-center">{c.goluriPrimite}</td>
          <td className="py-2 px-3 text-center">{c.golaveraj}</td>
          <td className="py-2 px-3 text-center font-extrabold">{c.puncte}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const StatsCard: React.FC<{
  title: string;
  value: string | number;
  colorKey?: string;
}> = ({ title, value, colorKey }) => {
  let colorClass = "text-blue-600";
  if (colorKey && CULORI_ECHIPE[colorKey]) {
    colorClass = CULORI_ECHIPE[colorKey].split(" ")[0];
  }

  return (
    <div className="bg-white p-4 shadow rounded-lg border-l-4 border-blue-400">
      <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  );
};

// --- COMPONENTA PRINCIPALĂ ---

export default function EditionPageContent({
  editie,
  editionId,
}: EditionPageProps) {
  // 1. Filtrează meciurile de campionat valide
  const meciuriJucateDoarCampionat = useMemo(() => {
    return editie.meciuri
      .filter((m) => getMatchClassificationStrict(m) === "Campionat")
      .map((m) => ({ ...m, etapa: parseInt(String(m.etapa), 10) }));
  }, [editie.meciuri]);

  // 2. Calculul statisticilor generale (inclusiv cele din finală)
  const stats = useMemo(
    () => calculeazaStatisticiGenerale(editie.meciuri),
    [editie.meciuri]
  );

  const statsOrder = [
    { key: "victoriiGazde", title: "Vict. Gazde", value: stats.victoriiGazde },
    {
      key: "victoriiOaspeti",
      title: "Vict. Oaspeți",
      value: stats.victoriiOaspeti,
    },
    { key: "egaluri", title: "Egaluri", value: stats.egaluri },
    { key: "totalGoluri", title: "Total Goluri", value: stats.totalGoluri },
    {
      key: "goluriCampionat",
      title: "Goluri Campionat",
      value: stats.goluriCampionat,
    },
    { key: "goluriFinale", title: "Goluri Finale", value: stats.goluriFinale },
  ];

  // Mapare și filtrare pentru Best/Worst
  const mapBestWorst = (
    key: keyof StatisticiGeneraleCalculate,
    title: string
  ) => {
    const stat = stats[key] as StatAttackDefense;
    const valKey = (stat.gm !== undefined ? stat.gm : stat.gp) || 0;
    const teamKey = stat.echipa || "N/A";

    return {
      key,
      title,
      valKey,
      teamKey,
    };
  };

  const bestWorstStats = [
    mapBestWorst("bestAttackCampionat", "Cel mai bun atac (C)"),
    mapBestWorst("worstAttackCampionat", "Cel mai slab atac (C)"),
    mapBestWorst("bestDeffenseCampionat", "Cea mai bună apărare (C)"),
    mapBestWorst("worstDeffenseCampionat", "Cea mai slabă apărare (C)"),
    mapBestWorst("bestAttackFinala", "Cel mai bun atac (F)"),
    mapBestWorst("worstAttackFinala", "Cel mai slab atac (F)"),
    mapBestWorst("bestDeffenseFinala", "Cea mai bună apărare (F)"),
    mapBestWorst("worstDeffenseFinala", "Cea mai slabă apărare (F)"),
    mapBestWorst("bestAttackAll", "Cel mai bun atac (Total)"),
    mapBestWorst("worstAttackAll", "Cel mai slab atac (Total)"),
    mapBestWorst("bestDeffenseAll", "Cea mai bună apărare (Total)"),
    mapBestWorst("worstDeffenseAll", "Cea mai slabă apărare (Total)"),
  ].filter((item) => item.teamKey !== "N/A");

  // 3. Gruparea meciurilor în etape logice de câte 2
  const etapeGrupate = useMemo(() => {
    const grupe: { etapa: number; meciuri: Meci[] }[] = [];
    let meciuriInEtapa: Meci[] = [];

    // Meciurile sunt deja filtrate strict aici
    meciuriJucateDoarCampionat.forEach((m, index) => {
      meciuriInEtapa.push(m);

      // Grupează în seturi de 2
      if (
        meciuriInEtapa.length === 2 ||
        index === meciuriJucateDoarCampionat.length - 1
      ) {
        const currentEtapaNumber = grupe.length + 1;

        grupe.push({
          etapa: currentEtapaNumber,
          meciuri: [...meciuriInEtapa],
        });
        meciuriInEtapa = [];
      }
    });

    return grupe;
  }, [meciuriJucateDoarCampionat]);

  let meciuriCumulate: Meci[] = [];
  const totalClasamente = etapeGrupate.length;

  return (
    <div className="container mx-auto p-6 space-y-10">
      <header className="text-center pb-4 border-b-2">
        <h1 className="text-4xl font-extrabold text-blue-800">{editie.nume}</h1>
        <p className="text-lg text-gray-600 mt-2">
          <span className="font-semibold">{editie.prezente.length}</span>{" "}
          jucători prezenți | Golgheteri:{" "}
          <span className="font-semibold">{editie.golgheteri.join(", ")}</span>
        </p>
      </header>
      {/* --- STATISTICI GENERALE CALCULATE --- */}
      <section>
        <h2 className="text-2xl font-bold mb-4 border-l-4 border-green-500 pl-3">
          🏆 Rezumatul Ediției
        </h2>

        {/* Carduri de bază */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center mb-6">
          {statsOrder.map((item) => (
            <StatsCard key={item.key} title={item.title} value={item.value} />
          ))}
        </div>

        {/* Tabel Best/Worst */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
          <h3 className="text-lg font-bold mb-3 text-gray-700">
            Performanțe Echipe
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {bestWorstStats.map((item) => (
              <div
                key={String(item.key)}
                className="flex justify-between border-b pb-1"
              >
                <span className="text-gray-600">{item.title}:</span>
                <span
                  className={`font-semibold ${CULORI_ECHIPE[item.teamKey.split(",")[0].trim()] || "text-gray-800"}`}
                >
                  {item.valKey} ({item.teamKey})
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* --- Meciuri și Clasament Progresiv --- */}
      <section>
        <h2 className="text-2xl font-bold mb-6 border-l-4 border-blue-500 pl-3">
          ⚽ Desfășurarea Campionatului ({meciuriJucateDoarCampionat.length}{" "}
          Meciuri)
        </h2>

        <div className="space-y-8">
          {etapeGrupate.map((grupa, grupaIndex) => {
            // Acumulăm meciurile jucate până la această grupă
            meciuriCumulate = meciuriCumulate.concat(grupa.meciuri);

            const numarUltimMeci = grupaIndex * 2 + grupa.meciuri.length;
            const esteClasamentFinal = grupaIndex === totalClasamente - 1;

            // Recalculăm clasamentul bazat pe meciurile cumulate
            const clasamentIntermediar = calculeazaClasament(
              meciuriCumulate,
              esteClasamentFinal
            );

            return (
              <div
                key={grupaIndex}
                className="bg-gray-50 shadow-lg rounded-xl p-5"
              >
                <h3 className="text-xl font-bold mb-4 text-blue-700">
                  Etapa {grupa.etapa} (Meciurile {grupaIndex * 2 + 1} &{" "}
                  {numarUltimMeci})
                </h3>

                {/* Meciurile din această grupă (Afișare) */}
                <div className="grid md:grid-cols-2 gap-4">
                  {grupa.meciuri.map((meci, index) => (
                    <div
                      key={index}
                      className="bg-white shadow rounded-lg p-4 border border-gray-200"
                    >
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">
                        Meciul {grupaIndex * 2 + index + 1}
                      </h4>
                      <div className="flex justify-between items-start text-lg">
                        {/* Echipa 1 și Marcatori */}
                        <div className="flex-1 pr-2">
                          <div
                            className={`font-bold ${CULORI_ECHIPE[meci.echipa1] || "text-gray-800"}`}
                          >
                            {meci.echipa1}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {meci.marcatoriEchipa1.length > 0 ? (
                              meci.marcatoriEchipa1.join(", ")
                            ) : (
                              <span>-</span>
                            )}
                          </div>
                        </div>

                        {/* Scor Central */}
                        <div className="font-extrabold text-2xl mx-4">
                          {meci.scor1} - {meci.scor2}
                        </div>

                        {/* Echipa 2 și Marcatori */}
                        <div className="flex-1 pl-2 text-right">
                          <div
                            className={`font-bold ${CULORI_ECHIPE[meci.echipa2] || "text-gray-800"}`}
                          >
                            {meci.echipa2}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {meci.marcatoriEchipa2.length > 0 ? (
                              meci.marcatoriEchipa2.join(", ")
                            ) : (
                              <span>-</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Afișează Clasamentul calculat */}
                <div className="mt-6">
                  <h4 className="text-xl font-bold mb-2 text-blue-600 border-b pb-1">
                    Clasament (după meciul {numarUltimMeci})
                  </h4>
                  <ClasamentTabel
                    clasament={clasamentIntermediar}
                    showTieBreaker={esteClasamentFinal}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {/* --- STATISTICI JUCĂTORI (CLASAMENT MARCATOTI) --- */}
      <section>
        <h2 className="text-2xl font-bold mb-4 border-l-4 border-blue-500 pl-3">
          ⚽ Clasament Marcatori (Final)
        </h2>
        <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">
                Jucător
              </th>
              <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">
                Goluri Totale
              </th>
              <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">
                Goluri Finale
              </th>
              <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">
                Goluri Campionat
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Presupunem că datele stats sunt deja sortate după GT */}
            {editie.statistici.map((stats, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="py-2 px-4 text-gray-800 font-semibold">
                  {stats.nume} {editie.golgheteri.includes(stats.nume) && "👑"}
                </td>
                <td className="py-2 px-4 text-gray-800 font-extrabold">
                  {stats.gt}
                </td>
                <td className="py-2 px-4 text-gray-800">{stats.gf}</td>
                <td className="py-2 px-4 text-gray-800">{stats.gc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
