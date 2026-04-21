import { useState, useEffect } from "react";
import { playerService } from "../services/playersService";

const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfTWzdh8I5YCd3ogoFoo15YTxa89LC_owsqAnrSvvYDCIfd8A/formResponse";

const FORM_ENTRY = {
  nume: "entry.2009807583",
  telefon: "entry.577926244",
  varsta: "entry.1363456491",
  pozitie: "entry.495982024",
  frecventa: "entry.1183240227",
  echipaMinifotbal: "entry.1082889376",
  timpPauza: "entry.492904107",
  notaPersonala: "entry.434920381",
  cunostinte: "entry.519023493",
  poza: "entry.974226288",
};

const ADMIN_PHONE_NUMBER = "40774005451";

export default function JoinForm() {
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    age: "",
    position: "Mijlocas",
    frequency: "1",
    is_minifootball_player: "Nu",
    long_break: "Nu",
    grade: "",
    referred_by: "",
  });

  const [file, setFile] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [status, setStatus] = useState();
  const [savedDataId, setSavedDataId] = useState(null);

  useEffect(() => {
    async function loadPlayers() {
      try {
        const players = await playerService.getAll("user");
        setPlayersList(players || []);
      } catch (e) {
        console.error("Eroare la preluarea listei de jucători:", e);
      }
    }
    loadPlayers();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "file") {
      // Verificare simplă a tipului de fișier
      if (e.target.files[0] && !e.target.files[0].type.startsWith("image/")) {
        alert("Te rog încarcă un fișier imagine (JPG, PNG).");
        setFile(null);
      } else {
        setFile(e.target.files[0]);
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // FUNCTIE 1: SALVAREA DATELOR (Supabase + Sheets)
  const handleSaveData = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setSavedDataId(null);
    let photoUrl = "";

    if (!file) {
      alert("Te rog încarcă o poză înainte de a salva.");
      setStatus("error");
      return;
    }

    try {
      // 1. ÎNCĂRCAREA POZEI PE SUPABASE STORAGE
      photoUrl = await playerService.uploadPhoto(file);

      // 2. PREGĂTIREA DATELOR PENTRU AMBELE DESTINAȚII
      const supabasePayload = {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        age: parseInt(formData.age),
        position: formData.position,
        frequency: formData.frequency,
        is_minifootball_player: formData.is_minifootball_player === "Da",
        long_break: formData.long_break === "Da",
        grade: parseInt(formData.grade),
        referred_by: formData.referred_by || null,
        photo_url: photoUrl, // URL-ul salvat
      };

      // 3. SALVAREA ÎN BAZA DE DATE (SUPABASE)
      const supabaseData = await playerService.create(supabasePayload);

      // 4. SALVAREA ÎN GOOGLE SHEETS (BACKUP)
      const params = new URLSearchParams();
      params.append(FORM_ENTRY.nume, formData.full_name);
      params.append(FORM_ENTRY.telefon, formData.phone_number);
      params.append(FORM_ENTRY.varsta, formData.age);
      params.append(FORM_ENTRY.pozitie, formData.position);
      params.append(FORM_ENTRY.frecventa, formData.frequency);
      params.append(
        FORM_ENTRY.echipaMinifotbal,
        formData.is_minifootball_player
      );
      params.append(FORM_ENTRY.timpPauza, formData.long_break);
      params.append(FORM_ENTRY.notaPersonala, formData.grade);
      params.append(FORM_ENTRY.cunostinte, formData.referred_by);
      params.append(FORM_ENTRY.poza, photoUrl); // Trimitem URL-ul pozei către Sheets

      await fetch(GOOGLE_FORM_URL, {
        method: "POST",
        body: params,
        mode: "no-cors",
      });

      // 5. FINALIZARE SUCCES
      setStatus("success");
      setSavedDataId(supabaseData.id);
    } catch (error) {
      console.error("Eroare la procesarea cererii:", error);
      setStatus("error");
    }
  };

  // FUNCTIE 2: TRIMITEREA NOTIFICĂRII WHATSAPP
  const sendWhatsAppNotification = () => {
    const whatsappMessage =
      `🎉 Nouă Cerere Galero de la ${formData.full_name}! 🎉\n\n` +
      `Datele complete și poza sunt salvate în baza de date Supabase (ID: ${savedDataId}).` +
      `\n\nTe rog să verifici și să adaugi jucătorul în grup.`;

    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${ADMIN_PHONE_NUMBER}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-8 border border-green-100 mt-10">
      <h2 className="text-3xl font-bold text-green-700 text-center mb-6">
        Formular de Recrutare Galero
      </h2>

      <form onSubmit={handleSaveData} className="space-y-6">
        {/* SECȚIUNEA 1: DATE DE CONTACT */}
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
          1. Date de Contact
        </h3>

        {/* Câmpurile (Nume, Telefon, Vârstă, Poziție) rămân la fel */}
        {/* ... (codul JSX anterior pentru datele de contact) ... */}

        {/* Nume */}
        <div>
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="full_name"
          >
            Nume și Prenume
          </label>
          <input
            className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:ring-green-500"
            id="full_name"
            name="full_name"
            type="text"
            placeholder="Ex: Ion Popescu"
            required
            value={formData.full_name}
            onChange={handleChange}
          />
        </div>

        {/* Telefon */}
        <div>
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="phone_number"
          >
            Număr de Telefon
          </label>
          <input
            className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:ring-green-500"
            id="phone_number"
            name="phone_number"
            type="tel"
            placeholder="Ex: 07xx xxx xxx"
            required
            value={formData.phone_number}
            onChange={handleChange}
          />
        </div>

        {/* Vârstă și Poziție */}
        <div className="flex space-x-4">
          <div className="w-1/3">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="age"
            >
              Vârstă
            </label>
            <input
              className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:ring-green-500"
              id="age"
              name="age"
              type="number"
              placeholder="24"
              required
              min="16"
              max="60"
              value={formData.age}
              onChange={handleChange}
            />
          </div>
          <div className="w-2/3">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="position"
            >
              Poziție Preferată
            </label>
            <select
              className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:ring-green-500 bg-white"
              id="position"
              name="position"
              required
              value={formData.position}
              onChange={handleChange}
            >
              <option value="Portar">Portar</option>
              <option value="Fundas">Fundaș</option>
              <option value="Mijlocas">Mijlocaș</option>
              <option value="Atacant">Atacant</option>
              <option value="Oriunde">Joc oriunde e nevoie</option>
            </select>
          </div>
        </div>

        {/* ÎNCĂRCARE POZĂ */}
        <div>
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="photo_file"
          >
            Încarcă o Poză Clară cu Tine (Față)
          </label>
          <input
            className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:ring-green-500 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            id="photo_file"
            name="photo_file"
            type="file"
            accept="image/*"
            required
            onChange={handleChange}
          />
        </div>

        {/* SECȚIUNEA 2: NIVEL DE JOC */}
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 mt-8">
          2. Nivel și Experiență
        </h3>

        {/* Frecvența, Minifotbal, Pauză Lungă, Nota Personală rămân la fel */}
        {/* ... (codul JSX anterior pentru nivel de joc) ... */}

        {/* Frecvența */}
        <div>
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="frequency"
          >
            Câte meciuri joci pe săptămână?
          </label>
          <select
            className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:ring-green-500 bg-white"
            id="frequency"
            name="frequency"
            required
            value={formData.frequency}
            onChange={handleChange}
          >
            <option value="1">1 dată pe săptămână</option>
            <option value="2">2 ori pe săptămână</option>
            <option value="3+">3 sau mai multe ori pe săptămână</option>
            <option value="Rar">Rar</option>
          </select>
        </div>

        {/* Joacă la echipă? */}
        <div className="flex items-center space-x-6">
          <label className="text-gray-700 text-sm font-bold">
            Joci la o echipă de minifotbal?
          </label>
          {/* ... (Radio buttons pentru is_minifootball_player) ... */}
        </div>

        {/* Pauză Lungă? */}
        <div className="flex items-center space-x-6">
          <label className="text-gray-700 text-sm font-bold">
            Ai o pauză lungă de când nu ai mai jucat?
          </label>
          {/* ... (Radio buttons pentru long_break) ... */}
        </div>

        {/* Nota Personală */}
        <div>
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="grade"
          >
            Nota Personală (1-10)
          </label>
          <input
            className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:ring-green-500"
            id="grade"
            name="grade"
            type="number"
            placeholder="Ex: 7"
            required
            min="1"
            max="10"
            value={formData.grade}
            onChange={handleChange}
          />
        </div>

        {/* SUGGESTIE MEMBRU (SELECT din Supabase) */}
        <div>
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="referred_by"
          >
            Cunoști pe cineva din grup?
          </label>
          <select
            className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:ring-green-500 bg-white"
            id="referred_by"
            name="referred_by"
            value={formData.referred_by}
            onChange={handleChange}
          >
            <option value="">-- Alege un membru Galero (Opțional) --</option>
            {playersList.map((player) => (
              // Asumăm că playerService returnează full_name și id
              <option key={player.id} value={player.full_name}>
                {player.full_name}
              </option>
            ))}
            <option value="Nu cunosc pe nimeni">Nu cunosc pe nimeni</option>
          </select>
        </div>

        {/* MESAJ DE STARE ȘI BUTON DE SALVARE */}
        {status === "loading" && (
          <div className="text-blue-500 text-center font-semibold">
            Se salvează datele (Supabase + Sheets)...
          </div>
        )}
        {status === "error" && (
          <div className="text-red-500 text-center font-bold">
            ❌ Eroare la salvare! Verifică consola și reîncearcă.
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className={`w-full font-bold py-3 px-4 rounded transition duration-300 flex items-center justify-center gap-2 mt-6 ${
            status === "loading"
              ? "bg-gray-400 cursor-not-allowed"
              : status === "success"
                ? "bg-green-700 text-white cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {status === "loading"
            ? "Salvare în curs..."
            : status === "success"
              ? "Date Salvate în Bază!"
              : "1. Salvează Datele & Poza (Supabase + Sheets)"}
        </button>
      </form>

      {/* BUTONUL WHATSAPP APARE DOAR DUPĂ SALVAREA CU SUCCES */}
      {status === "success" && (
        <div className="mt-4 pt-4 border-t border-dashed">
          <p className="text-center text-md font-semibold text-gray-700 mb-3">
            Pasul 2: Trimite Notificarea
          </p>
          <button
            onClick={sendWhatsAppNotification}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition duration-300 flex items-center justify-center gap-2"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            Trimite Notificare pe WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}
