// src/constants/index.ts

// Status options 
export interface StatusOption {
  value: string;
  label: string;
  style: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: "ΑΠΟΣΤΟΛΗ", label: "ΑΠΟΣΤΟΛΗ", style: "bg-blue-100 text-blue-800" },
  { value: "ΟΛΟΚΛΗΡΩΣΗ", label: "ΟΛΟΚΛΗΡΩΣΗ", style: "bg-green-100 text-green-800" },
  { value: "ΜΗ ΟΛΟΚΛΗΡΩΣΗ", label: "ΜΗ ΟΛΟΚΛΗΡΩΣΗ", style: "bg-red-100 text-red-800" },
  { value: "ΑΠΟΡΡΙΨΗ", label: "ΑΠΟΡΡΙΨΗ", style: "bg-yellow-100 text-yellow-800" },
  { value: "ΥΠΟ ΕΠΕΞΕΡΓΑΣΙΑ", label: "ΥΠΟ ΕΠΕΞΕΡΓΑΣΙΑ", style: "bg-purple-100 text-purple-800" }
];

// Basic option interface
export interface BasicOption {
  value: string;
  label: string;
  style?: string;
}

// Yes/No options 
export const YES_NO_OPTIONS: BasicOption[] = [
  { value: "", label: "Επιλέξτε..." },
  { value: "ΝΑΙ", label: "ΝΑΙ" },
  { value: "ΟΧΙ", label: "ΟΧΙ" }
];

// Floor options
export const FLOOR_OPTIONS = [
  { value: "", label: "Επιλέξτε..." },
  { value: "-05", label: "-05" },
  { value: "-04", label: "-04" },
  { value: "-03", label: "-03" },
  { value: "-02", label: "-02" },
  { value: "-01", label: "-01" },
  { value: "00", label: "00" },
  { value: "+01", label: "+01" },
  { value: "+02", label: "+02" },
  { value: "+03", label: "+03" },
  { value: "+04", label: "+04" },
  { value: "+05", label: "+05" },
  { value: "+06", label: "+06" },
  { value: "+07", label: "+07" },
  { value: "+08", label: "+08" },
  { value: "ΗΜ", label: "ΗΜ" },
  { value: "ΗΥ", label: "ΗΥ" }
];



// Floor count options
export const FLOOR_COUNT_OPTIONS: BasicOption[] = [
  { value: "", label: "Επιλέξτε..." },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "10", label: "10" }
];

// Plaka types
export const PLAKA_TYPES: BasicOption[] = [
  { value: "", label: "Επιλέξτε..." },
  { value: "ΛΕΥΚΗ", label: "ΛΕΥΚΗ" },
  { value: "ΒΟΤΣΑΛΩΤΗ", label: "ΒΟΤΣΑΛΩΤΗ" },
  { value: "ΚΟΚΚΙΝΗ", label: "ΚΟΚΚΙΝΗ" },
  { value: "ΚΙΤΡΙΝΗ", label: "ΚΙΤΡΙΝΗ" },
  { value: "ΣΤΑΜΠΩΤΟ/ΤΣΙΜΕΝΤΟ", label: "ΣΤΑΜΠΩΤΟ/ΤΣΙΜΕΝΤΟ" },
  { value: "ΚΥΒΟΛΙΘΟΣ", label: "ΚΥΒΟΛΙΘΟΣ" },
  { value: "ΠΕΤΡΑ", label: "ΠΕΤΡΑ" }
];

// Plaka size options
export const PLAKA_SIZES: BasicOption[] = [
  { value: "", label: "Επιλέξτε..." },
  { value: "40 x 40", label: "40 x 40" },
  { value: "50 x 50", label: "50 x 50" },
  { value: "ΑΛΛΟ", label: "ΑΛΛΟ" }
];

// BCP type options
export const BCP_TYPES: BasicOption[] = [
  { value: "", label: "Επιλέξτε..." },
  { value: "SMALL", label: "SMALL" },
  { value: "MEDIUM", label: "MEDIUM" }
];

// Difficulty level options with styling
export const DIFFICULTY_LEVELS: BasicOption[] = [
  { value: "", label: "Επιλέξτε...", style: "" },
  { value: "0.5", label: "0.5", style: "bg-green-100 text-green-800" },
  { value: "1", label: "1", style: "bg-blue-100 text-blue-800" },
  { value: "1.5", label: "1.5", style: "bg-yellow-100 text-yellow-800" },
  { value: "2", label: "2", style: "bg-red-100 text-red-800" },
  { value: "ΣΦΗΝΑ", label: "ΣΦΗΝΑ", style: "bg-purple-100 text-purple-800" }
];

// Non-completion reason options
export const COMPLETION_REASONS: BasicOption[] = [
  { value: "", label: "Επιλέξτε..." },
  { value: "ΔΕΝ ΕΠΙΘΥΜΕΙ", label: "ΔΕΝ ΕΠΙΘΥΜΕΙ" },
  { value: "ΔΕΝ ΕΧΕΙ ΟΛΟΚΛΗΡΩΘΕΙ Η ΠΟΛΥΚΑΤΟΙΚΙΑ", label: "ΔΕΝ ΕΧΕΙ ΟΛΟΚΛΗΡΩΘΕΙ Η ΠΟΛΥΚΑΤΟΙΚΙΑ" },
  { value: "ΔΕΝ ΥΠΑΡΧΕΙ Α' ΦΑΣΗ", label: "ΔΕΝ ΥΠΑΡΧΕΙ Α' ΦΑΣΗ" },
  { value: "ΛΑΝΘΑΣΜΕΝΗ ΔΙΕΥΘΥΝΣΗ", label: "ΛΑΝΘΑΣΜΕΝΗ ΔΙΕΥΘΥΝΣΗ" },
  { value: "ΛΑΝΘΑΣΜΕΝΟΣ ΟΡΟΦΟΣ", label: "ΛΑΝΘΑΣΜΕΝΟΣ ΟΡΟΦΟΣ" },
  { value: "ΥΠΑΡΧΕΙ Β' ΦΑΣΗ", label: "ΥΠΑΡΧΕΙ Β' ΦΑΣΗ" }
];

// Diaxeirisi status options
export const DIAXEIRISI_OPTIONS: BasicOption[] = [
  { value: "", label: "Επιλέξτε..." },
  { value: "ΝΑΙ", label: "ΝΑΙ", style: "bg-red-100 text-red-800" },
  { value: "ΕΓΙΝΕ", label: "ΕΓΙΝΕ", style: "bg-green-100 text-green-800" }
];

// Styled Yes/No options
export const STYLED_YES_NO_OPTIONS: BasicOption[] = [
  { value: "", label: "Επιλέξτε..." },
  { value: "ΝΑΙ", label: "ΝΑΙ", style: "bg-red-100 text-red-800" },
  { value: "ΟΧΙ", label: "ΟΧΙ", style: "bg-green-100 text-green-800" }
];

// Validation messages
export const VALIDATION_MESSAGES = {
  required: "Το πεδίο είναι υποχρεωτικό",
  min: (min: number) => `Η ελάχιστη τιμή είναι ${min}`,
  max: (max: number) => `Η μέγιστη τιμή είναι ${max}`,
  invalid: "Μη έγκυρη τιμή",
  fileSize: "Το μέγεθος του αρχείου πρέπει να είναι μικρότερο από 5MB",
  fileType: "Επιτρέπονται μόνο αρχεία εικόνας"
};

