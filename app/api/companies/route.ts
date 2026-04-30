import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN')
    .or(z.literal(''))
    .optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().default('India'),
  is_client: z.boolean().default(true),
  is_supplier: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const search = request.nextUrl.searchParams.get('search') ?? ''

    let query = supabase
      .from('companies')
      .select('*')
      .order('company_name', { ascending: true })

    if (search) {
      query = query.ilike('company_name', `%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return Response.json(data)
  } catch (err) {
    return Response.json({ error: 'Failed to fetch companies' }, { status: 500 })
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
    const { data, error } = await supabase
      .from('companies')
      .insert(parsed.data)
      .select()
      .single()

    if (error) throw error
    return Response.json(data, { status: 201 })
  } catch (err) {
    return Response.json({ error: 'Failed to create company' }, { status: 500 })
  }
}
