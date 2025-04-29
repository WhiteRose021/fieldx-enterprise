import { FC, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";
import { Phone, PhoneOff, Pause } from "lucide-react";

interface PhoneData {
  callerName?: string;
  callerNumber: string;
  receiverName?: string;
  receiverNumber: string;
  contactName?: string;
  contactId?: string;
  srId?: string;
  srLink?: string;
}

interface RingingPopupProps {
  phoneData: PhoneData;
  onClose: () => void;
  onHold: () => void;
}

const RingingPopup: FC<RingingPopupProps> = ({ phoneData, onClose, onHold }) => {
  const dragControls = useDragControls();

  useEffect(() => {
    return () => {
      console.log("RingingPopup unmounting... Cancelling animations.");
    };
  }, []);

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      initial={{ y: "100vh", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100vh", opacity: 0 }}
      transition={{ type: "spring", stiffness: 50, onComplete: () => console.log("Animation complete") }}
      className="fixed bottom-5 right-5 w-80 p-5 bg-black text-white rounded-2xl shadow-lg z-50 text-center"
    >
      <h2 className="text-lg font-semibold mb-3">Incoming Call</h2>
      
      <div className="space-y-2 mb-4">
        <p className="text-base">
          Caller: {phoneData.callerName || phoneData.callerNumber || "Unknown"}
        </p>
        <p className="text-base">
          Receiver: {phoneData.receiverName || phoneData.receiverNumber || "Unknown"}
        </p>
        <p className="text-sm text-gray-400">
          Contact: {phoneData.contactName || "Unknown"}
        </p>
      </div>

      {phoneData.srId && (
        <a
          href="#"
          className="block mt-2 mb-4 text-green-500 underline hover:text-green-400 transition-colors"
        >
          View SR Details
        </a>
      )}

      <div className="flex justify-between items-center">
        <button 
          className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center text-white"
          aria-label="Answer call"
        >
          <Phone className="w-6 h-6" />
        </button>

        <button 
          onClick={onHold}
          className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors flex items-center justify-center text-white"
          aria-label="Hold call"
        >
          <Pause className="w-6 h-6" />
        </button>

        <button 
          onClick={onClose}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center text-white"
          aria-label="End call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
};


export default RingingPopup;