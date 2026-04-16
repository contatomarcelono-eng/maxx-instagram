import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const validUser = process.env.APP_USERNAME ?? 'maxx'
  const validPass = process.env.APP_PASSWORD ?? 'maxx2025'

  if (username === validUser && password === validPass) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set('auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    })
    return res
  }

  return NextResponse.json({ ok: false }, { status: 401 })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('auth', '', { maxAge: 0, path: '/' })
  return res
}
