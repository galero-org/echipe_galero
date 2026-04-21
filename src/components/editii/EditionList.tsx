interface EditionMetaData {
  id: number;
  numeComplet: string;
}

interface EditionsListProps {
  editions: EditionMetaData[];
}

export default function EditionsList({ editions }: EditionsListProps) {
  const BASE_URL_DETAILS = "/editii";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">🏆 Toate Edițiile</h1>

      {/* Afișează numărul total de ediții */}
      <p className="text-center text-gray-700 text-lg">
        Sunt disponibile <b>{editions.length}</b> ediții.
      </p>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {editions.map((ed) => (
          <li
            key={ed.id}
            className="bg-white shadow rounded-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02]"
          >
            {/* Link-ul va folosi ID-ul (ex: /editii/1) */}
            <a href={`${BASE_URL_DETAILS}/${ed.id}`} className="block p-5">
              <h2 className="text-xl font-extrabold text-blue-700">
                Ediția #{ed.id}
              </h2>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {ed.numeComplet}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Click pentru a vedea detaliile și statisticile.
              </p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
