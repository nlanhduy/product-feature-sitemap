'use client'

import React from 'react'
import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

const SitemapCanvas = ({
  tree,
  onNodeClick,
  onNodeToggle,
  selectedNodeId,
  transform,
  containerRef,
  setTransform,
  dimensions,
  setDimensions,
  getContentBounds,
  nodePositions,
  svgRef,
  searchResults = [],
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  // Fixed node dimensions
  const NODE_WIDTH = Number(process.env.NEXT_PUBLIC_NODE_WIDTH)
  const NODE_HEIGHT = Number(process.env.NEXT_PUBLIC_NODE_HEIGHT)
  const LEVEL_HEIGHT = Number(process.env.NEXT_PUBLIC_LEVEL_HEIGHT)

  // Update dimensions on resize
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

  // Handle mouse events
  const handleMouseDown = useCallback(
    e => {
      // If the click is on a node element, do not start dragging
      if (e.target.closest('.node-element')) return
      setIsDragging(true)

      // Calculate the starting point for dragging
      setDragStart({
        x: e.clientX - transform.x,
        y: e.clientY - transform.y,
      })
    },
    [transform],
  )

  const handleMouseMove = useCallback(
    e => {
      if (!isDragging) return

      // Update the transform based on mouse movement (dragStart)
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }))
    },
    [isDragging, dragStart],
  )

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle mouse wheel for zooming
  const handleWheel = useCallback(
    e => {
      // Prevent default scrolling behavior (e.g., page scroll)
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.max(0.1, Math.min(3, transform.scale * delta))

      // Calculate the new position based on the mouse position
      setTransform(prev => ({ ...prev, scale: newScale }))
    },
    [transform.scale],
  )

  // Fixed expand/collapse handler
  const handleExpandCollapseClick = useCallback(
    (e, nodeId) => {
      e.preventDefault()

      e.stopPropagation()
      onNodeToggle(nodeId)
    },
    [onNodeToggle],
  )

  // Zoom controls
  const zoomIn = () =>
    setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))
  const zoomOut = () =>
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, prev.scale / 1.2),
    }))

  // Simplified reset view - just reset to initial position and scale
  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 })
  }

  // Event listeners
  useEffect(() => {
    // Ensure the container is available before adding event listeners
    const container = containerRef.current
    if (!container) return

    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('mouseleave', handleMouseUp)

    // Use passive: false to allow preventDefault in wheel event
    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('mouseleave', handleMouseUp)
      container.removeEventListener('wheel', handleWheel)
    }
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel])

  // Get node color based on type and state
  const getNodeColor = node => {
    const isSelected = selectedNodeId === node.id
    const isSearchResult = searchResults.some(result => result.node.id === node.id)

    if (isSelected) return '#f97316' // orange-500 - selected
    if (isSearchResult) {
      // Different colors for exact vs synonym matches
      const result = searchResults.find(r => r.node.id === node.id)
      return result?.matchType === 'exact' ? '#10b981' : '#3b82f6' // green for exact, blue for synonym
    }

    // Root node gets purple color, others get white
    return node.id === tree.id ? '#7c3aed' : '#ffffff' // violet-600 - root
  }

  const getNodeStroke = node => {
    const isSelected = selectedNodeId === node.id
    const isSearchResult = searchResults.some(result => result.node.id === node.id)

    if (isSelected) return '#ea580c' // orange-600 - stroke cho selected
    if (isSearchResult) {
      const result = searchResults.find(r => r.node.id === node.id)
      return result?.matchType === 'exact' ? '#059669' : '#2563eb' // darker green/blue for stroke
    }
    return node.id === tree.id ? 'none' : '#e5e7eb'
  }

  const getTextColor = node => {
    const isRoot = node.id === tree.id
    const isSelected = selectedNodeId === node.id
    const isSearchResult = searchResults.some(result => result.node.id === node.id)

    return isRoot || isSelected || isSearchResult ? '#ffffff' : '#374151'
  }

  // Render individual node
  const renderNode = node => {
    const position = nodePositions.get(node.id)
    if (!position) return null

    const hasChildren = node.children && node.children.length > 0
    const isExpanded = node.isExpanded !== false
    const nodeColor = getNodeColor(node)
    const nodeStroke = getNodeStroke(node)
    const textColor = getTextColor(node)
    const isRoot = node.id === tree.id
    const isSearchResult = searchResults.some(result => result.node.id === node.id)

    // Helper function to wrap text
    const wrapText = (text, maxLength) => {
      if (!text || text.length <= maxLength) return [text || '']

      const words = text.split(' ')
      const lines = []
      let currentLine = ''

      for (const word of words) {
        if ((currentLine + word).length <= maxLength) {
          currentLine += (currentLine ? ' ' : '') + word
        } else {
          if (currentLine) lines.push(currentLine)
          currentLine = word
        }
      }
      if (currentLine) lines.push(currentLine)

      // Limit to 2 lines for description
      if (lines.length > 2) {
        lines[1] = lines[1].substring(0, maxLength - 3) + '...'
        return lines.slice(0, 2)
      }
      return lines
    }
    // Wrap the feature name (allow up to 2 lines)
    const nameLines = wrapText(node.name, 32)

    // Wrap the description (allow up to 2 lines, shorter per line)
    const descriptionLines = node.description
      ? wrapText(node.description, 35)
      : ['No description']

    return (
      // Use a unique key for each node element to ensure React can track changes and updates
      <g key={node.id} className='node-element'>
        {/* Node shadow */}
        <rect
          x={position.x - NODE_WIDTH / 2 + 2}
          y={position.y - NODE_HEIGHT / 2 + 2}
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx={12}
          fill='rgba(0,0,0,0.1)'
        />

        {/* Search result glow effect */}
        {isSearchResult && (
          <rect
            x={position.x - NODE_WIDTH / 2 - 3}
            y={position.y - NODE_HEIGHT / 2 - 3}
            width={NODE_WIDTH + 6}
            height={NODE_HEIGHT + 6}
            rx={15}
            fill='none'
            stroke={nodeStroke}
            strokeWidth={3}
            opacity={0.6}
            className='animate-pulse'
          />
        )}

        {/* Node background */}
        <rect
          x={position.x - NODE_WIDTH / 2}
          y={position.y - NODE_HEIGHT / 2}
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx={12}
          fill={nodeColor}
          stroke={nodeStroke}
          strokeWidth={isSearchResult ? 2 : 1}
          className='cursor-pointer transition-all duration-200 hover:shadow-lg'
          onClick={() => onNodeClick(node)}
        />

        {/* Node title - multi-line support */}
        {nameLines.map((line, index) => (
          <text
            key={`name-${index}`}
            x={position.x}
            y={position.y - 25 + index * 18}
            textAnchor='middle'
            fill={textColor}
            fontSize='16'
            fontWeight='600'
            className='pointer-events-none select-none'>
            {line}
          </text>
        ))}

        {/* Node description - multi-line support */}
        {descriptionLines.map((line, index) => (
          <text
            key={`desc-${index}`}
            x={position.x}
            y={position.y + 10 + index * 14}
            textAnchor='middle'
            fill={
              isRoot || selectedNodeId === node.id || isSearchResult
                ? 'rgba(255,255,255,0.8)'
                : '#6b7280'
            }
            fontSize='12'
            className='pointer-events-none select-none'>
            {line}
          </text>
        ))}

        {/* Children count badge */}
        {hasChildren && (
          <g>
            <circle
              cx={position.x - NODE_WIDTH / 2 + 25}
              cy={position.y + NODE_HEIGHT / 2 - 25}
              r={12}
              fill={isRoot ? '#1e40af' : '#3b82f6'}
              className='drop-shadow-sm'
            />
            <text
              x={position.x - NODE_WIDTH / 2 + 25}
              y={position.y + NODE_HEIGHT / 2 - 20}
              textAnchor='middle'
              fill='white'
              fontSize='12'
              fontWeight='600'
              className='pointer-events-none select-none'>
              {node.children.length}
            </text>
          </g>
        )}

        {/* Expand/collapse button */}
        {hasChildren && (
          <g>
            <circle
              cx={position.x + NODE_WIDTH / 2 - 25}
              cy={position.y + NODE_HEIGHT / 2 - 25}
              r={12}
              fill='white'
              stroke='#d1d5db'
              strokeWidth={1}
              className='cursor-pointer hover:fill-gray-50 transition-colors drop-shadow-sm'
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                handleExpandCollapseClick(e, node.id)
              }}
            />
            <text
              x={position.x + NODE_WIDTH / 2 - 25}
              y={position.y + NODE_HEIGHT / 2 - 19}
              textAnchor='middle'
              fill='#6b7280'
              fontSize='14'
              fontWeight='600'
              className='pointer-events-none select-none'>
              {isExpanded ? '−' : '+'}
            </text>
          </g>
        )}
      </g>
    )
  }

  // Render connections between nodes
  const renderConnections = node => {
    const position = nodePositions.get(node.id)
    if (!position || node.isExpanded === false || !node.children) return null

    return node.children.map(child => {
      const childPosition = nodePositions.get(child.id)
      if (!childPosition) return null

      return (
        <line
          key={`${node.id}-${child.id}`}
          x1={position.x}
          y1={position.y + NODE_HEIGHT / 2}
          x2={childPosition.x}
          y2={childPosition.y - NODE_HEIGHT / 2}
          stroke='#9ca3af'
          strokeWidth={2}
          className='transition-all duration-300'
        />
      )
    })
  }

  // Render all nodes recursively
  const renderAllNodes = node => {
    const elements = [renderNode(node), renderConnections(node)]

    if (node.isExpanded !== false && node.children) {
      node.children.forEach(child => {
        elements.push(renderAllNodes(child))
      })
    }

    // Flatten the elements array to avoid nested arrays
    return elements.flat()
  }

  // Calculate SVG dimensions to ensure all content is visible
  const bounds = getContentBounds()
  const svgWidth = Math.max(dimensions.width, bounds.width)
  const svgHeight = Math.max(dimensions.height, bounds.height)

  return (
    <div
      ref={containerRef}
      className='relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden'>
      {/* Zoom Controls - Sticky */}
      <div className='fixed top-32 right-4 z-40 flex flex-col gap-2'>
        <Button
          size='sm'
          variant='outline'
          onClick={zoomIn}
          className='shadow-lg bg-white/95 backdrop-blur'>
          <ZoomIn className='w-4 h-4' />
        </Button>
        <Button
          size='sm'
          variant='outline'
          onClick={zoomOut}
          className='shadow-lg bg-white/95 backdrop-blur'>
          <ZoomOut className='w-4 h-4' />
        </Button>
        <Button
          size='sm'
          variant='outline'
          onClick={resetView}
          className='shadow-lg bg-white/95 backdrop-blur'>
          <Maximize2 className='w-4 h-4' />
        </Button>
      </div>

      {/* Scale Indicator - Sticky */}
      <div className='fixed bottom-4 right-4 z-40 bg-white/95 backdrop-blur px-3 py-2 rounded-lg text-sm text-gray-600 border shadow-lg'>
        {Math.round(transform.scale * 100)}%
      </div>

      {/* Instructions - Sticky */}
      <div className='fixed bottom-4 left-4 z-40 bg-white/95 backdrop-blur px-4 py-3 rounded-lg text-xs text-gray-600 border shadow-lg max-w-48'>
        <div className='font-medium mb-1'>Controls:</div>
        <div>• Click nodes to view details</div>
        <div>• Use +/− to expand/collapse</div>
        <div>• Drag to pan, scroll to zoom</div>
        <div>• Search highlights matches</div>
      </div>
      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={svgWidth}
        height={svgHeight}
        className='cursor-grab active:cursor-grabbing'
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}>
        {/* Background grid */}
        <defs>
          <pattern id='grid' width='30' height='30' patternUnits='userSpaceOnUse'>
            <path
              d='M 30 0 L 0 0 0 30'
              fill='none'
              stroke='#f3f4f6'
              strokeWidth='1'
              opacity='0.5'
            />
          </pattern>
        </defs>
        {/* Background grid */}
        <rect width='100%' height='100%' fill='url(#grid)' />

        {/* Render the tree */}
        <g>{renderAllNodes(tree)}</g>
      </svg>
    </div>
  )
}

export default React.memo(SitemapCanvas)
