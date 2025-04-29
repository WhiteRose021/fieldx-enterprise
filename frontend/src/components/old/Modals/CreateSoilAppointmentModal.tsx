// components/Modals/CreateSoilAppointmentModal.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, AlertCircle, Calendar, Clock, Users, MessageCircle, Shovel } from 'lucide-react';
import api from '@/services/api';
import type { 
  SoilAppointmentFormData, 
  SoilAppointmentPayload, 
  User,
} from '@/types/appointment';

interface SoilWorkData {
  id: string;
  name: string;
  sr: string;
}

interface CreateSoilAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  soilWorkData: SoilWorkData;
  onSuccess?: () => void;
  appointment?: SoilAppointmentPayload;
}

// Extended user interface that includes API response fields
interface ExtendedUser extends User {
  defaultTeamName?: string;
  defaultTeamId?: string;
  userName?: string;
  isActive?: boolean;
}

const CreateSoilAppointmentModal: React.FC<CreateSoilAppointmentModalProps> = ({
  isOpen,
  onClose,
  soilWorkData,
  appointment,
  onSuccess,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<ExtendedUser[]>([]);
  const [soilUsers, setSoilUsers] = useState<ExtendedUser[]>([]);

  const [formData, setFormData] = useState<SoilAppointmentFormData>({
    dateStart: '',
    timeStart: '',
    dateEnd: '',
    timeEnd: '',
    assignedUserId: '',
    teamId: '',
    sol: '',
    description: ''
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Skip the teams API call since it's failing
        
        // Fetch users with defaultTeamName
        const params = {
          where: [{
            type: 'isTrue',
            attribute: 'isActive'
          }],
          // Request additional fields including defaultTeamName
          select: ['id', 'name', 'defaultTeamName', 'defaultTeamId', 'userName']
        };

        const authToken = localStorage.getItem('auth_token');
        if (!authToken) {
          throw new Error('No authentication token found.');
        }

        const searchParams = encodeURIComponent(JSON.stringify(params));
        const response = await fetch(`http://192.168.4.150:8080/api/v1/User?searchParams=${searchParams}`, {
          headers: {
            Authorization: `Basic ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw API response with requested fields:', data);

        if ("list" in data && Array.isArray(data.list)) {
          // Store all users
          setAllUsers(data.list);
          
          // Filter for users with defaultTeamName containing "Technicians - Soil"
          const filteredUsers = data.list.filter((user: { defaultTeamName: string | string[]; }) => 
            user.defaultTeamName && 
            (user.defaultTeamName.includes('Technicians - Soil') || 
             user.defaultTeamName.includes('Soil'))
          );
          
          console.log('Filtered Soil Technicians:', filteredUsers);
          setSoilUsers(filteredUsers);
        } else {
          console.error('Invalid API response format:', data);
          setError('Σφάλμα φόρτωσης χρηστών');
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Σφάλμα φόρτωσης δεδομένων");
      }
    }
  
    if (isOpen) {
      fetchData();
  
      if (appointment) {
        setFormData({
          dateStart: appointment.dateStart?.split(" ")[0] || "",
          timeStart: appointment.dateStart?.split(" ")[1]?.slice(0, 5) || "",
          dateEnd: appointment.dateEnd?.split(" ")[0] || "",
          timeEnd: appointment.dateEnd?.split(" ")[1]?.slice(0, 5) || "",
          assignedUserId: appointment.assignedUserId || "",
          teamId: appointment.teamId || "",
          sol: appointment.sol || "",
          description: appointment.description || "",
        });
      } else {
        // Reset to initial state
        setFormData({
          dateStart: "",
          timeStart: "",
          dateEnd: "",
          timeEnd: "",
          assignedUserId: "",
          teamId: "",
          sol: "",
          description: "",
        });
      }
    }
  }, [isOpen, appointment]);

  // Handle start time change and automatically set end time 2 hours later
  const handleStartTimeChange = (date: string, time: string) => {
    if (!date || !time) {
      setFormData(prev => ({
        ...prev,
        dateStart: date,
        timeStart: time,
        dateEnd: '',
        timeEnd: ''
      }));
      return;
    }

    try {
      // Create proper date string for Date object
      const [hours, minutes] = time.split(':').map(Number);
      const startDateTime = new Date(date);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      // Add 2 hours for end time
      const endDateTime = new Date(startDateTime.getTime() + (2 * 60 * 60 * 1000));
      
      setFormData(prev => ({
        ...prev,
        dateStart: date,
        timeStart: time,
        dateEnd: endDateTime.toISOString().slice(0, 10), // Get YYYY-MM-DD
        timeEnd: `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`
      }));
    } catch (error) {
      console.error('Error calculating end time:', error);
      setFormData(prev => ({
        ...prev,
        dateStart: date,
        timeStart: time,
        dateEnd: date,
        timeEnd: time
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      const formatDateTime = (date: string, time: string) => `${date} ${time}:00`;

      const dateStartFormatted = formatDateTime(formData.dateStart, formData.timeStart);
      const dateEndFormatted = formatDateTime(formData.dateEnd, formData.timeEnd);

      // Find default team for soil if no team is selected
      let teamId = formData.teamId;
      
      // If we have a selected user with defaultTeamId, use that
      if (!teamId && formData.assignedUserId) {
        const selectedUser = soilUsers.find(user => user.id === formData.assignedUserId);
        if (selectedUser && selectedUser.defaultTeamId) {
          teamId = selectedUser.defaultTeamId;
        }
      }

      const appointmentData: SoilAppointmentPayload = {
        id: appointment?.id,
        parentId: soilWorkData.id,
        parentType: 'CChomatourgika',
        sr: soilWorkData.sr,
        name: `${soilWorkData.name} - Χωματουργικό`,
        status: appointment?.status || 'ΑΠΟΣΤΟΛΗ',
        dateStart: dateStartFormatted,
        dateEnd: dateEndFormatted,
        assignedUserId: formData.assignedUserId,
        teamId: teamId || "", // Use empty string if no team ID found
        sol: formData.sol,
        description: formData.description,
        isAllDay: false,
        duration: 7200,
        egineemf: 'ΟΧΙ',
        // Fix type errors by using empty strings instead of null
        testRecordId: "",
        customerName: "",
        customerMobile: "",
        mapsurl: "",
        photos: "",
        dothike: 0
      };

      if (appointment?.id) {
        await api.updateSoilAppointment(appointment.id, appointmentData);
      } else {
        await api.createSoilAppointment(appointmentData);
      }

      onSuccess?.();
      onClose();
      router.refresh();
    } catch (err) {
      console.error('Error submitting appointment:', err);
      setError(err instanceof Error ? err.message : 'Σφάλμα κατά την αποθήκευση');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-5 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shovel className="h-5 w-5" />
              {appointment?.id ? 'Επεξεργασία Ραντεβού Χωματουργικού' : 'Νέο Ραντεβού Χωματουργικού'}
            </h2>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-amber-800/30"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-amber-100 mt-1">
            {soilWorkData.name} - SR: {soilWorkData.sr}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 text-red-700 animate-fadeIn">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Σφάλμα</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date/Time Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                Ημερομηνία & Ώρα
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ημερομηνία Έναρξης
                    </label>
                    <input
                      type="date"
                      required
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all text-gray-800"
                      value={formData.dateStart}
                      onChange={(e) => handleStartTimeChange(e.target.value, formData.timeStart)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ημερομηνία Λήξης
                    </label>
                    <input
                      type="date"
                      required
                      disabled
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-600"
                      value={formData.dateEnd}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ώρα Έναρξης
                    </label>
                    <input
                      type="time"
                      required
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all text-gray-800"
                      value={formData.timeStart}
                      onChange={(e) => handleStartTimeChange(formData.dateStart, e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ώρα Λήξης
                    </label>
                    <input
                      type="time"
                      required
                      disabled
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-600"
                      value={formData.timeEnd}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* User Assignment Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                Ανάθεση σε Τεχνικό Χωματουργικού
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Επιλογή Τεχνικού
                </label>
                <select
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all text-gray-800"
                  value={formData.assignedUserId}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedUserId: e.target.value }))}
                >
                  <option value="">Επιλέξτε τεχνικό</option>
                  {soilUsers.length > 0 ? (
                    soilUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))
                  ) : (
                    <option disabled value="">Δεν βρέθηκαν τεχνικοί χωματουργικού</option>
                  )}
                </select>

                <div className="mt-2 text-xs text-gray-500">
                  {soilUsers.length > 0 ? (
                    <span>Διαθέσιμοι τεχνικοί χωματουργικού: {soilUsers.length}</span>
                  ) : (
                    <span className="text-amber-600">Δεν βρέθηκαν τεχνικοί χωματουργικού</span>
                  )}
                </div>
              </div>
            </div>

            {/* Soil Pipe Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Shovel className="h-4 w-4 text-gray-500" />
                Στοιχεία Χωματουργικού
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Σωληνίσκος
                </label>
                <input
                  type="text"
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all text-gray-800"
                  value={formData.sol}
                  onChange={(e) => setFormData(prev => ({ ...prev, sol: e.target.value }))}
                />
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-gray-500" />
                Σχόλια & Σημειώσεις
              </h3>
              
              <div>
                <textarea
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all text-gray-800 min-h-24"
                  placeholder="Προσθέστε σχόλια ή οδηγίες για τον τεχνικό..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:bg-amber-400 transition-colors shadow-sm flex items-center justify-center min-w-28"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Αποθήκευση...
                  </>
                ) : (
                  'Αποθήκευση'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSoilAppointmentModal;