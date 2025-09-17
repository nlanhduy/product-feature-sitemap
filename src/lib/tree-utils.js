const treeUtils = {
  generateId: () => Math.random().toString(36).substr(2, 9),

  findNode: (tree, targetId) => {
    if (tree.id === targetId) return tree
    for (const child of tree.children || []) {
      const found = treeUtils.findNode(child, targetId)
      if (found) return found
    }
    return null
  },

  findParent: (tree, targetId, parent = null) => {
    if (tree.id === targetId) return parent
    for (const child of tree.children || []) {
      const found = treeUtils.findParent(child, targetId, tree)
      if (found) return found
    }
    return null
  },

  getAllChildrenNames: (tree, targetId) => {
    const node = treeUtils.findNode(tree, targetId)
    if (!node) return []

    const result = []
    const traverse = n => {
      for (const child of n.children || []) {
        if (child.name) result.push(child.name)
        traverse(child)
      }
    }

    traverse(node)
    return result
  },

  addNode: (tree, parentId, newNode) => {
    if (tree.id === parentId) {
      tree.children = tree.children || []
      tree.children.push(newNode)
      return true
    }
    for (const child of tree.children || []) {
      if (treeUtils.addNode(child, parentId, newNode)) return true
    }
    return false
  },

  updateNode: (tree, nodeId, updates) => {
    if (tree.id === nodeId) {
      Object.assign(tree, updates)
      return true
    }
    for (const child of tree.children || []) {
      if (treeUtils.updateNode(child, nodeId, updates)) return true
    }
    return false
  },

  deleteNode: (tree, targetId) => {
    if (!tree.children) return false
    const index = tree.children.findIndex(child => child.id === targetId)
    if (index !== -1) {
      tree.children.splice(index, 1)
      return true
    }
    for (const child of tree.children) {
      if (treeUtils.deleteNode(child, targetId)) return true
    }
    return false
  },

  toggleExpanded: (tree, nodeId) => {
    if (tree.id === nodeId) {
      tree.isExpanded = !tree.isExpanded
      return true
    }
    for (const child of tree.children || []) {
      if (treeUtils.toggleExpanded(child, nodeId)) return true
    }
    return false
  },

  // Deep clone function to avoid mutation issues
  deepClone: node => {
    return {
      ...node,
      children: node.children ? node.children.map(treeUtils.deepClone) : [],
    }
  },

  addIsExpandedProperty(node, currentLevel = 0, expandUntilLevel = 1) {
    function processNode(currentNode, level) {
      currentNode.isExpanded = level <= expandUntilLevel

      if (
        currentNode.children &&
        Array.isArray(currentNode.children) &&
        currentNode.children.length > 0
      ) {
        currentNode.children = currentNode.children.map(child =>
          processNode({ ...child }, level + 1),
        )
      }

      return currentNode
    }

    return processNode({ ...node }, currentLevel)
  },

  collectAllUseCases(rootNode) {
    const useCasesSet = new Set()

    function traverseNode(node) {
      if (node.useCases && Array.isArray(node.useCases)) {
        node.useCases.forEach(useCase => {
          if (typeof useCase === 'object' && useCase !== null) {
            if (useCase.id) {
              useCasesSet.add(JSON.stringify(useCase))
            }
          } else {
            useCasesSet.add(useCase)
          }
        })
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(child => traverseNode(child))
      }
    }

    traverseNode(rootNode)

    const result = Array.from(useCasesSet).map(item => {
      try {
        return JSON.parse(item)
      } catch (e) {
        return item
      }
    })

    return result
  },
}

export default treeUtils
