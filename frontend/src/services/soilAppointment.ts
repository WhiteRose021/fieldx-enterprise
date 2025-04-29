// src/services/soilAppointmentService.ts
import api from '@/services/api';
import { SoilAppointmentPayload } from '@/types/appointment';

export const soilAppointmentService = {
  getSoilAppointments: async (sr: string) => {
    const response = await api.getSoilAppointmentBySR(sr);
    return response.list || [];
  },

  getSoilAppointment: async (id: string) => {
    return api.getSoilAppointmentById(id);
  },

  createSoilAppointment: async (data: SoilAppointmentPayload) => {
    return api.createSoilAppointment(data);
  },

  updateSoilAppointment: async (id: string, data: SoilAppointmentPayload) => {
    return api.updateSoilAppointment(id, data);
  },

  getSoilWork: async (sr: string) => {
    try {
      const response = await api.getSoilWorkBySR(sr);
      // Return first item from list if it exists
      return response.list && response.list.length > 0 ? response.list[0] : null;
    } catch (error) {
      console.error('Error fetching soil work:', error);
      return null;
    }
  }
};