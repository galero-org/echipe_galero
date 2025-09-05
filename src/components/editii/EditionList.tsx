export default function EditionsList({ editions }) {
  return (
    <div className="container mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center">Toate edițiile</h1>
      <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {editions.map((ed, idx) => (
          <li
            key={idx}
            className="bg-white shadow rounded-xl p-4 hover:shadow-lg transition"
          >
            <h2 className="text-lg font-semibold">{ed.nume}</h2>
            <p className="text-sm text-gray-600">
              {ed.prezente.length} jucători
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
