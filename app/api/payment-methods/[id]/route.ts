import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  payment_details: z.string().min(1, 'Payment details are required'),
  is_default: z.boolean().default(false),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = createServerClient()

    // If setting as default, clear all others first
    if (parsed.data.is_default) {
      const { error: resetErr } = await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .neq('id', id)
      if (resetErr) console.error(`[PUT /api/payment-methods/${id}] reset default error:`, resetErr)
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return Response.json(data)
  } catch (err) {
    console.error('[PUT /api/payment-methods/[id]]', err)
    return Response.json({ error: 'Failed to update payment method' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()
    const { error } = await supabase.from('payment_methods').delete().eq('id', id)
    if (error) throw error
    return new Response(null, { status: 204 })
  } catch (err) {
    console.error('[DELETE /api/payment-methods/[id]]', err)
    return Response.json({ error: 'Failed to delete payment method' }, { status: 500 })
  }
}

// Lightweight route: PATCH just sets is_default = true for this id
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    // Clear all defaults
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .neq('id', id)

    // Set this one as default
    const { data, error } = await supabase
      .from('payment_methods')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return Response.json(data)
  } catch (err) {
    console.error('[PATCH /api/payment-methods/[id]]', err)
    return Response.json({ error: 'Failed to set default' }, { status: 500 })
  }
}
