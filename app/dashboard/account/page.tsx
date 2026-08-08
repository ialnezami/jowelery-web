'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Lock, Phone, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

const getToken = () => typeof window !== 'undefined' ? (window as any).__JWT as string | undefined : undefined
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

interface UserProfile {
  id: string
  name: string | null
  email: string
  phone: string | null
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
            {icon}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function StatusMsg({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg mt-3 ${
        type === 'success'
          ? 'bg-green-50 border border-green-200 text-green-700'
          : 'bg-red-50 border border-red-200 text-red-700'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      {msg}
    </div>
  )
}

export default function AccountPage() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Profile state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [infoSaving, setInfoSaving] = useState(false)
  const [infoStatus, setInfoStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Change email state
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Change password state
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdStatus, setPwdStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch(`${B}/users/profile`, { headers: authHeaders() })
      .then(r => r.json())
      .then((data: UserProfile) => {
        setProfile(data)
        setName(data.name ?? '')
        setPhone(data.phone ?? '')
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [status])

  const handleSaveInfo = async () => {
    if (!name.trim()) {
      setInfoStatus({ type: 'error', msg: 'Name cannot be empty.' })
      return
    }
    setInfoSaving(true)
    setInfoStatus(null)
    try {
      const res = await fetch(`${B}/users/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.')
      setProfile(prev => prev ? { ...prev, name: data.name, phone: data.phone } : prev)
      await updateSession({ name: data.name })
      setInfoStatus({ type: 'success', msg: 'Profile updated successfully.' })
    } catch (err: any) {
      setInfoStatus({ type: 'error', msg: err.message })
    } finally {
      setInfoSaving(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      setEmailStatus({ type: 'error', msg: 'Enter a new email address.' })
      return
    }
    if (!emailPassword) {
      setEmailStatus({ type: 'error', msg: 'Enter your current password.' })
      return
    }
    setEmailSaving(true)
    setEmailStatus(null)
    try {
      const res = await fetch(`${B}/users/change-email`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword: emailPassword, newEmail: newEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change email.')
      setProfile(prev => prev ? { ...prev, email: data.email } : prev)
      setNewEmail('')
      setEmailPassword('')
      setEmailStatus({ type: 'success', msg: 'Email updated. Please sign in again with your new email.' })
    } catch (err: any) {
      setEmailStatus({ type: 'error', msg: err.message })
    } finally {
      setEmailSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPwd) {
      setPwdStatus({ type: 'error', msg: 'Enter your current password.' })
      return
    }
    if (newPwd.length < 8) {
      setPwdStatus({ type: 'error', msg: 'New password must be at least 8 characters.' })
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdStatus({ type: 'error', msg: 'Passwords do not match.' })
      return
    }
    setPwdSaving(true)
    setPwdStatus(null)
    try {
      const res = await fetch(`${B}/users/change-password`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password.')
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      setPwdStatus({ type: 'success', msg: 'Password changed successfully.' })
    } catch (err: any) {
      setPwdStatus({ type: 'error', msg: err.message })
    } finally {
      setPwdSaving(false)
    }
  }

  if (status === 'loading' || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  if (!session) return null

  const initials = (profile?.name || session.user.email || '?')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
        Account Settings
      </h1>
      <p className="text-gray-500 mb-8">Manage your profile, email, and password.</p>

      {/* Avatar summary */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md shrink-0">
          <span className="text-white text-xl font-light tracking-widest">{initials}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{profile?.name || '—'}</p>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
            {session.user.role.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── Personal Info ── */}
        <Section icon={<User className="h-4 w-4 text-amber-600" />} title="Personal Info">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Display Name
              </label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone
              </label>
              <Input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
              />
            </div>
            {infoStatus && <StatusMsg {...infoStatus} />}
            <Button
              onClick={handleSaveInfo}
              disabled={infoSaving}
              className="w-full bg-amber-500 hover:bg-amber-600"
            >
              {infoSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </Section>

        {/* ── Change Email ── */}
        <Section icon={<Mail className="h-4 w-4 text-amber-600" />} title="Change Email">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Current Email
              </label>
              <Input value={profile?.email ?? ''} disabled className="opacity-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                New Email
              </label>
              <Input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="new@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Current Password
              </label>
              <PasswordInput
                value={emailPassword}
                onChange={e => setEmailPassword(e.target.value)}
                placeholder="Confirm with your password"
              />
            </div>
            {emailStatus && <StatusMsg {...emailStatus} />}
            <Button
              onClick={handleChangeEmail}
              disabled={emailSaving}
              className="w-full bg-amber-500 hover:bg-amber-600"
            >
              {emailSaving ? 'Updating…' : 'Update Email'}
            </Button>
          </div>
        </Section>

        {/* ── Change Password ── */}
        <Section icon={<Lock className="h-4 w-4 text-amber-600" />} title="Change Password">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Current Password
              </label>
              <PasswordInput
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                placeholder="Current password"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                New Password
              </label>
              <PasswordInput
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="Min 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Confirm New Password
              </label>
              <PasswordInput
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
            {pwdStatus && <StatusMsg {...pwdStatus} />}
            <Button
              onClick={handleChangePassword}
              disabled={pwdSaving}
              className="w-full bg-amber-500 hover:bg-amber-600"
            >
              {pwdSaving ? 'Changing…' : 'Change Password'}
            </Button>
          </div>
        </Section>
      </div>
    </div>
  )
}
