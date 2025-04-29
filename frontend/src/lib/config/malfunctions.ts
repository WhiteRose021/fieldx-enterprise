/**
 * Configuration file for Malfunction entities
 * Contains field definitions, statuses, layout sections, and other configuration
 */

export type FieldType = 
  | 'varchar'
  | 'text'
  | 'datetime'
  | 'bool'
  | 'enum'
  | 'checklist'
  | 'int'
  | 'url'
  | 'attachmentMultiple'
  | 'link'
  | 'linkMultiple';

export interface FieldDefinition {
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  isReadOnly?: boolean;
  showInList?: boolean;
  showInDetail?: boolean;
  group?: string;
  order?: number;
  description?: string;
}

export interface LayoutSection {
  id: string;
  label: string;
  fields: string[];
  icon?: string;
  condition?: (data: any) => boolean;
}

// Status options and colors
export const STATUS_OPTIONS = [
  "ΝΕΟ",
  "ΑΠΟΣΤΟΛΗ",
  "ΟΛΟΚΛΗΡΩΣΗ",
  "ΜΗ ΟΛΟΚΛΗΡΩΣΗ",
  "ΑΠΟΡΡΙΨΗ",
  "ΧΕΙΡΟΚΙΝΗΤΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ",
  "ΑΚΥΡΩΣΗ"
];

export const STATUS_COLORS: Record<string, string> = {
  "ΟΛΟΚΛΗΡΩΣΗ": "bg-green-100 text-green-800 border border-green-300",
  "ΑΠΟΣΤΟΛΗ": "bg-blue-100 text-blue-800 border border-blue-300",
  "ΜΗ ΟΛΟΚΛΗΡΩΣΗ": "bg-red-100 text-red-800 border border-red-300",
  "ΑΠΟΡΡΙΨΗ": "bg-gray-100 text-gray-800 border border-gray-300",
  "ΝΕΟ": "bg-purple-100 text-purple-800 border border-purple-300",
  "ΧΕΙΡΟΚΙΝΗΤΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ": "bg-yellow-100 text-yellow-800 border border-yellow-300",
  "ΑΚΥΡΩΣΗ": "bg-red-100 text-red-800 border border-red-300"
};

// Job description options
export const JOB_DESCRIPTION_OPTIONS = [
  "Καθαρισμός Φρεατίου",
  "Αλλαγή Οπτικής Ίνας",
  "Μετάβαση Χωρίς Εργασία",
  "Επισκευή Οπτικής Ίνας",
  "Αποκατάσταση Βλάβης"
];

// Yes/No options for blowingDone field
export const YES_NO_OPTIONS = ["ΝΑΙ", "ΟΧΙ"];

// Complete field definitions
export const FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  name: { label: "Αριθμός", type: "varchar", required: true, showInList: true, showInDetail: true },
  description: { label: "Περιγραφή", type: "text", showInDetail: true },
  createdAt: { label: "Ημερομηνία Δημιουργίας", type: "datetime", isReadOnly: true, showInDetail: true },
  modifiedAt: { label: "Ημερομηνία Τροποποίησης", type: "datetime", isReadOnly: true, showInDetail: true },
  deleted: { label: "Διαγραμμένο", type: "bool", isReadOnly: true },
  type: { 
    label: "Τύπος", 
    type: "checklist", 
    options: ["Καθαρισμός", "Επισκευή", "Έλεγχος", "Αντικατάσταση"], 
    showInDetail: true 
  },
  status: { 
    label: "Κατάσταση", 
    type: "enum", 
    options: STATUS_OPTIONS, 
    required: true, 
    showInList: true, 
    showInDetail: true 
  },
  idvlavis: { label: "ID Βλάβης", type: "varchar", showInList: true, showInDetail: true },
  perioxi: { label: "Περιοχή", type: "varchar", showInDetail: true },
  tk: { label: "Τ.Κ.", type: "varchar", showInDetail: true },
  ak: { label: "ΑΚ", type: "varchar", showInList: true, showInDetail: true },
  lat: { label: "Γεωγρ. Πλάτος", type: "varchar", showInDetail: true },
  long: { label: "Γεωγρ. Μήκος", type: "varchar", showInDetail: true },
  ttlp: { label: "TTLP", type: "varchar", showInList: true, showInDetail: true },
  address: { label: "Διεύθυνση", type: "text", showInList: true, showInDetail: true },
  datecreated: { label: "Ημερομηνία Δημιουργίας", type: "datetime", showInDetail: true },
  customername: { label: "Όνομα Πελάτη", type: "varchar", showInList: true, showInDetail: true },
  customermobile: { label: "Τηλέφωνο Πελάτη", type: "varchar", showInDetail: true },
  addressformatted: { label: "Διεύθυνση (Μορφοποιημένη)", type: "varchar", showInDetail: true },
  cab: { label: "CAB", type: "varchar", showInDetail: true },
  blowingDone: { 
    label: "Εμφύσηση", 
    type: "enum", 
    options: YES_NO_OPTIONS, 
    showInDetail: true 
  },
  textdatestart: { label: "Ημερομηνία Έναρξης", type: "varchar", showInDetail: true },
  metravlavhcab: { label: "Μέτρα Βλάβης CAB", type: "int", showInDetail: true },
  metravlavhbcpbep: { label: "Μέτρα Βλάβης BCP/BEP", type: "int", showInDetail: true },
  metravlavhbepfb: { label: "Μέτρα Βλάβης BEP/FB", type: "int", showInDetail: true },
  splittertype: { label: "Τύπος Splitter", type: "enum", showInDetail: true },
  splitterbcp: { label: "Splitter BCP", type: "enum", showInDetail: true },
  moufarisma: { label: "Μουφάρισμα", type: "enum", options: YES_NO_OPTIONS, showInDetail: true },
  jobdescription: { 
    label: "Περιγραφή Εργασίας", 
    type: "enum", 
    options: JOB_DESCRIPTION_OPTIONS, 
    showInDetail: true 
  },
  
  // Link fields
  createdById: { label: "ID Δημιουργού", type: "link", isReadOnly: true },
  createdByName: { label: "Δημιουργός", type: "varchar", isReadOnly: true, showInDetail: true },
  modifiedById: { label: "ID Τροποποιητή", type: "link", isReadOnly: true },
  modifiedByName: { label: "Τροποποιητής", type: "varchar", isReadOnly: true, showInDetail: true },
  assignedUserId: { label: "ID Υπεύθυνου", type: "link", showInDetail: true },
  assignedUserName: { label: "Υπεύθυνος", type: "varchar", showInList: true, showInDetail: true },
  
  // Link multiple fields
  teamsIds: { label: "Ομάδες IDs", type: "linkMultiple", isReadOnly: true },
  usersIds: { label: "Χρήστες IDs", type: "linkMultiple", showInDetail: true },
  
  // Attachment fields
  photos: { label: "Φωτογραφίες", type: "attachmentMultiple", showInDetail: true },
  soilphotos: { label: "Φωτογραφίες Χώματος", type: "attachmentMultiple", showInDetail: true },
  pdfattachment: { label: "PDF Έγγραφα", type: "attachmentMultiple", showInDetail: true },
};

// Layout sections
export const LAYOUT_SECTIONS: LayoutSection[] = [
  {
    id: "section1",
    label: "ΣΤΟΙΧΕΙΑ ΒΛΑΒΗΣ",
    icon: "FileText",
    fields: [
      "status", "blowingDone", "datecreated", "name", "idvlavis", "address", 
      "perioxi", "tk", "textdatestart"
    ]
  },
  {
    id: "section2",
    label: "ΠΕΛΑΤΗΣ",
    icon: "Building2",
    fields: ["customername", "customermobile", "addressformatted"],
    condition: (data) => !!data.customername
  },
  {
    id: "section3",
    label: "ΔΕΛΤΙΟ ΠΡΟΜΕΛΕΤΗΣ",
    icon: "ClipboardList",
    fields: ["pdfattachment", "description"]
  },
  {
    id: "section4",
    label: "ΣΤΟΙΧΕΙΑ ΕΡΓΑΣΙΑΣ",
    icon: "Shovel",
    fields: ["type", "jobdescription", "photos", "soilphotos"]
  },
  {
    id: "section5",
    label: "ΥΠΟΛΟΙΠΕΣ ΠΛΗΡΟΦΟΡΙΕΣ",
    icon: "Layers",
    fields: [
      "metravlavhcab", "metravlavhbcpbep", "metravlavhbepfb", 
      "splittertype", "splitterbcp", "moufarisma"
    ]
  }
];

// List view configuration - which fields to show
export const LIST_VIEW_FIELDS = [
  "name",
  "status",
  "idvlavis",
  "address",
  "ak",
  "ttlp",
  "datecreated",
  "assignedUserName"
];

// Functions to help with displaying values
export function getStatusStyle(status: string): string {
  return STATUS_COLORS[status] || "bg-yellow-100 text-yellow-800 border border-yellow-300";
}

export function getBlowingDoneStyle(value?: string | null): string {
  if (!value) return "text-gray-500";
  
  const styles: Record<string, string> = {
    "ΝΑΙ": "text-green-600 font-medium",
    "ΟΧΙ": "text-red-600 font-medium"
  };
  
  return styles[value] || "text-gray-700";
}

// Filter options for the list view
export const FILTER_OPTIONS = {
  status: STATUS_OPTIONS,
  ttlp: [
    "Τ.Τ.Λ.Π. ΕΥΒΟΙΑΣ",
    "Τ.Τ.Λ.Π. ΒΟΡ. ΠΡΟΑΣΤΙΩΝ",
    "Τ.Τ.Λ.Π. ΑΛΥΣΙΔΑΣ",
    "Τ.Τ.Λ.Π. ΑΓ. ΠΑΡΑΣΚΕΥΗΣ",
    "Τ.Τ.Λ.Π. ΧΑΛΑΝΔΡΙΟΥ"
  ],
  ak: [
    "ΧΑΛ",
    "ΝΚΗΦ",
    "ΑΓΠ",
    "ΑΜΡ",
    "ΨΧ"
  ]
};

export default {
  FIELD_DEFINITIONS,
  LAYOUT_SECTIONS,
  STATUS_OPTIONS,
  STATUS_COLORS,
  JOB_DESCRIPTION_OPTIONS,
  YES_NO_OPTIONS,
  LIST_VIEW_FIELDS,
  FILTER_OPTIONS,
  getStatusStyle,
  getBlowingDoneStyle
};