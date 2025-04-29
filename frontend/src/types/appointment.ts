// src/types/appointment.ts

// Common Types
export interface User {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
}

// API Response Types
export interface ApiListResponse<T> {
  total: number;
  list: T[];
  count?: number;
}

// Status and Option Types
export type AppointmentStatus = 'ΑΠΟΣΤΟΛΗ' | 'ΟΛΟΚΛΗΡΩΣΗ' | 'ΜΗ ΟΛΟΚΛΗΡΩΣΗ' | 'ΑΠΟΡΡΙΨΗ' | 'ΥΠΟ ΕΠΕΞΕΡΓΑΣΙΑ';
export type YesNo = 'ΝΑΙ' | 'ΟΧΙ' | '';
export type BcpType = 'SMALL' | 'MEDIUM' | '';
export type Floor = '-05' | '-04' | '-03' | '-02' | '-01' | '00' | '+01' | '+02' | '+03' | 
                   '+04' | '+05' | '+06' | '+07' | '+08' | 'ΗΜ' | 'ΗΥ' | '';
export type FloorCount = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '';
export type PlakaType = 'ΛΕΥΚΗ' | 'ΒΟΤΣΑΛΩΤΗ' | 'ΚΟΚΚΙΝΗ' | 'ΚΙΤΡΙΝΗ' | 
                       'ΣΤΑΜΠΩΤΟ/ΤΣΙΜΕΝΤΟ' | 'ΚΥΒΟΛΙΘΟΣ' | 'ΠΕΤΡΑ' | '';

// Base Interfaces
interface BaseAppointmentPayload {
  id?: string;
  sr: string;
  name: string;
  status: AppointmentStatus;
  dateStart: string;
  dateEnd: string;
  isAllDay: boolean;
  duration: number;
}

interface BaseAppointmentFormData {
  dateStart: string;
  timeStart: string;
  dateEnd: string;
  timeEnd: string;
}

interface BaseAppointmentDetail {
  id: string;
  name: string;
  status: AppointmentStatus;
  dateStart: string;
  dateEnd: string;
  srText: string;
}

// Autopsy Appointment Types
export interface AutopsyAppointmentPayload extends BaseAppointmentPayload {
  parentId: string;
  parentType: string;
  parentName: string;
  assignedUserId: string;
  description?: string;
  customername: string;
  customerMobille?: string;
  address: string;
  perioxi: string;
  ttlp: string;
  bid?: string;
  floors?: FloorCount;
  customerfloor?: Floor;
  dog?: YesNo;
  selectorofos?: string[];
  selectdiamerismata?: number[];
  floorbox?: number[];
  needBCP?: YesNo;
  nearBCP?: YesNo;
  eidosBcp?: BcpType;
  earthWork?: YesNo;
  mhkosXwmatourgikou?: string;
  typePlakas?: PlakaType;
  photoPlakas?: FileList | File[];
  kagkela?: YesNo;
  kanali?: YesNo;
  enaeria?: YesNo;
  dyskoliakat?: string;
  diaxeirisi?: string;
  xrewsh?: YesNo;
}

export interface AutopsyAppointmentDetail extends BaseAppointmentDetail {
  description: string | null;
  assignedUserName?: string;
  customerName: string;
  customerMobile: string;
  address: string;
  perioxi: string;
  sxolia: string | null;
}

export interface ConstructionAppointmentDetail extends BaseAppointmentDetail {
  assignedUserId: string;
  assignedUserName?: string;
  contractor: string;
  notes: string | null;
  customerAddress: string;
  customerFloor?: string;
  kagkela?: YesNo;
  enaeria?: YesNo;
  kanali?: YesNo;
}

// These are the additions needed in your appointment.ts file

export interface SoilAppointmentPayload extends BaseAppointmentPayload {
  // Required fields for API
  parentId: string;
  parentType: string;
  sr: string;
  assignedUserId: string;
  teamId: string;
  sol: string;
  description?: string | null;

  // Hook-specific fields
  egineemf?: YesNo;
  testRecordId?: string;
  customerName?: string;
  customerMobile?: string;
  mapsurl?: string;
  needBCP?: YesNo;
  skapsimo?: string;
  emfyshsh?: string;
  mikosChwma?: string;
  megethosPlakas?: string;
  typosPlakas?: string;
  alloMegethos?: string;
  difficultyLevel?: string;
  garden?: string;
  cabAddress?: string;
  cordX?: string;
  cordY?: string;   // Changed from cordy to cordY
  eidosBcp?: string;
  photoLink?: string;
  photos?: string;
  dothike?: number;

  // New fields from API response
  attachmentIds?: string[];
  attachmentNames?: Record<string, string>;
  attachmentTypes?: Record<string, string>;
  parentName?: string;
  address?: string;
  perioxi?: string;
  diaxeirisi?: string;

  // Charge-related
  xrewsh?: YesNo;
  
  // Additional properties for compatibility
  aytopsia?: string;
  logosAporripshs?: string;
  logosMhOloklhrwshs?: string;
  existingBCP?: string;
  inci?: string[];
  
  // File upload support
  attachmentUploads?: File[];
  
  // For backward compatibility, might be removed later
  cordy?: string;
  
  // For TypeScript compatibility with component, add a modifiedAt property
  modifiedAt?: string;
}

export interface SoilAppointmentDetail extends BaseAppointmentPayload {
  assignedUserId: string;
  assignedUserName?: string;
  teamId: string;
  teamName?: string;
  sol: string;
  description: string | null;
  sr: string;
  egineemf?: YesNo;
}

// Form Types
export interface AutopsyAppointmentFormData extends BaseAppointmentFormData {
  customerMobille: null;
  perioxi: any;
  assignedUserId: string;
  description: string;
}

export interface ConstructionAppointmentFormData extends BaseAppointmentFormData {
  contractor: string;
  notes: string;
  kagkela: YesNo;
  enaeria: YesNo;
  kanali: YesNo;
}

export interface ConstructionFormData extends BaseAppointmentFormData {
  assignedUserId: string;
  description: string;
}

// Update the Construction Appointment Payload
export interface ConstructionAppointmentPayload extends BaseAppointmentPayload {
  perioxi: string;
  smart: string;
  nanotronix: string;
  nearbcp: string;
  existingbcp: string;
  bmotype: string;
  beptype: string;
  aytopsias: string;
  ak: string;
  parentId: string;
  parentType: string;
  assignedUserId: string;
  contractor: string;
  customerAddress: string;
  
  // Required fields with defaults
  kagkela: YesNo;
  enaeria: YesNo;
  kanali: YesNo;
  kya: YesNo;
  xrewsh: YesNo;
  lastdrop: YesNo;
  maurh: YesNo;
  needOlerat: YesNo;
  technicalFollow: YesNo;
  bcp: YesNo;

  // Required attachment fields
  attachmentIds: string[];
  attachmentNames: Record<string, string>;
  attachmentTypes: Record<string, string>;

  // Optional customer info
  customerName?: string;
  customerMobile?: string;
  customerFloor?: string;
  adminname?: string;
  adminNumber?: string;

  // Optional text fields
  description?: string;
  notes?: string;
  bmo?: string;
  dyskolia?: string;
  ballBep?: string;
  bep?: string;
  logosAporripshs?: string;
  stylos?: string;
  toixos?: string;
  info?: string;
  infoHtml?: string;
  photos?: string;
  photographies?: string;
  photosCorrect?: string;
  ipografi?: string;
  category?: string;
  color?: string;

  // Optional measurement fields
  metraTafrou?: string;
  toixosMetraTafrouPublic?: string;
  metraTafrouPrivate?: string;
  bcpBepMetra?: string;

  // Optional location fields
  mapsurl?: string;
  lat?: string;
  long?: string;

  // Optional building info
  orofoi?: string;
  orofosbep?: string;
  tobborofosbep?: string;
  orofospel?: string;
  floors?: string;
  floors1?: string;

  // Optional paths
  opticalpaths?: string;
  opticalpaths1?: string;

  // Optional numeric fields
  dothike?: number;

  // Optional materials
  materials?: string[];

  // Optional IDs and references
  katId?: string;
  testRecordId?: string;
  bid?: string;

  photoLink?: string;

  // Optional metadata
  createdAt?: string;
  modifiedAt?: string;
  createdById?: string;
  createdByName?: string;
  modifiedById?: string;
  modifiedByName?: string;
  assignedUserName?: string;
  parentName?: string;
  
  // Optional team information
  teamsIds?: string[];
  teamsNames?: Record<string, string>;

  // Optional arrays for related records
  reminders?: any[];
  smartpointsIds?: string[];
  smartpointsNames?: Record<string, string>;
  smartpointsTypes?: Record<string, string>;
}

export interface SoilAppointmentFormData {
  dateStart: string;
  timeStart: string;
  dateEnd: string;
  timeEnd: string;
  assignedUserId: string;
  teamId: string;
  sol: string;
  description: string;
}

// Validation and Configuration Types
export interface ValidationRule {
  type: string;
  attribute: string;
  value?: any;
  data?: any;
}

export interface DynamicLogicCondition {
  conditionGroup: ValidationRule[];
}

export interface FieldConfig {
  visible?: DynamicLogicCondition;
  required?: DynamicLogicCondition;
  readOnly?: DynamicLogicCondition;
  invalid?: DynamicLogicCondition;
}

export type FieldValidation = {
  required?: boolean | ((values: TestAppointment) => boolean);
  min?: number;
  max?: number;
  pattern?: RegExp;
  validate?: (value: any) => boolean | string;
}

export interface AdditionalProperties {
  // Additional properties missing in the original interface
  adminname?: string;
  adminMobile?: string;
  // Removed selectorofos1 to prevent conflicts
  blowJob?: YesNo;
  earthworkGarden?: YesNo;
  skafthke?: YesNo;
  kollithike?: YesNo;
  relatedChoma?: string;
  relatedKataskeyi?: string;
  relatedSplicing?: string;
  alloPlaka?: string;
  anamoniypografhs?: YesNo;
  anamoniwfm?: YesNo;
  mioloklirisocuz?: string;
  aitiaApor?: string;
  ekswsysthmikh?: YesNo;
  posoxrewshs?: string;
  smartreadiness?: YesNo;
  smartpoints?: FileList | File[];
  finalBuilding?: string;
  sxoliafrominspection?: string;
  mapsurl?: string;
  cabaddress?: string;
  kya?: YesNo; 
  selectfloorbox1?: number;
  selectfloorbox2?: number;
  attachmentUploads?: File[];
  servicefloor?: string;
  apartCode?: string;
  category?: string;
  ak?: string;
  modifiedAt?: string;
  selctorofos1?: string;
}

export interface TestAppointment extends Omit<AutopsyAppointmentPayload, 'assignedUserId' | 'selectdiamerismata' | 'parentId' | 'parentType' | 'sr' | 'parentName' | 'customername' | 'address' | 'perioxi' | 'ttlp'>, AdditionalProperties {
  attachmentIds: string[];
  attachmentTypes: Record<string, string>;
  attachmentNames: Record<string, string>;

  // Make required fields optional
  assignedUserId?: string;
  parentId?: string;
  parentType?: string;
  sr?: string;
  parentName?: string;
  customername?: string;
  address?: string;
  perioxi?: string;
  ttlp?: string;
  
  // Existing specific fields
  selectdiamerismata2?: any;
  selectorofos2?: any;
  selectdiamerismata1?: any;
  floor?: any;
  kataskeyasthke?: any;
  megethosPlakas: string;
  
  // Override array properties
  selectdiamerismata?: number[];
  selectorofos?: string[];
  floorbox?: number[];
  
  // Add missing fields
  srText?: string;
  selectorofos1?: string;
}

export function mapAppointmentToLastDropAppointment(
  appointment: LastDropAppointmentPayload | null | undefined
): LastDropAppointment | undefined {
  if (!appointment) return undefined;

  return {
    // Base fields from LastDropAppointmentPayload
    id: appointment.id || '',
    sr: appointment.sr || '',
    name: appointment.name || '',
    status: appointment.status || 'ΑΠΟΣΤΟΛΗ',
    dateStart: appointment.dateStart || '',
    dateEnd: appointment.dateEnd || '',
    isAllDay: appointment.isAllDay || false,
    duration: appointment.duration || 7200,

    // Payload-specific fields
    parentId: appointment.parentId || '',
    parentType: appointment.parentType || '',
    parentName: appointment.parentName || '',
    assignedUserId: appointment.assignedUserId || '',
    description: appointment.description || '',
    comments: appointment.comments || '',

    // Customer information
    onomatepwnymo: appointment.onomatepwnymo || '',
    customerMobile: appointment.customerMobile || '',
    aDDRESSStreet: appointment.aDDRESSStreet || '',
    aDDRESSCity: appointment.aDDRESSCity || '',
    ttlp: appointment.ttlp || '',
    bUILDINGID: appointment.bUILDINGID || '',

    // Installation specifics
    tiposergasias: appointment.tiposergasias || 'ΚΑΤΑΣΚΕΥΗ FTTH',
    eidosinas: appointment.eidosinas || '10m HUA',
    ont: appointment.ont || 'APPLINK',
    energopoihsh: appointment.energopoihsh || 'ΟΧΙ',
    emploutismos: appointment.emploutismos || 'ΟΧΙ',
    exodeusi: appointment.exodeusi || 'ΟΧΙ',
    monoenergopoihsh: appointment.monoenergopoihsh || 'ΟΧΙ',
    ylika: appointment.ylika || '',
    ontserial: appointment.ontserial || '',
    aitiamholokl: appointment.aitiamholokl || '',

    // Attachment-related fields
    photosIds: appointment.photosIds || [],
    photosNames: appointment.photosNames || {},
    photosTypes: appointment.photosTypes || {}
  };
}

// Fixed mapping function
export function mapTestAppointmentToAppointmentPayload(testAppointment: TestAppointment): AutopsyAppointmentPayload {
  // Check for required fields and provide default values if undefined
  const sr = testAppointment.sr || '';
  const assignedUserId = testAppointment.assignedUserId || '';
  const parentId = testAppointment.parentId || '';
  const parentType = testAppointment.parentType || '';
  const customername = testAppointment.customername || '';
  const address = testAppointment.address || '';
  const perioxi = testAppointment.perioxi || '';
  const ttlp = testAppointment.ttlp || '';
  
  // Extract only the properties needed for AutopsyAppointmentPayload
  const {
    id, name, status, dateStart, dateEnd, isAllDay, duration,
    parentName, description,
    customerMobille, bid,
    floors, customerfloor, dog, selectorofos, selectdiamerismata,
    floorbox, needBCP, nearBCP, eidosBcp, earthWork, mhkosXwmatourgikou,
    typePlakas, photoPlakas, kagkela, kanali, enaeria, dyskoliakat,
    diaxeirisi, xrewsh
  } = testAppointment;
  
  return {
    id, 
    sr,
    name, 
    status, 
    dateStart, 
    dateEnd, 
    isAllDay, 
    duration,
    parentId, 
    parentType, 
    parentName: parentName || '', 
    assignedUserId,
    description,
    customername,
    customerMobille, 
    address, 
    perioxi, 
    ttlp, 
    bid,
    floors, 
    customerfloor, 
    dog, 
    selectorofos, 
    selectdiamerismata,
    floorbox, 
    needBCP, 
    nearBCP, 
    eidosBcp, 
    earthWork, 
    mhkosXwmatourgikou,
    typePlakas, 
    photoPlakas, 
    kagkela, 
    kanali, 
    enaeria, 
    dyskoliakat,
    diaxeirisi, 
    xrewsh
  };
}

export function mapAppointmentToTestAppointment(
  appointment: AutopsyAppointmentPayload | null | undefined
): TestAppointment | undefined {
  if (!appointment) return undefined;

  return {
    // Base fields from AutopsyAppointmentPayload
    id: appointment.id,
    sr: appointment.sr,
    name: appointment.name,
    status: appointment.status,
    dateStart: appointment.dateStart,
    dateEnd: appointment.dateEnd,
    isAllDay: appointment.isAllDay || false,
    duration: appointment.duration || 7200,

    // Payload-specific fields
    parentId: appointment.parentId || '',
    parentType: appointment.parentType || '',
    parentName: appointment.parentName || '',
    assignedUserId: appointment.assignedUserId || '',
    description: appointment.description || '',
    ttlp: appointment.ttlp || '',

    // Customer information
    customername: appointment.customername || '',
    customerMobille: appointment.customerMobille || '',
    address: appointment.address || '',
    perioxi: appointment.perioxi || '',

    // Building-related fields
    floors: appointment.floors || '',
    customerfloor: appointment.customerfloor || '',
    servicefloor: '',
    apartCode: '',

    // Additional fields with defaults
    dog: appointment.dog || 'ΟΧΙ',
    needBCP: appointment.needBCP || '',
    nearBCP: appointment.nearBCP || '',
    eidosBcp: appointment.eidosBcp || '',
    earthWork: appointment.earthWork || '',
    mhkosXwmatourgikou: appointment.mhkosXwmatourgikou || '',
    typePlakas: appointment.typePlakas || '',
    kagkela: appointment.kagkela || '',
    kanali: appointment.kanali || '',
    enaeria: appointment.enaeria || '',
    dyskoliakat: '',
    diaxeirisi: '',
    xrewsh: appointment.xrewsh || 'ΟΧΙ',
    srText: appointment.sr || '',

    // Floor-related arrays with initialization
    selectorofos: appointment.selectorofos || [],
    selectdiamerismata: appointment.selectdiamerismata || [],
    floorbox: appointment.floorbox || [],

    // New fields with default values
    selectdiamerismata2: undefined,
    selectorofos2: undefined,
    selectdiamerismata1: undefined,
    selctorofos1: undefined,
    floor: undefined,
    kataskeyasthke: undefined,
    megethosPlakas: '',

    // Attachment-related fields
    photoPlakas: appointment.photoPlakas,
    attachmentIds: [],
    attachmentNames: {},
    attachmentTypes: {}, // Fixed: changed from undefined to empty object
  };
}

// LastDrop Appointment Types
export interface LastDropAppointmentPayload extends BaseAppointmentPayload {
  parentId: string;
  parentType: string;
  parentName: string;
  assignedUserId: string;
  description?: string;
  comments?: string;
  onomatepwnymo: string;
  customerMobile: string;
  aDDRESSStreet: string;
  aDDRESSCity?: string;
  ttlp?: string;
  bUILDINGID?: string;
  tiposergasias?: string;
  eidosinas?: string;
  ont?: string;
  energopoihsh?: YesNo;
  emploutismos?: YesNo;
  exodeusi?: YesNo;
  monoenergopoihsh?: YesNo;
  ylika?: string;
  ontserial?: string;
  aitiamholokl?: string;
  photosIds?: string[];
  photosNames?: Record<string, string>;
  photosTypes?: Record<string, string>;
}

export interface LastDropAppointment extends LastDropAppointmentPayload {
  id: string;
  assignedUserName?: string;
}

export interface LastDropAppointmentFormData extends BaseAppointmentFormData {
  assignedUserId: string;
  description: string;
  tiposergasias: string;
  eidosinas: string;
  ont: string;
}

// Default Values and Validation Rules
export const DEFAULT_APPOINTMENT_VALUES: Partial<TestAppointment> = {
  status: 'ΑΠΟΣΤΟΛΗ',
  dog: 'ΟΧΙ',
  selectorofos: [],
  selectdiamerismata: [],
  floorbox: [],
  xrewsh: 'ΟΧΙ',
  isAllDay: false,
  duration: 7200
};

export const APPOINTMENT_VALIDATIONS = {
  floors: {
    required: (values: TestAppointment) => values.status === 'ΟΛΟΚΛΗΡΩΣΗ',
    options: ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as FloorCount[]
  },
  needBCP: {
    required: (values: TestAppointment) => values.status === 'ΟΛΟΚΛΗΡΩΣΗ',
    options: ['', 'ΝΑΙ', 'ΟΧΙ'] as YesNo[]
  },
  nearBCP: {
    visible: (values: TestAppointment) => values.needBCP === 'ΝΑΙ',
    required: (values: TestAppointment) => 
      values.needBCP === 'ΝΑΙ' && values.status === 'ΟΛΟΚΛΗΡΩΣΗ',
    options: ['', 'ΝΑΙ', 'ΟΧΙ'] as YesNo[]
  },
  mhkosXwmatourgikou: {
    visible: (values: TestAppointment) => values.earthWork === 'ΝΑΙ',
    required: (values: TestAppointment) => values.earthWork === 'ΝΑΙ',
    min: 0,
    max: 200
  }
};

export const ERROR_MESSAGES = {
  required: 'Το πεδίο είναι υποχρεωτικό',
  invalidFormat: 'Μη έγκυρη μορφή',
  minValue: (min: number) => `Η ελάχιστη τιμή είναι ${min}`,
  maxValue: (max: number) => `Η μέγιστη τιμή είναι ${max}`,
  fileSize: 'Το μέγεθος του αρχείου πρέπει να είναι μικρότερο από 5MB'
};