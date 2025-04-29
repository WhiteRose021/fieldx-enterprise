import React, { useState } from "react";

interface OpticalPathRow {
  type: string;
  path: string;
  gisid: string;
}

const OpticalPathsTable = ({ data }: { data: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle expand/collapse
  const toggleExpand = () => setIsExpanded((prev) => !prev);

  // Parse and format the raw data into rows
  const parseOpticalPaths = (rawData: string): OpticalPathRow[] => {
    return rawData
      .split("OPTICAL PATH TYPE:")
      .slice(1) // Skip the first empty entry before the first "OPTICAL PATH TYPE:"
      .map((entry) => {
        const typeMatch = entry.match(/(.+?)\s*\|\s*OPTICAL PATH:/); // Extract OPTICAL PATH TYPE
        const pathMatch = entry.match(/OPTICAL PATH:\s*(.+?)\s*\|\s*GISID:/); // Extract OPTICAL PATH
        const gisidMatch = entry.match(/GISID:\s*(.+)/); // Extract GISID

        return {
          type: typeMatch?.[1]?.trim() || "", // Defaults to empty if not found
          path: pathMatch?.[1]?.trim() || "", // Defaults to empty if not found
          gisid: gisidMatch?.[1]?.trim() || "", // Defaults to empty if not found
        };
      });
  };

  const rows = parseOpticalPaths(data);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-800 mb-4 flex justify-between items-center">
        Οπτικές Διαδρομές
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
                <th className="p-3 border border-gray-300 text-left font-semibold">
                  OPTICAL PATH TYPE
                </th>
                <th className="p-3 border border-gray-300 text-left font-semibold">
                  OPTICAL PATH
                </th>
                <th className="p-3 border border-gray-300 text-left font-semibold">GISID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="p-3 border border-gray-300">{row.type}</td>
                  <td className="p-3 border border-gray-300">{row.path}</td>
                  <td className="p-3 border border-gray-300">{row.gisid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">
          Κάντε κλικ στο "Επέκταση" για να δείτε τις Οπτικές Διαδρομές.
        </p>
      )}
    </div>
  );
};

export default OpticalPathsTable;
