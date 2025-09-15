'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
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

export default function Home() {
  // State management for the feature map
  // Using useState to manage the tree structure, use cases
  const [tree, setTree] = useState(initialTree)
  const [allUseCases, setAllUseCases] = useState([])
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // State for managing selected node, search results, and modal visibility
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isParentSelectorOpen, setIsParentSelectorOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [editingNode, setEditingNode] = useState(null)
  const [parentIdForNewNode, setParentIdForNewNode] = useState(null)
  const [nodeToDelete, setNodeToDelete] = useState(null)

  // Ref to prevent double execution in strict mode
  const isProcessingRef = useRef(false)

  const NODE_WIDTH = Number(process.env.NEXT_PUBLIC_NODE_WIDTH)
  const NODE_HEIGHT = Number(process.env.NEXT_PUBLIC_NODE_HEIGHT)
  const LEVEL_HEIGHT = Number(process.env.NEXT_PUBLIC_LEVEL_HEIGHT)

  // Calculate node positions - now only calculates once and keeps positions fixed
  const calculateLayout = useCallback((node, level = 0) => {
    const positions = new Map()

    // Calculate the width needed for each subtree (considering all nodes, not just expanded ones)
    const calculateSubtreeWidth = node => {
      if (!node.children || node.children.length === 0) {
        return NODE_WIDTH + 50
      }

      const childrenWidth = node.children.reduce((total, child) => {
        return total + calculateSubtreeWidth(child)
      }, 0)

      return Math.max(NODE_WIDTH + 50, childrenWidth)
    }

    // Position all nodes regardless of expand/collapse state
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
        // Root node - center it based on total tree width
        const totalTreeWidth = calculateSubtreeWidth(node)
        x = totalTreeWidth / 2
      } else if (siblings.length === 1) {
        // Single child - position directly under parent
        x = parentX
      } else {
        // Multiple siblings - distribute evenly
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

      // Layout ALL children regardless of expansion state
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

  // Only recalculate positions when tree structure changes (new nodes added/removed)
  const nodePositions = useMemo(() => calculateLayout(tree), [tree])
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })

  // Initialize use cases from initial data on first load
  useEffect(() => {
    const initialUseCases = useCaseStorage.initializeUseCases(initialTree)
    setAllUseCases(initialUseCases)
  }, [])

  // Enhanced search functionality
  // useCallback is used to memoize the search function and prevent unnecessary re-renders the children components
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

  const focusNode = (nodeId, nodePositions, svgRef, setTransform) => {
    if (!nodePositions) return
    const pos = nodePositions.get(nodeId)
    if (!pos) return
    if (!svgRef.current) return

    const { width: viewportWidth, height: viewportHeight } =
      svgRef.current.getBoundingClientRect()

    setTransform(prev => {
      const scale = prev.scale || 1

      const targetX = viewportWidth / 2 - pos.x * scale
      const targetY = viewportHeight / 2 - pos.y * scale

      return { ...prev, x: targetX, y: targetY }
    })
  }

  const handleSelectSearchResult = useCallback(
    result => {
      setSelectedNodeId(result.id)
      setIsDetailsOpen(true)

      focusNode(result.id, nodePositions, svgRef, setTransform)
    },
    [nodePositions, setTransform],
  )

  // Node operations
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

  // New handler for Add Node button in header
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
    formData => {
      // Prevent double execution in strict mode
      if (isProcessingRef.current) return
      isProcessingRef.current = true

      setTree(prevTree => {
        const newTree = treeUtils.deepClone(prevTree)

        if (editingNode) {
          // Update existing node
          treeUtils.updateNode(newTree, editingNode.id, formData)
        } else {
          // Create new node
          const newNode = {
            id: treeUtils.generateId(),
            ...formData,
            children: [],
            isExpanded: true,
          }

          treeUtils.addNode(newTree, parentIdForNewNode, newNode)
        }

        return newTree
      })

      setIsEditorOpen(false)
      setEditingNode(null)
      setParentIdForNewNode(null)

      // Reset the processing flag after a short delay
      setTimeout(() => {
        isProcessingRef.current = false
      }, 100)
    },
    [editingNode, parentIdForNewNode],
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

  const handleConfirmDelete = useCallback(() => {
    if (!nodeToDelete) return

    // Prevent double execution in strict mode
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    setTree(prevTree => {
      const newTree = treeUtils.deepClone(prevTree)
      treeUtils.deleteNode(newTree, nodeToDelete.id)
      return newTree
    })

    setIsDetailsOpen(false)
    setSelectedNodeId(null)
    setNodeToDelete(null)

    // Reset the processing flag after a short delay
    setTimeout(() => {
      isProcessingRef.current = false
    }, 100)
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

  // Handle use cases changes
  const handleAllUseCasesChange = useCallback(newAllUseCases => {
    setAllUseCases(newAllUseCases)
  }, [])

  // Data export/import
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

        // Handle both old format (just tree) and new format (tree + allUseCases)
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
    event.target.value = '' // Reset input
  }, [])

  return (
    <div className='h-screen flex flex-col bg-background'>
      {/* Sticky Header */}
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

      {/* Main Content */}
      <main className='flex-1 flex'>
        {/* Canvas Area */}
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

      {/* Modals and Dialogs */}
      <NodeEditor
        node={editingNode}
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
