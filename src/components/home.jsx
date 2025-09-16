'use client'

import { useState, useCallback, useRef, useEffect, useMemo, use } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Plus, Download, Upload } from 'lucide-react'
import SearchBar from '@/components/search-bar'
import NodeEditor from '@/components/node-editor'
import NodeDetails from '@/components/node-details'
import SitemapCanvas from '@/components/sitemap-canvas'
import ParentSelector from '@/components/parent-selector'
import DeleteConfirmation from '@/components/delete-confirmation'
import searchUtils from '@/lib/search-utils'
import treeUtils from '@/lib/tree-utils'
import useCaseStorage from '@/lib/use-case-utils'
import { initialTree } from '@/data/sample-tree'
import { ChatWidget } from './chat-widget'
import { useMutation } from '@tanstack/react-query'
import { FeatureService } from '@/services/FeatureService'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

export default function Home() {
  const [tree, setTree] = useState(initialTree)
  const [allUseCases, setAllUseCases] = useState([])
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [selectedNodeId, setSelectedNodeId] = useState(null)

  const [searchResults, setSearchResults] = useState([])
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isParentSelectorOpen, setIsParentSelectorOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [editingNode, setEditingNode] = useState(null)
  const [parentIdForNewNode, setParentIdForNewNode] = useState(null)
  const [nodeToDelete, setNodeToDelete] = useState(null)
  const isProcessingRef = useRef(false)

  const NODE_WIDTH = Number(process.env.NEXT_PUBLIC_NODE_WIDTH)
  const NODE_HEIGHT = Number(process.env.NEXT_PUBLIC_NODE_HEIGHT)
  const LEVEL_HEIGHT = Number(process.env.NEXT_PUBLIC_LEVEL_HEIGHT)

  // CRUD
  const deleteFeatureMutation = useMutation({
    mutationFn: FeatureService.delete,
    onSuccess: () => {
      toast('Feature deleted', {
        description: 'The feature has been successfully deleted.',
        variant: 'success',
      })
    },
    onError: error => {
      toast('Error deleting feature', {
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const addFeatureMutation = useMutation({
    mutationFn: FeatureService.create,
    onSuccess: () => {
      toast('Feature created', {
        description: 'The new feature has been successfully created.',
        variant: 'success',
      })
    },
    onError: error => {
      toast('Error creating feature', {
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const editFeatureMutation = useMutation({
    mutationFn: FeatureService.update,
    onSuccess: () => {
      toast('Feature updated', {
        description: 'The feature has been successfully updated.',
        variant: 'success',
      })
    },
    onError: error => {
      toast('Error updating feature', {
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    },
  })
  const calculateLayout = useCallback((node, level = 0) => {
    const positions = new Map()

    const calculateSubtreeWidth = node => {
      if (!node.children || node.children.length === 0) {
        return NODE_WIDTH + 50
      }

      const childrenWidth = node.children.reduce((total, child) => {
        return total + calculateSubtreeWidth(child)
      }, 0)

      return Math.max(NODE_WIDTH + 50, childrenWidth)
    }

    const layoutNode = (
      node,
      level,
      parentX,
      availableWidth,
      siblingIndex = 0,
      siblings = [],
    ) => {
      let x = parentX

      if (level === 0) {
        const totalTreeWidth = calculateSubtreeWidth(node)
        x = totalTreeWidth / 2
      } else if (siblings.length === 1) {
        x = parentX
      } else {
        const totalSiblingsWidth = siblings.reduce((total, sibling) => {
          return total + calculateSubtreeWidth(sibling)
        }, 0)

        let offsetX = 0
        for (let i = 0; i < siblingIndex; i++) {
          offsetX += calculateSubtreeWidth(siblings[i])
        }

        const mySubtreeWidth = calculateSubtreeWidth(node)
        x = parentX - totalSiblingsWidth / 2 + offsetX + mySubtreeWidth / 2
      }

      const y = 80 + level * LEVEL_HEIGHT
      positions.set(node.id, { x, y, level, node })

      if (node.children && node.children.length > 0) {
        const mySubtreeWidth = calculateSubtreeWidth(node)
        node.children.forEach((child, index) => {
          layoutNode(child, level + 1, x, mySubtreeWidth, index, node.children)
        })
      }
    }

    layoutNode(node, level, 0, 0)
    return positions
  }, [])

  const nodePositions = useMemo(() => calculateLayout(tree), [tree])

  useEffect(() => {
    const initialUseCases = useCaseStorage.initializeUseCases(initialTree)
    setAllUseCases(initialUseCases)
  }, [])

  const handleSearch = useCallback(
    query => {
      if (!query.trim()) {
        setSearchResults([])
        return
      }

      const results = searchUtils.searchNodes(tree, query)
      setSearchResults(results)
    },
    [tree],
  )

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchResults([])
  }, [])

  const getContentBounds = useCallback(() => {
    let minX = Number.POSITIVE_INFINITY,
      maxX = Number.NEGATIVE_INFINITY,
      minY = Number.POSITIVE_INFINITY,
      maxY = Number.NEGATIVE_INFINITY

    nodePositions.forEach(({ x, y }) => {
      minX = Math.min(minX, x - NODE_WIDTH / 2)
      maxX = Math.max(maxX, x + NODE_WIDTH / 2)
      minY = Math.min(minY, y - NODE_HEIGHT / 2)
      maxY = Math.max(maxY, y + NODE_HEIGHT / 2)
    })

    // Add padding
    const padding = 100
    return {
      minX: minX === Number.POSITIVE_INFINITY ? 0 : minX - padding,
      maxX: maxX === Number.NEGATIVE_INFINITY ? dimensions.width : maxX + padding,
      minY: minY === Number.POSITIVE_INFINITY ? 0 : minY - padding,
      maxY: maxY === Number.NEGATIVE_INFINITY ? dimensions.height : maxY + padding,
      width:
        maxX === Number.NEGATIVE_INFINITY ? dimensions.width : maxX - minX + padding * 2,
      height:
        maxY === Number.NEGATIVE_INFINITY ? dimensions.height : maxY - minY + padding * 2,
    }
  }, [nodePositions, dimensions])

  const focusOnNode = nodeId => {
    const position = nodePositions.get(nodeId)
    if (!position || !containerRef.current) return

    const { width, height } = dimensions

    const containerCenterX = width / 2
    const containerCenterY = height / 2

    const newX = containerCenterX - position.x * transform.scale
    const newY = containerCenterY - position.y * transform.scale

    setTransform(prev => ({
      ...prev,
      x: newX,
      y: newY,
    }))
  }

  const handleSelectSearchResult = useCallback(
    result => {
      setSelectedNodeId(result.id)
      setIsDetailsOpen(true)
      focusOnNode(result.id)
    },
    [nodePositions, setTransform],
  )

  const handleNodeClick = useCallback(node => {
    setSelectedNodeId(node.id)
    setIsDetailsOpen(true)
  }, [])

  const handleNodeToggle = useCallback(nodeId => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    setTree(prevTree => {
      const newTree = treeUtils.deepClone(prevTree)

      const findNode = (tree, id) => {
        if (tree.id === id) return tree
        for (const child of tree.children || []) {
          const res = findNode(child, id)
          if (res) return res
        }
        return null
      }

      const targetNode = findNode(newTree, nodeId)
      const isFirstClick = targetNode && targetNode.isExpanded === undefined

      treeUtils.toggleExpanded(newTree, nodeId)

      if (isFirstClick) {
        treeUtils.toggleExpanded(newTree, nodeId)
      }

      return newTree
    })

    setTimeout(() => {
      isProcessingRef.current = false
    }, 100)
  }, [])

  const handleEditNode = useCallback(node => {
    setEditingNode(node)
    setParentIdForNewNode(null)
    setIsEditorOpen(true)
    setIsDetailsOpen(false)
  }, [])

  const handleAddChild = useCallback(parentId => {
    setEditingNode(null)
    setParentIdForNewNode(parentId)
    setIsEditorOpen(true)
    setIsDetailsOpen(false)
    setIsParentSelectorOpen(false)
  }, [])

  const handleAddNodeFromHeader = useCallback(() => {
    setIsParentSelectorOpen(true)
  }, [])

  const handleSelectParent = useCallback(
    parentId => {
      handleAddChild(parentId)
    },
    [handleAddChild],
  )

  const handleSaveNode = useCallback(
    async formData => {
      if (isProcessingRef.current) return
      isProcessingRef.current = true

      try {
        if (editingNode) {
          const updatedFeature = await editFeatureMutation.mutateAsync({
            featureId: editingNode.id,
            data: { ...formData },
          })

          setTree(prevTree => {
            const newTree = treeUtils.deepClone(prevTree)
            treeUtils.updateNode(newTree, editingNode.id, updatedFeature || formData)
            return newTree
          })
        } else {
          const newFeatureData = {
            ...formData,
            children: [],
            parent_id: parentIdForNewNode,
          }

          const createdFeature = await addFeatureMutation.mutateAsync(newFeatureData)

          setTree(prevTree => {
            const newTree = treeUtils.deepClone(prevTree)
            const newNode = {
              id: createdFeature._id,
              ...createdFeature,
              children: [],
              isExpanded: true,
            }
            treeUtils.addNode(newTree, parentIdForNewNode, newNode)
            return newTree
          })
        }

        setIsEditorOpen(false)
        setEditingNode(null)
        setParentIdForNewNode(null)
      } catch (error) {
        console.error('Failed to save node:', error)
      } finally {
        setTimeout(() => {
          isProcessingRef.current = false
        }, 100)
      }
    },
    [editingNode, parentIdForNewNode, editFeatureMutation, addFeatureMutation],
  )

  const handleDeleteNode = useCallback(
    nodeId => {
      if (nodeId === 'root') {
        return
      }

      const nodeToDelete = treeUtils.findNode(tree, nodeId)
      setNodeToDelete(nodeToDelete)
      setIsDeleteConfirmOpen(true)
    },
    [tree],
  )
  const handleConfirmDelete = useCallback(async () => {
    if (!nodeToDelete) return
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    try {
      await deleteFeatureMutation.mutateAsync(nodeToDelete.id)

      setTree(prevTree => {
        const newTree = treeUtils.deepClone(prevTree)
        treeUtils.deleteNode(newTree, nodeToDelete.id)
        return newTree
      })
      setIsDetailsOpen(false)
      setSelectedNodeId(null)
      setNodeToDelete(null)
    } catch (error) {
      console.error('Failed to delete feature:', error)
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false
      }, 100)
    }
  }, [nodeToDelete])

  const handleCancelEdit = useCallback(() => {
    setIsEditorOpen(false)
    setEditingNode(null)
    setParentIdForNewNode(null)
  }, [])

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false)
  }, [])

  const handleCloseParentSelector = useCallback(() => {
    setIsParentSelectorOpen(false)
  }, [])

  const handleCloseDeleteConfirm = useCallback(() => {
    setIsDeleteConfirmOpen(false)
    setNodeToDelete(null)
  }, [])

  const handleAllUseCasesChange = useCallback(newAllUseCases => {
    setAllUseCases(newAllUseCases)
  }, [])

  const handleExportData = useCallback(() => {
    const exportData = {
      tree,
      allUseCases,
    }
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'feature-map-data.json'
    link.click()
    URL.revokeObjectURL(url)
  }, [tree, allUseCases])

  const handleImportData = useCallback(event => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const importedData = JSON.parse(e.target.result)

        if (importedData.tree) {
          setTree(importedData.tree)
          setAllUseCases(
            importedData.allUseCases ||
              useCaseStorage.initializeUseCases(importedData.tree),
          )
        } else {
          setTree(importedData)
          setAllUseCases(useCaseStorage.initializeUseCases(importedData))
        }
      } catch (error) {
        console.error('Failed to import data:', error)
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }, [])

  return (
    <div className='h-screen flex flex-col bg-background'>
      <Toaster />

      <header className='sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm'>
        <div className='flex items-center justify-between p-4'>
          <div className='flex items-center gap-4'>
            <h1 className='text-2xl font-bold'>Feature Mind Map</h1>
            <Separator orientation='vertical' className='h-6' />
            <SearchBar
              onSearch={handleSearch}
              searchResults={searchResults}
              onSelectResult={handleSelectSearchResult}
              onClearSearch={handleClearSearch}
            />
          </div>

          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={handleAddNodeFromHeader}>
              <Plus className='h-4 w-4 mr-2' />
              Add Feature
            </Button>
            <Button variant='outline' size='sm' onClick={handleExportData}>
              <Download className='h-4 w-4 mr-2' />
              Export
            </Button>
            <label htmlFor='import-file'>
              <Button variant='outline' size='sm' asChild>
                <span>
                  <Upload className='h-4 w-4 mr-2' />
                  Import
                </span>
              </Button>
            </label>
            <input
              id='import-file'
              type='file'
              accept='.json'
              onChange={handleImportData}
              className='hidden'
            />
          </div>
        </div>
      </header>

      <main className='flex-1 flex'>
        <div className='flex-1'>
          <SitemapCanvas
            tree={tree}
            containerRef={containerRef}
            svgRef={svgRef}
            onNodeClick={handleNodeClick}
            dimensions={dimensions}
            setDimensions={setDimensions}
            nodePositions={nodePositions}
            transform={transform}
            setTransform={setTransform}
            getContentBounds={getContentBounds}
            onNodeToggle={handleNodeToggle}
            selectedNodeId={selectedNodeId}
            searchResults={searchResults}
          />
        </div>
      </main>

      <NodeEditor
        node={editingNode}
        parentNode={
          parentIdForNewNode ? treeUtils.findNode(tree, parentIdForNewNode) : null
        }
        onSave={handleSaveNode}
        onCancel={handleCancelEdit}
        isOpen={isEditorOpen}
        allUseCases={allUseCases}
        onAllUseCasesChange={handleAllUseCasesChange}
      />

      <NodeDetails
        node={selectedNodeId ? treeUtils.findNode(tree, selectedNodeId) : null}
        onEdit={handleEditNode}
        onDelete={handleDeleteNode}
        onAddChild={handleAddChild}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
      />

      <ParentSelector
        isOpen={isParentSelectorOpen}
        onClose={handleCloseParentSelector}
        tree={tree}
        onSelectParent={handleSelectParent}
      />

      <ChatWidget
        tree={tree}
        handleMoveToNode={focusOnNode}
        handleNodeDetailClick={handleNodeClick}
        handleAddSubfeature={handleAddChild}
        handleEditFeature={handleEditNode}
        handleDeleteFeature={handleDeleteNode}
      />

      <DeleteConfirmation
        isOpen={isDeleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        nodeName={nodeToDelete?.name || ''}
      />
    </div>
  )
}
