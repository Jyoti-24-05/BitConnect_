// client/src/api/eventApi.js
import axiosInstance from "./axiosInstance";

export const eventApi = {
  getEvents:      (params)          => axiosInstance.get("/events", { params }),
  searchEvents:   (params)          => axiosInstance.get("/events/search", { params }),
  getEvent:       (eventId)         => axiosInstance.get(`/events/${eventId}`),
  getMyRsvps:     (params)          => axiosInstance.get("/events/my-rsvps", { params }),
  getClubEvents:  (clubId, params)  => axiosInstance.get(`/events/club/${clubId}`, { params }),
  createEvent:    (data)            => axiosInstance.post("/events", data),
  updateEvent:    (eventId, data)   => axiosInstance.patch(`/events/${eventId}`, data),
  deleteEvent:    (eventId)         => axiosInstance.delete(`/events/${eventId}`),
  rsvpToEvent:    (eventId, data)   => axiosInstance.post(`/events/${eventId}/rsvp`, data),
};