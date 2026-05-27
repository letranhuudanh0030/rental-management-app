'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [propertyName, setPropertyName] = useState('Nhà trọ của tôi')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user && data.session) {
      await supabase
        .from('landlord_settings')
        .update({ property_name: propertyName })
        .eq('user_id', data.user.id)

      router.push('/')
      router.refresh()
      return
    }

    setMessage('Kiểm tra email để xác nhận tài khoản.')
    setLoading(false)
  }

  const handleSeed = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const json = await res.json()
      alert(json.message ?? json.error)
    } catch {
      alert('Không thể tải dữ liệu mẫu')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Miễn phí cho chủ nhà quản lý dưới 50 phòng
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="property">Tên nhà trọ</Label>
              <Input
                id="property"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu (tối thiểu 6 ký tự)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="h-12"
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            {message && <p className="text-sm text-primary text-center">{message}</p>}
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Đăng ký'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-primary font-medium">
              Đăng nhập
            </Link>
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full mt-4 h-11"
            onClick={handleSeed}
          >
            Tải dữ liệu demo (sau khi đăng nhập)
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
