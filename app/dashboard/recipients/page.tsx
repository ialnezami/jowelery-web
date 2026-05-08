'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, User, X, Star } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

interface Recipient {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  relationship: string | null
  isDefault: boolean
}

export default function RecipientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recipientToDelete, setRecipientToDelete] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relationship: '',
    isDefault: false,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (session) {
      fetchRecipients()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  const fetchRecipients = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${B}/recipients`)
      if (response.ok) {
        const data = await response.json()
        setRecipients(data)
      }
    } catch (error) {
      console.error('Error fetching recipients:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch recipients',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingRecipient(null)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      relationship: '',
      isDefault: false,
    })
    setShowForm(true)
  }

  const handleEdit = (recipient: Recipient) => {
    setEditingRecipient(recipient)
    setFormData({
      firstName: recipient.firstName,
      lastName: recipient.lastName,
      email: recipient.email || '',
      phone: recipient.phone || '',
      relationship: recipient.relationship || '',
      isDefault: recipient.isDefault,
    })
    setShowForm(true)
  }

  const handleDeleteClick = (recipientId: string) => {
    setRecipientToDelete(recipientId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!recipientToDelete) return

    try {
      const response = await fetch(`${B}/recipients/${recipientToDelete}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Recipient deleted successfully',
        })
        fetchRecipients()
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to delete recipient',
        })
      }
    } catch (error) {
      console.error('Error deleting recipient:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete recipient',
      })
    } finally {
      setRecipientToDelete(null)
    }
  }

  const handleSetDefault = async (recipientId: string) => {
    try {
      const response = await fetch(`${B}/recipients/${recipientId}/set-default`, {
        method: 'PUT',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Default recipient updated',
        })
        fetchRecipients()
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to set default recipient',
        })
      }
    } catch (error) {
      console.error('Error setting default recipient:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to set default recipient',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || null,
        phone: formData.phone || null,
        relationship: formData.relationship || null,
        isDefault: formData.isDefault,
      }

      let response
      if (editingRecipient) {
        response = await fetch(`${B}/recipients/${editingRecipient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch(`${B}/recipients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingRecipient ? 'Recipient updated successfully' : 'Recipient created successfully',
        })
        setShowForm(false)
        fetchRecipients()
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || (editingRecipient ? 'Failed to update recipient' : 'Failed to create recipient'),
        })
      }
    } catch (error) {
      console.error('Error saving recipient:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: editingRecipient ? 'Failed to update recipient' : 'Failed to create recipient',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Recipients
          </h1>
          <p className="text-gray-600">Manage people you purchase for</p>
        </div>
        <Button onClick={handleCreate} size="lg" className="w-full sm:w-auto">
          <Plus className="h-5 w-5 mr-2" />
          Add Recipient
        </Button>
      </div>

      {recipients.length === 0 ? (
        <Card className="border-0 shadow-md text-center py-12">
          <CardContent>
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">No recipients saved yet</p>
            <p className="text-gray-400 text-sm mb-6">Save recipients to quickly purchase items for family, friends, or colleagues</p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Recipient
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipients.map((recipient) => (
            <Card key={recipient.id} className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {recipient.isDefault && (
                      <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    )}
                    <h3 className="font-bold text-lg">
                      {recipient.firstName} {recipient.lastName}
                    </h3>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  {recipient.relationship && (
                    <p className="text-amber-600 font-medium">{recipient.relationship}</p>
                  )}
                  {recipient.email && <p>Email: {recipient.email}</p>}
                  {recipient.phone && <p>Phone: {recipient.phone}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!recipient.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(recipient.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(recipient)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(recipient.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recipient Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
            <CardHeader className="sticky top-0 bg-white z-10 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  {editingRecipient ? 'Edit Recipient' : 'Add New Recipient'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowForm(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                    <Input
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                    <Input
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship (optional)</label>
                  <Input
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    placeholder="e.g., Family, Friend, Colleague"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-700">
                    Set as default recipient
                  </label>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {editingRecipient ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : (
                      editingRecipient ? 'Update Recipient' : 'Create Recipient'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Recipient"
        description="Are you sure you want to delete this recipient? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  )
}

