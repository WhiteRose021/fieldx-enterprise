"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import RingingPopup from "@/components/PhoneCenter/RingingPopup";

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

interface RingingPopupContextProps {
  showPopup: (phoneData: PhoneData) => void;
}

const RingingPopupContext = createContext<RingingPopupContextProps | null>(null);

interface AytopsyEntry {
  id: string;
  customerMobile?: string;
  adminMobile?: string;
  [key: string]: any;
}

export const RingingPopupProvider = ({ children }: { children: ReactNode }) => {
  const [popupVisible, setPopupVisible] = useState(false);
  const [phoneData, setPhoneData] = useState<PhoneData | null>(null);
  const [lastProcessedCall, setLastProcessedCall] = useState<string | null>(null);

  const formatPhoneNumber = (phoneNumber: string): string => {
    return phoneNumber.replace(/[\s\-\(\)]/g, "").trim();
  };

  const searchInAytopsies = async (phoneNumber: string): Promise<{ srId: string | null; srLink: string | null }> => {
    try {
      const formattedSearchNumber = formatPhoneNumber(phoneNumber);
      console.log("Searching in Aytopsies for formatted number:", formattedSearchNumber);

      const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || "alexarv";
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "alexarv!";
      const credentials = btoa(`${adminUsername}:${adminPassword}`);

      const response = await fetch("http://192.168.4.150:8080/api/v1/Aytopsies1", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${credentials}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Aytopsies data: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const aytopsiesArray: AytopsyEntry[] = Array.isArray(responseData) ? responseData : responseData.data || [];

      // Search in both mobile fields simultaneously
      const matchingAytopsy = aytopsiesArray.find((entry: AytopsyEntry) => {
        const customerMobile = formatPhoneNumber(entry.customerMobile || "");
        const adminMobile = formatPhoneNumber(entry.adminMobile || "");
        
        return customerMobile === formattedSearchNumber || adminMobile === formattedSearchNumber;
      });

      if (matchingAytopsy) {
        const srId = matchingAytopsy.id;
        const srLink = `http://192.168.4.150:8080/#Aytopsies1/${srId}`;
        console.log("Found matching Aytopsy:", { srId, srLink });
        return { srId, srLink };
      }

      console.log("No matching Aytopsy found for number:", formattedSearchNumber);
      return { srId: null, srLink: null };
    } catch (error) {
      console.error("Error searching Aytopsies:", error);
      return { srId: null, srLink: null };
    }
  };

  const determineSearchNumber = (activeCall: any): string => {
    const receiverNumber = formatPhoneNumber(activeCall.receiverNumber);
    const callerNumber = formatPhoneNumber(activeCall.callerNumber);
    
    // If receiver number is 4 digits (internal), use caller number
    // Otherwise use receiver number
    return receiverNumber.length === 4 ? callerNumber : receiverNumber;
  };

  const generateCallIdentifier = (activeCall: any): string => {
    return `${activeCall.callerNumber}-${activeCall.receiverNumber}-${new Date().getTime()}`;
  };

  const fetchActiveCall = async () => {
    try {
      const response = await fetch("https://192.168.4.20:8086/api/active-call", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch active call data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.activeCalls?.length > 0) {
        const activeCall = data.activeCalls[0];
        const callIdentifier = generateCallIdentifier(activeCall);

        // Check if we've already processed this call
        if (callIdentifier === lastProcessedCall) {
          return;
        }

        const searchNumber = determineSearchNumber(activeCall);
        console.log("Searching Aytopsies for determined number:", searchNumber);

        const { srId, srLink } = await searchInAytopsies(searchNumber);

        showPopup({
          callerName: activeCall.callerName,
          callerNumber: activeCall.callerNumber,
          receiverName: activeCall.receiverName,
          receiverNumber: activeCall.receiverNumber,
          contactName: activeCall.contactName,
          contactId: activeCall.contactId,
          srId,
          srLink,
        });

        // Update last processed call
        setLastProcessedCall(callIdentifier);
      } else {
        // Reset last processed call when there are no active calls
        setLastProcessedCall(null);
      }
    } catch (error) {
      console.error("Error in fetchActiveCall:", error);
    }
  };

  const showPopup = (data: PhoneData) => {
    setPhoneData(data);
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
    setPhoneData(null);
  };

  useEffect(() => {
    const pollingInterval = 1800000;
    console.log("Starting active call polling with interval:", pollingInterval);

    // Initial fetch
    fetchActiveCall();

    const interval = setInterval(fetchActiveCall, pollingInterval);

    return () => {
      console.log("Cleaning up polling interval");
      clearInterval(interval);
    };
  }, []); // Removed phoneData dependency as it's not needed

  return (
    <RingingPopupContext.Provider value={{ showPopup }}>
      {children}
      {popupVisible && phoneData && (
        <RingingPopup 
          phoneData={phoneData} 
          onClose={closePopup} 
          onHold={closePopup} 
        />
      )}
    </RingingPopupContext.Provider>
  );
};

export const useRingingPopup = () => {
  const context = useContext(RingingPopupContext);
  if (!context) {
    throw new Error("useRingingPopup must be used within a RingingPopupProvider");
  }
  return context;
};