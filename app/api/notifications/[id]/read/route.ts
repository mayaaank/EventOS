// Path: app/api/notifications/[id]/read/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// PATCH /api/notifications/[id]/read
// Marks a single notification as read.
// RLS "notif_update_own" ensures users can only mark their own notifications.
export async function PATCH(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient()

        const { data, error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', params.id)
            .select('id, read')
            .single()

        if (error || !data) {
            if (error?.code === 'PGRST116') {
                return NextResponse.json(
                    { data: null, error: 'Notification not found', success: false },
                    { status: 404 }
                )
            }
            return NextResponse.json(
                { data: null, error: error?.message ?? 'Update failed', success: false },
                { status: 500 }
            )
        }

        return NextResponse.json({ data, error: null, success: true })
    } catch (err) {
        console.error('[PATCH /api/notifications/[id]/read] error:', err)
        return NextResponse.json(
            { data: null, error: 'Failed to mark notification as read', success: false },
            { status: 500 }
        )
    }
}