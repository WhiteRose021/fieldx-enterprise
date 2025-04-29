import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import type { LastDropAppointmentFormData, LastDropAppointmentPayload, User } from '@/types/appointment';

interface LastDropData {
  id: string;
  name: string;
  aDDRESSStreet: string;
  aDDRESSCity: string;
  customerName: string;
  customerMobile: string;
  ttlp: string;
  bUILDINGID?: string;
  sr: string;
  fIELDTASKSTATUS: string;
}

interface CreateLastDropAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastDropData: LastDropData;
  onSuccess?: () => void;
  appointment?: LastDropAppointmentPayload;
}

const CreateLastDropAppointmentModal: React.FC<CreateLastDropAppointmentModalProps> = ({
  isOpen,
  onClose,
  lastDropData,
  appointment,
  onSuccess,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<LastDropAppointmentFormData>({
    dateStart: '',
    timeStart: '',
    dateEnd: '',
    timeEnd: '',
    assignedUserId: '',
    description: '',
    tiposergasias: 'ΚΑΤΑΣΚΕΥΗ FTTH',
    eidosinas: '10m HUA',
    ont: 'APPLINK'
  });

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await api.getUsers();
        if ("list" in response) {
          setUsers(response.list);
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
          description: appointment.description || "",
          tiposergasias: appointment.tiposergasias || "ΚΑΤΑΣΚΕΥΗ FTTH",
          eidosinas: appointment.eidosinas || "10m HUA",
          ont: appointment.ont || "APPLINK"
        });
      } else {
        setFormData({
          dateStart: "",
          timeStart: "",
          dateEnd: "",
          timeEnd: "",
          assignedUserId: "",
          description: "",
          tiposergasias: "ΚΑΤΑΣΚΕΥΗ FTTH",
          eidosinas: "10m HUA",
          ont: "APPLINK"
        });
      }
    }
  }, [isOpen, appointment]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
  
    try {
      setLoading(true);
  
      const formatDateTime = (date: string, time: string) => `${date} ${time}:00`;
  
      const dateStartFormatted = formatDateTime(formData.dateStart, formData.timeStart);
      const dateEndFormatted = formatDateTime(formData.dateEnd, formData.timeEnd);
  
      const appointmentData: LastDropAppointmentPayload = {
        id: appointment?.id,
        parentId: lastDropData.id,
        parentType: 'KataskeyesFTTH',
        parentName: lastDropData.name,
        dateStart: dateStartFormatted,
        dateEnd: dateEndFormatted,
        assignedUserId: formData.assignedUserId,
        status: appointment?.status || 'ΑΠΟΣΤΟΛΗ',
        onomatepwnymo: lastDropData.customerName,
        customerMobile: lastDropData.customerMobile,
        aDDRESSStreet: lastDropData.aDDRESSStreet,
        aDDRESSCity: lastDropData.aDDRESSCity || 'Δ. ΝΕΑΣ ΙΩΝΙΑΣ',
        ttlp: lastDropData.ttlp,
        bUILDINGID: lastDropData.bUILDINGID,
        description: formData.description || null,
        tiposergasias: formData.tiposergasias,
        eidosinas: formData.eidosinas,
        ont: formData.ont,
        sr: lastDropData.sr,
        isAllDay: false,
        duration: 7200
      };
  
      if (appointment?.id) {
        console.log("Updating LastDrop appointment:", appointment.id);
        await api.updateLastDropAppointment(appointment.id, appointmentData);
      } else {
        console.log("Creating new LastDrop appointment");
        await api.createLastDropAppointment(appointmentData);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Δημιουργία Ραντεβού Εγκατάστασης</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ημερομηνία Έναρξης
              </label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.dateStart}
                onChange={(e) => setFormData(prev => ({ ...prev, dateStart: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ώρα Έναρξης
              </label>
              <input
                type="time"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.timeStart}
                onChange={(e) => setFormData(prev => ({ ...prev, timeStart: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ημερομηνία Λήξης
              </label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.dateEnd}
                onChange={(e) => setFormData(prev => ({ ...prev, dateEnd: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ώρα Λήξης
              </label>
              <input
                type="time"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.timeEnd}
                onChange={(e) => setFormData(prev => ({ ...prev, timeEnd: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ανάθεση σε Τεχνικό
            </label>
            <select
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.assignedUserId}
              onChange={(e) => setFormData(prev => ({ ...prev, assignedUserId: e.target.value }))}
            >
              <option value="">Επιλέξτε τεχνικό</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Τύπος Εργασίας
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.tiposergasias}
              onChange={(e) => setFormData(prev => ({ ...prev, tiposergasias: e.target.value }))}
            >
              <option value="ΚΑΤΑΣΚΕΥΗ FTTH">ΚΑΤΑΣΚΕΥΗ FTTH</option>
              <option value="ΕΠΙΣΚΕΥΗ FTTH">ΕΠΙΣΚΕΥΗ FTTH</option>
              <option value="ΕΝΕΡΓΟΠΟΙΗΣΗ FTTH">ΕΝΕΡΓΟΠΟΙΗΣΗ FTTH</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Είδος Ίνας
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.eidosinas}
                onChange={(e) => setFormData(prev => ({ ...prev, eidosinas: e.target.value }))}
              >
                <option value="10m HUA">10m HUA</option>
                <option value="15m HUA">15m HUA</option>
                <option value="20m HUA">20m HUA</option>
                <option value="25m HUA">25m HUA</option>
                <option value="30m HUA">30m HUA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ONT
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.ont}
                onChange={(e) => setFormData(prev => ({ ...prev, ont: e.target.value }))}
              >
                <option value="APPLINK">APPLINK</option>
                <option value="HUA">HUA</option>
                <option value="NOKIA">NOKIA</option>
                <option value="ZTE">ZTE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Σχόλια
            </label>
            <textarea
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
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
  );
};

export default CreateLastDropAppointmentModal;