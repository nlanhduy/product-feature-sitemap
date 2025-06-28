"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Download, Upload } from "lucide-react";

import SearchBar from "@/components/search-bar";
import NodeEditor from "@/components/node-editor";
import NodeDetails from "@/components/node-details";
import SitemapCanvas from "@/components/sitemap-canvas";
import ParentSelector from "@/components/parent-selector";
import DeleteConfirmation from "@/components/delete-confirmation";
import searchUtils from "@/lib/search-utils";
import treeUtils from "@/lib/tree-utils";
import useCaseStorage from "@/lib/use-case-storage";
import { initialTree } from "@/data/sample-tree";

export default function Home() {
  const [tree, setTree] = useState(initialTree);
  const [allUseCases, setAllUseCases] = useState([]); // Lưu use cases giống như tree
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isParentSelectorOpen, setIsParentSelectorOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [parentIdForNewNode, setParentIdForNewNode] = useState(null);
  const [nodeToDelete, setNodeToDelete] = useState(null);

  // Ref to prevent double execution in strict mode
  const isProcessingRef = useRef(false);

  // Initialize use cases from initial data on first load
  useEffect(() => {
    const initialUseCases = useCaseStorage.initializeUseCases(initialTree);
    setAllUseCases(initialUseCases);
  }, []);

  // Enhanced search functionality
  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      const results = searchUtils.searchNodes(tree, query);
      setSearchResults(results);
    },
    [tree]
  );

  const handleClearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchQuery("");
  }, []);

  const handleSelectSearchResult = useCallback((result) => {
    setSelectedNodeId(result.id);
    setIsDetailsOpen(true);
  }, []);

  // Node operations
  const handleNodeClick = useCallback((node) => {
    setSelectedNodeId(node.id);
    setIsDetailsOpen(true);
  }, []);

  const handleNodeToggle = useCallback((nodeId) => {
    // Prevent double execution in strict mode
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setTree((prevTree) => {
      const newTree = treeUtils.deepClone(prevTree);
      treeUtils.toggleExpanded(newTree, nodeId);
      return newTree;
    });

    // Reset the processing flag after a short delay
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 100);
  }, []);

  const handleEditNode = useCallback((node) => {
    setEditingNode(node);
    setParentIdForNewNode(null);
    setIsEditorOpen(true);
    setIsDetailsOpen(false);
  }, []);

  const handleAddChild = useCallback((parentId) => {
    setEditingNode(null);
    setParentIdForNewNode(parentId);
    setIsEditorOpen(true);
    setIsDetailsOpen(false);
    setIsParentSelectorOpen(false);
  }, []);

  // New handler for Add Node button in header
  const handleAddNodeFromHeader = useCallback(() => {
    setIsParentSelectorOpen(true);
  }, []);

  const handleSelectParent = useCallback(
    (parentId) => {
      handleAddChild(parentId);
    },
    [handleAddChild]
  );

  const handleSaveNode = useCallback(
    (formData) => {
      // Prevent double execution in strict mode
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      setTree((prevTree) => {
        const newTree = treeUtils.deepClone(prevTree);

        if (editingNode) {
          // Update existing node
          treeUtils.updateNode(newTree, editingNode.id, formData);
        } else {
          // Create new node
          const newNode = {
            id: treeUtils.generateId(),
            ...formData,
            children: [],
            isExpanded: true,
          };

          treeUtils.addNode(newTree, parentIdForNewNode, newNode);
        }

        return newTree;
      });

      setIsEditorOpen(false);
      setEditingNode(null);
      setParentIdForNewNode(null);

      // Reset the processing flag after a short delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 100);
    },
    [editingNode, parentIdForNewNode]
  );

  const handleDeleteNode = useCallback(
    (nodeId) => {
      if (nodeId === "root") {
        return;
      }

      const nodeToDelete = treeUtils.findNode(tree, nodeId);
      setNodeToDelete(nodeToDelete);
      setIsDeleteConfirmOpen(true);
    },
    [tree]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!nodeToDelete) return;

    // Prevent double execution in strict mode
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setTree((prevTree) => {
      const newTree = treeUtils.deepClone(prevTree);
      treeUtils.deleteNode(newTree, nodeToDelete.id);
      return newTree;
    });

    setIsDetailsOpen(false);
    setSelectedNodeId(null);
    setNodeToDelete(null);

    // Reset the processing flag after a short delay
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 100);
  }, [nodeToDelete]);

  const handleCancelEdit = useCallback(() => {
    setIsEditorOpen(false);
    setEditingNode(null);
    setParentIdForNewNode(null);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
  }, []);

  const handleCloseParentSelector = useCallback(() => {
    setIsParentSelectorOpen(false);
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => {
    setIsDeleteConfirmOpen(false);
    setNodeToDelete(null);
  }, []);

  // Handle use cases changes
  const handleAllUseCasesChange = useCallback((newAllUseCases) => {
    setAllUseCases(newAllUseCases);
  }, []);

  // Data export/import
  const handleExportData = useCallback(() => {
    const exportData = {
      tree,
      allUseCases,
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "feature-map-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }, [tree, allUseCases]);

  const handleImportData = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        // Handle both old format (just tree) and new format (tree + allUseCases)
        if (importedData.tree) {
          setTree(importedData.tree);
          setAllUseCases(
            importedData.allUseCases ||
              useCaseStorage.initializeUseCases(importedData.tree)
          );
        } else {
          // Old format - just tree
          setTree(importedData);
          setAllUseCases(useCaseStorage.initializeUseCases(importedData));
        }
      } catch (error) {
        console.error("Failed to import data:", error);
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Feature Mind Map</h1>
            <Separator orientation="vertical" className="h-6" />
            <SearchBar
              onSearch={handleSearch}
              searchResults={searchResults}
              onSelectResult={handleSelectSearchResult}
              onClearSearch={handleClearSearch}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddNodeFromHeader}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <label htmlFor="import-file">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </span>
              </Button>
            </label>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Canvas Area */}
        <div className="flex-1">
          <SitemapCanvas
            tree={tree}
            onNodeClick={handleNodeClick}
            onNodeToggle={handleNodeToggle}
            selectedNodeId={selectedNodeId}
            searchResults={searchResults}
            searchQuery={searchQuery}
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

      <DeleteConfirmation
        isOpen={isDeleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        nodeName={nodeToDelete?.name || ""}
      />
    </div>
  );
}
