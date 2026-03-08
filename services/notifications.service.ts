// Path: services/notifications.service.ts
import { Notification, ApiResponse } from '@/types'

const BASE = '/api/notifications'

export const notificationsService = {

  // GET /api/notifications?user_id=
  // Returns notifications + unread_count in one request.
  // No separate unread-count round trip needed.
  async getMyNotifications(userId: string): Promise<ApiResponse<Notification[]> & { unread_count?: number }> {
    const res = await fetch(`${BASE}?user_id=${userId}`)
    return res.json()
  },

  // PATCH /api/notifications/[id]/read
  // Mark a single notification as read.
  async markRead(id: string): Promise<ApiResponse<null>> {
    const res = await fetch(`${BASE}/${id}/read`, { method: 'PATCH' })
    return res.json()
  },

  // PATCH /api/notifications/read-all
  // Mark all notifications as read.
  async markAllRead(userId: string): Promise<ApiResponse<null>> {
    const res = await fetch(`${BASE}/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    return res.json()
  },

  // POST /api/notifications/announce
  // Organizer: send an announcement to all confirmed event participants.
  async sendAnnouncement(
    eventId: string,
    title: string,
    message: string
  ): Promise<ApiResponse<{ sent_to: number }>> {
    const res = await fetch(`${BASE}/announce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, title, message }),
    })
    return res.json()
  },
}