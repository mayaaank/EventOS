// Path: services/reviews.service.ts
import { Review, CreateReviewPayload } from '@/types'

export const reviewsService = {
  async getByEvent(eventId: string): Promise<{ data: Review[]; success: boolean; error: string | null }> {
    const res = await fetch(`/api/reviews?event_id=${eventId}`)
    return res.json()
  },

  async getByUser(userId: string): Promise<{ data: Review[]; success: boolean; error: string | null }> {
    const res = await fetch(`/api/reviews?user_id=${userId}`)
    return res.json()
  },

  async submitReview(payload: CreateReviewPayload): Promise<{ data: Review | null; success: boolean; error: string | null }> {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.json()
  },
}
