// Standalone User interface for EspoCRM users
export interface User {
  id: string;
  name: string;
  deleted: boolean;
  userName: string;
  type: string;
  authMethod: string | null;
  apiKey: string | null;
  salutationName: string | null;
  firstName: string;
  lastName: string;
  isActive: boolean;
  title: string | null;
  emailAddress: string | null;
  phoneNumber: string | null;
  gender: string | null;
  createdAt: string;
  modifiedAt: string;
  auth2FA: string | null;
  lastAccess: string | null;
  middleName: string | null;
  emailAddressIsOptedOut: boolean | null;
  emailAddressIsInvalid: boolean | null;
  phoneNumberIsOptedOut: boolean | null;
  phoneNumberIsInvalid: boolean | null;
  emailAddressData: any[]; // This could be further typed if structure is known
  phoneNumberData: any[]; // This could be further typed if structure is known
  defaultTeamId: string | null;
  defaultTeamName: string | null;
  
  // Team-related properties
  teamsIds: string[];
  teamsNames: Record<string, string>; // Maps team ID to team name
  teamsColumns: Record<string, { role: string | null }>; // Maps team ID to team role info
  
  // Role-related properties
  rolesIds: string[];
  rolesNames: Record<string, string>; // Maps role ID to role name
  
  // Portal-related properties
  portalsIds: string[];
  portalsNames: Record<string, string>; // Maps portal ID to portal name
  portalRolesIds: string[];
  portalRolesNames: Record<string, string>; // Maps portal role ID to portal role name
  
  // Relationship properties
  contactId: string | null;
  contactName: string | null;
  accountsIds: string[];
  accountsNames: Record<string, string>; // Maps account ID to account name
  avatarId: string | null;
  avatarName: string | null;
  createdById: string;
  createdByName: string;
  dashboardTemplateId: string | null;
  dashboardTemplateName: string | null;
  workingTimeCalendarId: string | null;
  workingTimeCalendarName: string | null;
  layoutSetId: string | null;
  layoutSetName: string | null;
  
  // Ticket-related properties
  ticketIds: string[];
  ticketNames: Record<string, string>; // Maps ticket ID to ticket name
  
  // Allow for additional properties not explicitly typed
  [key: string]: any;
}

// A simplified user interface for timeline views and other places 
// where we don't need all the user details
export interface TimelineUser {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  type?: string;
  teams?: string[]; // Array of team names for simpler use
  defaultTeam?: string; // Just the default team name
}

// Helper function to convert full User to TimelineUser
export function toTimelineUser(user: User): TimelineUser {
  return {
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    type: user.type,
    teams: user.teamsIds.map(id => user.teamsNames[id]),
    defaultTeam: user.defaultTeamName || undefined
  };
}

// Helper function to check if a user is a technician
export function isTechnician(user: User): boolean {
  // This logic should be customized based on your criteria
  // Examples of possible criteria:
  
  // 1. User is in a specific team (e.g., "Engineers")
  const isInEngineerTeam = user.teamsIds.some(id => 
    user.teamsNames[id]?.toLowerCase().includes('engineer'));
  
  // 2. User has a specific role (e.g., "Field - Engineer")
  const hasEngineerRole = user.rolesIds.some(id => 
    user.rolesNames[id]?.toLowerCase().includes('engineer'));
  
  // 3. User has a specific type
  const hasCorrectType = user.type === 'regular';
  
  // Combine criteria as needed - adjust this logic based on your needs
  return (isInEngineerTeam || hasEngineerRole) && hasCorrectType;
}