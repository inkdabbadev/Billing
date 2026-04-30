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

  export async function GET(request: NextRequest) {
    try {
      const supabase = createServerClient()
      const search = request.nextUrl.searchParams.get('search') ?? ''

      let query = supabase
        .from('items')
        .select('*')
        .order('item_name', { ascending: true })

      if (search) {
        query = query.ilike('item_name', `%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error

      return Response.json(data)
    } catch {
      return Response.json({ error: 'Failed to fetch items' }, { status: 500 })
    }
  }

  export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('ITEM BODY:', body)

    const parsed = schema.safeParse({
      ...body,
      default_rate: Number(body.default_rate),
      gst_percent: Number(String(body.gst_percent).replace('%', '')),
    })

    if (!parsed.success) {
      console.error('ZOD ITEM ERROR:', parsed.error.flatten())
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('items')
      .insert(parsed.data)
      .select()
      .single()

    if (error) {
      console.error('SUPABASE ITEM INSERT ERROR:', error)
      return Response.json({ error: error.message, details: error }, { status: 500 })
    }

    return Response.json(data, { status: 201 })
  } catch (err) {
    console.error('CREATE ITEM CATCH ERROR:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to create item' },
      { status: 500 }
    )
  }
}
