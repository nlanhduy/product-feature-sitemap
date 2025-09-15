'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import UseCaseInput from './use-case-input'

const NodeEditor = ({
  node,
  onSave,
  onCancel,
  isOpen,
  allUseCases,
  onAllUseCasesChange,
}) => {
  // State to manage form data and validation errors
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    useCases: [],
    valueProposition: '',
  })
  const [errors, setErrors] = useState({})

  // Effect to initialize form data when the dialog opens or node changes (node, isOpen)
  useEffect(() => {
    if (node) {
      setFormData({
        name: node.name || '',
        description: node.description || '',
        useCases: node.useCases || [],
        valueProposition: node.valueProposition || '',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        useCases: [],
        valueProposition: '',
      })
    }
    setErrors({})
  }, [node, isOpen])

  // Function to validate the form data (Node name is required)
  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Feature Name is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  // Prevent default form submission, validate the form, and call onSave with formData
  const handleSubmit = e => {
    e.preventDefault()
    if (validateForm()) {
      onSave(formData)
    }
  }

  // Handle input changes for form fields
  // Update formData state and clear any existing error for the field
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Handle changes to use cases
  const handleUseCasesChange = newUseCases => {
    setFormData(prev => ({ ...prev, useCases: newUseCases }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{node ? 'Edit Feature' : 'Create New Feature'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Feature Name */}
          <div className='space-y-2'>
            <Label htmlFor='name'>Feature Name *</Label>
            <Input
              id='name'
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder='Enter feature name'
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className='text-sm text-red-500'>{errors.name}</p>}
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder='Describe the purpose and functionality of this feature'
              rows={4}
            />
          </div>

          {/* Use Cases */}
          <div className='space-y-2'>
            <Label>Use Cases</Label>
            <UseCaseInput
              useCases={formData.useCases}
              onUseCasesChange={handleUseCasesChange}
              allUseCases={allUseCases}
              onAllUseCasesChange={onAllUseCasesChange}
            />
            <p className='text-sm text-muted-foreground'>
              Type to see suggestions from available use cases, or click Browse to see all
            </p>
          </div>

          {/* Value Proposition */}
          <div className='space-y-2'>
            <Label htmlFor='valueProposition'>Value Proposition</Label>
            <Textarea
              id='valueProposition'
              value={formData.valueProposition}
              onChange={e => handleInputChange('valueProposition', e.target.value)}
              placeholder='What value does this feature provide to users or the business?'
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onCancel}>
              Cancel
            </Button>
            <Button type='submit'>{node ? 'Update Feature' : 'Create Feature'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NodeEditor
