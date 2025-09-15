import { z } from 'zod'

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('Nexa Builder'),
  NEXT_PUBLIC_ENABLE_EXAMPLE: z.string().optional(),
})

export type ClientEnv = z.infer<typeof clientSchema>

function getClientEnv(): ClientEnv {
  const raw = Object.entries(process.env)
    .filter(([k]) => k.startsWith('NEXT_PUBLIC_'))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, string | undefined>)
  const parsed = clientSchema.safeParse(raw)
  if (!parsed.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Invalid client env', parsed.error.flatten().fieldErrors)
    }
    throw new Error('Invalid NEXT_PUBLIC_* environment variables')
  }
  return parsed.data
}

export const ENV = {
  server: serverSchema.parse(process.env),
  client: getClientEnv(),
}
