'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

const ParentSelector = ({ isOpen, onClose, tree, onSelectParent }) => {
  const [selectedParentId, setSelectedParentId] = useState(null)

  const renderNodeTree = (node, level = 0) => {
    const isSelected = selectedParentId === node.id
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={node.id}>
        <div
          onClick={() => setSelectedParentId(node.id)}
          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'
          }`}
          style={{ marginLeft: level * 20 }}>
          <FileText className='h-4 w-4' />
          <span className='font-medium'>{node.name}</span>
          {hasChildren && (
            <Badge variant='secondary' className='text-xs ml-auto'>
              {node.children.length} sub-features
            </Badge>
          )}
        </div>

        {hasChildren &&
          node.isExpanded !== false &&
          node.children.map(child => renderNodeTree(child, level + 1))}
      </div>
    )
  }

  const handleConfirm = () => {
    if (selectedParentId) {
      onSelectParent(selectedParentId)
      setSelectedParentId(null)
    }
  }

  const handleCancel = () => {
    setSelectedParentId(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='!max-w-[50vw] !max-h-[70vh]'>
        <DialogHeader>
          <DialogTitle>Select Parent Feature</DialogTitle>
          <p className='text-sm text-muted-foreground'>
            Choose which feature should be the parent for the new sub-feature you want to
            create.
          </p>
        </DialogHeader>

        <ScrollArea className='max-h-96 border rounded-lg p-4'>
          {tree && renderNodeTree(tree)}
        </ScrollArea>

        <DialogFooter>
          <Button variant='outline' onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedParentId}>
            Add Sub-feature to Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ParentSelector
