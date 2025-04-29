// src/constants/index.ts

// Define interfaces for options
export interface SelectOption {
    value: string;
    label: string;
  }
  
  // Appointment status options
  export const STATUS_OPTIONS: SelectOption[] = [
    { value: "Pending", label: "Εκκρεμεί" },
    { value: "Scheduled", label: "Προγραμματισμένο" },
    { value: "In Progress", label: "Σε Εξέλιξη" },
    { value: "Completed", label: "Ολοκληρώθηκε" },
    { value: "Cancelled", label: "Ακυρώθηκε" }
  ];
  
  // Yes/No options
  export const YES_NO_OPTIONS: SelectOption[] = [
    { value: "Y", label: "Ναι" },
    { value: "N", label: "Όχι" }
  ];
  
  // Pavement/slab types
  export const PLAKA_TYPES: SelectOption[] = [
    { value: "cement", label: "Τσιμέντο" },
    { value: "ceramic", label: "Κεραμικά" },
    { value: "marble", label: "Μάρμαρο" },
    { value: "other", label: "Άλλο" }
  ];
  
  // BCP (Building Connection Point) types
  export const BCP_TYPES: SelectOption[] = [
    { value: "indoor", label: "Εσωτερικό" },
    { value: "outdoor", label: "Εξωτερικό" },
    { value: "hidden", label: "Κρυφό" }
  ];
  
  // Customer floor options
  export const CUSTOMER_FLOOR_OPTIONS: SelectOption[] = [
    { value: "basement", label: "Υπόγειο" },
    { value: "ground", label: "Ισόγειο" },
    { value: "1", label: "1ος Όροφος" },
    { value: "2", label: "2ος Όροφος" },
    { value: "3", label: "3ος Όροφος" },
    { value: "4", label: "4ος Όροφος" },
    { value: "5+", label: "5ος+ Όροφος" }
  ];
  
  // Soil work difficulty options
  export const SOIL_DIFFICULTY_OPTIONS: SelectOption[] = [
    { value: "easy", label: "Εύκολο" },
    { value: "medium", label: "Μέτριο" },
    { value: "hard", label: "Δύσκολο" },
    { value: "very_hard", label: "Πολύ Δύσκολο" }
  ];
  
  // Construction difficulty options
  export const CONSTRUCTION_DIFFICULTY_OPTIONS: SelectOption[] = [
    { value: "easy", label: "Εύκολο" },
    { value: "medium", label: "Μέτριο" },
    { value: "hard", label: "Δύσκολο" },
    { value: "very_hard", label: "Πολύ Δύσκολο" }
  ];
  
  // BMO (Building Management Office) types
  export const BMO_TYPES: SelectOption[] = [
    { value: "standard", label: "Βασικό" },
    { value: "extended", label: "Εκτεταμένο" },
    { value: "none", label: "Χωρίς BMO" }
  ];
  
  // BEP (Building Entry Point) types
  export const BEP_TYPES: SelectOption[] = [
    { value: "standard", label: "Βασικό" },
    { value: "custom", label: "Προσαρμοσμένο" },
    { value: "hidden", label: "Κρυφό" }
  ];
  
  // Validation messages
  export const VALIDATION_MESSAGES = {
    required: "Το πεδίο είναι υποχρεωτικό",
    invalidEmail: "Μη έγκυρο email",
    invalidPhone: "Μη έγκυρο τηλέφωνο",
    invalidDate: "Μη έγκυρη ημερομηνία",
    invalidNumber: "Μη έγκυρος αριθμός",
    minLength: (min: number): string => `Ελάχιστο μήκος ${min} χαρακτήρες`,
    maxLength: (max: number): string => `Μέγιστο μήκος ${max} χαρακτήρες`
  };