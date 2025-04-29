import React, { FC } from "react";

interface PopupProps {
  show: boolean; // Controls whether the popup is visible or not
  onClose: () => void; // Function to close the popup
  children: React.ReactNode; // Content to display inside the popup
}

const Popup: FC<PopupProps> = ({ show, onClose, children }) => {
  if (!show) return null; // Do not render the popup if 'show' is false

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      {/* Popup background overlay */}
      <div className="relative bg-white p-6 rounded shadow-lg max-w-4xl w-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          X
        </button>
        {/* Popup content */}
        {children}
      </div>
    </div>
  );
};

export default Popup;
