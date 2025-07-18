const treeUtils = {
  generateId: () => Math.random().toString(36).substr(2, 9),

  findNode: (tree, targetId) => {
    if (tree.id === targetId) return tree;
    for (const child of tree.children || []) {
      const found = treeUtils.findNode(child, targetId);
      if (found) return found;
    }
    return null;
  },

  findParent: (tree, targetId, parent = null) => {
    if (tree.id === targetId) return parent;
    for (const child of tree.children || []) {
      const found = treeUtils.findParent(child, targetId, tree);
      if (found) return found;
    }
    return null;
  },

  addNode: (tree, parentId, newNode) => {
    if (tree.id === parentId) {
      tree.children = tree.children || [];
      tree.children.push(newNode);
      return true;
    }
    for (const child of tree.children || []) {
      if (treeUtils.addNode(child, parentId, newNode)) return true;
    }
    return false;
  },

  updateNode: (tree, nodeId, updates) => {
    if (tree.id === nodeId) {
      Object.assign(tree, updates);
      return true;
    }
    for (const child of tree.children || []) {
      if (treeUtils.updateNode(child, nodeId, updates)) return true;
    }
    return false;
  },

  deleteNode: (tree, targetId) => {
    if (!tree.children) return false;
    const index = tree.children.findIndex((child) => child.id === targetId);
    if (index !== -1) {
      tree.children.splice(index, 1);
      return true;
    }
    for (const child of tree.children) {
      if (treeUtils.deleteNode(child, targetId)) return true;
    }
    return false;
  },

  toggleExpanded: (tree, nodeId) => {
    if (tree.id === nodeId) {
      tree.isExpanded = !tree.isExpanded;
      return true;
    }
    for (const child of tree.children || []) {
      if (treeUtils.toggleExpanded(child, nodeId)) return true;
    }
    return false;
  },

  // Deep clone function to avoid mutation issues
  deepClone: (obj) => {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array)
      return obj.map((item) => treeUtils.deepClone(item));
    if (typeof obj === "object") {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = treeUtils.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  },
};

export default treeUtils;
