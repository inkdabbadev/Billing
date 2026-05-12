import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  payment_details: z.string().min(1, 'Payment details are required'),
  is_default: z.boolean().default(false),
})

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return Response.json(data)
  } catch (err) {
    console.error('[GET /api/payment-methods]', err)
    return Response.json({ error: 'Failed to fetch payment methods' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = createServerClient()

    // If this one is default, clear all other defaults first
    if (parsed.data.is_default) {
      const { error: resetErr } = await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000') // update all rows
      if (resetErr) console.error('[POST /api/payment-methods] reset default error:', resetErr)
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .insert(parsed.data)
      .select()
      .single()

    if (error) throw error
    return Response.json(data, { status: 201 })
  } catch (err) {
    console.error('[POST /api/payment-methods]', err)
    return Response.json({ error: 'Failed to create payment method' }, { status: 500 })
  }
}
