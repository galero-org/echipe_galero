// Test script pentru randomizare
// Rulează cu: npx ts-node test-randomization.ts

import { generateTeams } from "./src/lib/teamService";
import type { Player } from "./src/lib/types";

const createTestPlayers = (): Player[] => {
  const players: Player[] = [];

  // 4 portari
  for (let i = 1; i <= 4; i++) {
    players.push({
      id: `gk${i}`,
      full_name: `Goalkeeper ${i}`,
      grade: 11 - i,
      position: "GK",
      totalEditions: 0,
    });
  }

  // 20 jucatori de camp cu grade mixte
  const grades = [
    10, 10, 10, 10, 9, 9, 9, 9, 8, 8, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6,
  ];
  for (let i = 0; i < grades.length; i++) {
    players.push({
      id: `p${i + 1}`,
      full_name: `Player ${i + 1} (${grades[i]})`,
      grade: grades[i],
      position: "FIELD",
      totalEditions: 0,
    });
  }

  return players;
};

const analyzeTeams = (teams: any[], label: string) => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${label}`);
  console.log(`${"=".repeat(60)}`);

  teams.forEach((team, idx) => {
    const grades = team.players
      .map((p: any) => p.grade)
      .sort((a: number, b: number) => b - a);
    const gradeStr = grades.join(", ");
    console.log(
      `${team.name.padEnd(15)} | Total: ${team.totalGrade.toString().padEnd(2)} | Avg: ${team.averageGrade.toFixed(2)} | Grades: [${gradeStr}]`,
    );
  });

  const totalGrades = teams.map((t: any) => t.totalGrade);
  const minGrade = Math.min(...totalGrades);
  const maxGrade = Math.max(...totalGrades);
  const avgGrade =
    totalGrades.reduce((a: number, b: number) => a + b, 0) / totalGrades.length;

  console.log(`\nStatistici:`);
  console.log(
    `  Min Total: ${minGrade}, Max Total: ${maxGrade}, Diff: ${maxGrade - minGrade}`,
  );
  console.log(`  Media: ${avgGrade.toFixed(2)}`);
  console.log(
    `  Varietate: ${maxGrade - minGrade <= 2 ? "JOASĂ (echipe asemanatoare)" : "INALTA (echipe diverse)"}`,
  );
};

// Main test
console.log("🧪 TEST RANDOMIZARE ECHIPE\n");

const testPlayers = createTestPlayers();
console.log(`Jucatori disponibili: ${testPlayers.length} (GK: 4, FIELD: 20)`);
console.log(`Configuratie: 4 echipe x 6 jucatori\n`);

// Test 1: 0% (Sistematic)
console.log("Generez echipe cu 0% randomizare (sistematic)...");
const teams0 = generateTeams(testPlayers, 4, 6, {}, 0);
analyzeTeams(teams0, "TEST 1: 0% RANDOMIZARE (SISTEMATIC)");

// Test 2: 50% (Mix)
console.log("\nGenerez echipe cu 50% randomizare (mix)...");
const teams50 = generateTeams(testPlayers, 4, 6, {}, 50);
analyzeTeams(teams50, "TEST 2: 50% RANDOMIZARE (MIX)");

// Test 3: 100% (Random)
console.log("\nGenerez echipe cu 100% randomizare (complet random)...");
const teams100 = generateTeams(testPlayers, 4, 6, {}, 100);
analyzeTeams(teams100, "TEST 3: 100% RANDOMIZARE (COMPLET RANDOM)");

// Test 4: Verificare consistență
console.log("\n" + "=".repeat(60));
console.log("VERIFICARE CONSISTENȚĂ");
console.log("=".repeat(60));

const teamsConsist1 = generateTeams(testPlayers, 4, 6, {}, 50);
const teamsConsist2 = generateTeams(testPlayers, 4, 6, {}, 50);
const teamsConsist3 = generateTeams(testPlayers, 4, 6, {}, 50);

const grade1 = teamsConsist1
  .map((t) => t.totalGrade)
  .sort((a, b) => a - b)
  .join(",");
const grade2 = teamsConsist2
  .map((t) => t.totalGrade)
  .sort((a, b) => a - b)
  .join(",");
const grade3 = teamsConsist3
  .map((t) => t.totalGrade)
  .sort((a, b) => a - b)
  .join(",");

console.log(`Run 1 (50%): ${grade1}`);
console.log(`Run 2 (50%): ${grade2}`);
console.log(`Run 3 (50%): ${grade3}`);
console.log(
  `\n✅ La 50%, distribuția ar trebui să fie diferită de la run la run (e randomă)`,
);
console.log(
  `✅ La 0%, ar trebui să fie identică de la run la run (e sistematică)`,
);

console.log("\n" + "=".repeat(60));
console.log("✨ TEST COMPLET!");
console.log("=".repeat(60));
