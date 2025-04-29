// components/Modals/CreateConstructionAppointmentModal.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, AlertCircle, Calendar, Clock, Users, MessageCircle } from 'lucide-react';
import api from '@/services/api';
import type { 
  ConstructionFormData, 
  ConstructionAppointmentPayload,
  User 
} from '@/types/appointment';

interface ConstructionData {
  id: string;
  name: string;
  sr: string;
  customerAddress: string;
  customerFloor?: string;
}

interface CreateConstructionAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  constructionData: ConstructionData;
  onSuccess?: () => void;
  appointment?: ConstructionAppointmentPayload;
}

// Extended user interface that includes API response fields
interface ExtendedUser extends User {
  defaultTeamName?: string;
  defaultTeamId?: string;
  userName?: string;
  isActive?: boolean;
}

const CreateConstructionAppointmentModal: React.FC<CreateConstructionAppointmentModalProps> = ({
  isOpen,
  onClose,
  constructionData,
  appointment,
  onSuccess,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<ExtendedUser[]>([]);
  const [constructionUsers, setConstructionUsers] = useState<ExtendedUser[]>([]);

  const [formData, setFormData] = useState<ConstructionFormData>({
    dateStart: '',
    timeStart: '',
    dateEnd: '',
    timeEnd: '',
    assignedUserId: '',
    description: ''
  });

  useEffect(() => {
    async function fetchUsers() {
      try {
        // We need to directly call the API with modified parameters to include defaultTeamName
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
          
          // Filter for users with defaultTeamName containing "KAT"
          const filteredUsers = data.list.filter((user: { defaultTeamName: string | string[]; }) => 
            user.defaultTeamName && user.defaultTeamName.includes('ΚΑΤ')
          );
          
          console.log('Filtered Construction (KAT) users:', filteredUsers);
          setConstructionUsers(filteredUsers);
        } else {
          console.error('Invalid API response format:', data);
          setError('Σφάλμα φόρτωσης χρηστών');
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users");
      }
    }

    if (isOpen) {
      fetchUsers();

      if (appointment) {
        setFormData({
          dateStart: appointment.dateStart?.split(" ")[0] || "",
          timeStart: appointment.dateStart?.split(" ")[1]?.slice(0, 5) || "",
          dateEnd: appointment.dateEnd?.split(" ")[0] || "",
          timeEnd: appointment.dateEnd?.split(" ")[1]?.slice(0, 5) || "",
          assignedUserId: appointment.assignedUserId || "",
          description: appointment.notes || ""
        });
      } else {
        setFormData({
          dateStart: '',
          timeStart: '',
          dateEnd: '',
          timeEnd: '',
          assignedUserId: '',
          description: ''
        });
      }
    }
  }, [isOpen, appointment]);

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
      const [hours, minutes] = time.split(':').map(Number);
      const startDateTime = new Date(date);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime.getTime() + (2 * 60 * 60 * 1000));
      
      setFormData(prev => ({
        ...prev,
        dateStart: date,
        timeStart: time,
        dateEnd: endDateTime.toISOString().slice(0, 10),
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
  
      const appointmentData: ConstructionAppointmentPayload = {
        id: appointment?.id,
        parentId: constructionData.id,
        parentType: 'KataskeyesBFasi',
        sr: constructionData.sr,
        name: constructionData.name,
        status: 'ΑΠΟΣΤΟΛΗ',
        dateStart: dateStartFormatted,
        dateEnd: dateEndFormatted,
        assignedUserId: formData.assignedUserId,
        contractor: '',
        notes: formData.description,
        customerAddress: constructionData.customerAddress,
        customerFloor: constructionData.customerFloor || '',
        isAllDay: false,
        duration: 7200,
        kagkela: 'ΟΧΙ',
        enaeria: 'ΟΧΙ',
        kanali: 'ΟΧΙ',
        bmo: '',
        dyskolia: '',
        kya: 'ΟΧΙ',
        xrewsh: 'ΟΧΙ',
        materials: [],
        smart: '',
        nanotronix: '',
        nearbcp: '',
        existingbcp: '',
        bmotype: '',
        beptype: '',
        aytopsias: '',
        ak: '',
        lastdrop: '',
        maurh: '',
        needOlerat: '',
        technicalFollow: '',
        bcp: '',
        attachmentIds: [],
        perioxi: '',
        attachmentNames: undefined,
        attachmentTypes: undefined
      };
  
      console.log('Submitting appointment data:', appointmentData);
  
      if (appointment?.id) {
        await api.updateConstructionAppointment(appointment.id, appointmentData);
      } else {
        await api.createConstructionAppointment(appointmentData);
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
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-5 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {appointment?.id ? 'Επεξεργασία Ραντεβού' : 'Νέο Ραντεβού Κατασκευής'}
            </h2>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-green-800/30"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-green-100 mt-1">
            {constructionData.name} - {constructionData.customerAddress}
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
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-gray-800"
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
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-gray-800"
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
                Ανάθεση σε Τεχνικό Κατασκευής
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Επιλογή Τεχνικού
                </label>
                <select
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-gray-800"
                  value={formData.assignedUserId}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedUserId: e.target.value }))}
                >
                  <option value="">Επιλέξτε τεχνικό</option>
                  {constructionUsers.length > 0 ? (
                    constructionUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))
                  ) : (
                    <option disabled value="">Δεν βρέθηκαν τεχνικοί κατασκευής</option>
                  )}
                </select>

                <div className="mt-2 text-xs text-gray-500">
                  {constructionUsers.length > 0 ? (
                    <span>Διαθέσιμοι τεχνικοί κατασκευής: {constructionUsers.length}</span>
                  ) : (
                    <span className="text-amber-600">Δεν βρέθηκαν τεχνικοί κατασκευής</span>
                  )}
                </div>
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
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-gray-800 min-h-24"
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
                className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors shadow-sm flex items-center justify-center min-w-28"
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

export default CreateConstructionAppointmentModal;