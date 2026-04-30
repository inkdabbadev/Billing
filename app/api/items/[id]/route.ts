import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  hsn_sac: z.string().optional(),
  unit: z.string().default('NOS'),
  default_rate: z.number().min(0, 'Rate cannot be negative'),
  gst_percent: z.number().min(0).max(100).default(18),
  category: z.string().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return Response.json({ error: 'Item not found' }, { status: 404 })
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Failed to fetch item' }, { status: 500 })
  }
}

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
    const { data, error } = await supabase
      .from('items')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) throw error
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
