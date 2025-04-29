import React, { useState } from "react";

interface FloorRow {
  floor: string;
  apartments: string;
  shops: string;
  fb01: string;
  fb01Type: string;
  fb02: string;
  fb02Type: string;
  fb03: string;
  fb03Type: string;
  fb04: string;
  fb04Type: string;
  customerFB: string;
  customerSpaceNumbering: string;
  gisid: string;
}

const FloorsTable = ({ data }: { data: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle expand/collapse
  const toggleExpand = () => setIsExpanded((prev) => !prev);

  // Parse and format the raw data into rows
  const parseFloorsData = (rawData: string): FloorRow[] => {
    return rawData
      .split("ΟΡΟΦΟΣ:")
      .slice(1) // Skip the first empty entry before the first "ΟΡΟΦΟΣ:"
      .map((entry) => {
        const parts = entry.split("|").map((part) => part.split(":")[1]?.trim() || "");
        return {
          floor: entry.split("|")[0]?.trim() || "", // Properly extract the floor
          apartments: parts[1],
          shops: parts[2],
          fb01: parts[3],
          fb01Type: parts[4],
          fb02: parts[5],
          fb02Type: parts[6],
          fb03: parts[7],
          fb03Type: parts[8],
          fb04: parts[9],
          fb04Type: parts[10],
          customerFB: parts[11],
          customerSpaceNumbering: parts[12],
          gisid: parts[13],
        };
      });
  };

  const rows = parseFloorsData(data);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-800 mb-4 flex justify-between items-center">
        Πληροφορίες Ορόφων
        <button
          onClick={toggleExpand}
          className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-600 rounded focus:outline-none"
        >
          {isExpanded ? "Σύμπτυξη" : "Επέκταση"}
        </button>
      </h3>

      {isExpanded ? (
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 border border-gray-300 text-left font-semibold">ΟΡΟΦΟΣ</th>
                <th className="p-3 border border-gray-300 text-left font-semibold">ΔΙΑΜΕΡΙΣΜΑΤΑ</th>
                <th className="p-3 border border-gray-300 text-left font-semibold">ΚΑΤΑΣΤΗΜΑΤΑ</th>
                <th className="p-3 border border-gray-300 text-left font-semibold">FB01</th>
                <th className="p-3 border border-gray-300 text-left font-semibold">FB01 TYPE</th>
                <th className="p-3 border border-gray-300 text-left font-semibold">FB02</th>
                <th className="p-3 border border-gray-300 text-left font-semibold">FB02 TYPE</th>
                <th className="p-3 border border-gray-300 text-left font-semibold">FB03</th>
                <th className="p-3 border border-gray-300 text-left font-semibold">FB03 TYPE</th>
                <th className="p-3 border border-gray-300 text-left font-semibold">FB04</th>
                <th className="p-3 border border-gray-300 text-left font-semibold">FB04 TYPE</th>
                <th className="p-3 border border-gray-300 text-left font-semibold">FB ΠΕΛΑΤΗ</th>
                <th className="p-3 border border-gray-300 text-left font-semibold">
                  ΑΡΙΘΜΗΣΗ ΧΩΡΟΥ ΠΕΛΑΤΗ
                </th>
                <th className="p-3 border border-gray-300 text-left font-semibold">GIS ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-3 border border-gray-300">{row.floor}</td>
                  <td className="p-3 border border-gray-300">{row.apartments}</td>
                  <td className="p-3 border border-gray-300">{row.shops}</td>
                  <td className="p-3 border border-gray-300">{row.fb01}</td>
                  <td className="p-3 border border-gray-300">{row.fb01Type}</td>
                  <td className="p-3 border border-gray-300">{row.fb02}</td>
                  <td className="p-3 border border-gray-300">{row.fb02Type}</td>
                  <td className="p-3 border border-gray-300">{row.fb03}</td>
                  <td className="p-3 border border-gray-300">{row.fb03Type}</td>
                  <td className="p-3 border border-gray-300">{row.fb04}</td>
                  <td className="p-3 border border-gray-300">{row.fb04Type}</td>
                  <td className="p-3 border border-gray-300">{row.customerFB}</td>
                  <td className="p-3 border border-gray-300">{row.customerSpaceNumbering}</td>
                  <td className="p-3 border border-gray-300">{row.gisid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">Κάντε κλικ στο "Επέκταση" για να δείτε τις πληροφορίες ορόφων.</p>
      )}
    </div>
  );
};

export default FloorsTable;
