// Use case storage and management utilities (local demo version)
import { defaultUseCases } from "@/data/sample-use-cases";

const minimumSearchLength = 3;

const useCaseStorage = {
  // Get default use cases
  getDefaultUseCases: () => [...defaultUseCases],

  // Extract all use cases from tree (for initialization)
  extractUseCasesFromTree: (tree) => {
    const extractUseCases = (node) => {
      let useCases = [];
      if (node.useCases && Array.isArray(node.useCases)) {
        useCases = [...node.useCases];
      }
      if (node.children) {
        node.children.forEach((child) => {
          useCases = [...useCases, ...extractUseCases(child)];
        });
      }
      return useCases;
    };

    return extractUseCases(tree);
  },

  // Initialize use cases from tree and defaults
  initializeUseCases: function (tree) {
    const treeUseCases = this.extractUseCasesFromTree(tree);
    const allUseCases = [...new Set([...defaultUseCases, ...treeUseCases])];
    return allUseCases.sort();
  },

  // Search use cases
  searchUseCases: (allUseCases, query) => {
    if (!query || query.length < minimumSearchLength) return [];
    const queryLower = query.toLowerCase();
    return allUseCases.filter((useCase) =>
      useCase.toLowerCase().includes(queryLower)
    );
  },

  // Default use cases (for checking if a use case is default or custom)
  defaultUseCases: defaultUseCases,
};

export default useCaseStorage;
