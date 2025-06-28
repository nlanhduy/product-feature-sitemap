"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, X, List, Check } from "lucide-react";

const UseCaseInput = ({
  useCases = [],
  onUseCasesChange,
  allUseCases = [],
  onAllUseCasesChange,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAllUseCasesOpen, setIsAllUseCasesOpen] = useState(false);
  const inputRef = useRef(null);

  // Handle input change and show suggestions
  useEffect(() => {
    if (inputValue.trim()) {
      const queryLower = inputValue.toLowerCase();
      const filtered = allUseCases.filter(
        (useCase) =>
          useCase.toLowerCase().includes(queryLower) &&
          !useCases.includes(useCase)
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, useCases, allUseCases]);

  const handleAddUseCase = (useCase = inputValue.trim()) => {
    if (!useCase) return;

    // Add to all use cases if it's new
    if (!allUseCases.includes(useCase)) {
      const newAllUseCases = [...allUseCases, useCase].sort();
      onAllUseCasesChange(newAllUseCases);
    }

    // Add to current selection if not already there
    if (!useCases.includes(useCase)) {
      onUseCasesChange([...useCases, useCase]);
    }

    // Clear input and hide suggestions
    setInputValue("");
    setShowSuggestions(false);
  };

  const handleRemoveUseCase = (useCaseToRemove) => {
    onUseCasesChange(useCases.filter((useCase) => useCase !== useCaseToRemove));
  };

  const handleSelectFromSuggestion = (useCase) => {
    handleAddUseCase(useCase);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelectFromSuggestion(suggestions[0]);
      } else {
        handleAddUseCase();
      }
    }
  };

  const handleSelectFromAll = (useCase) => {
    if (useCases.includes(useCase)) {
      // If already selected, remove it
      onUseCasesChange(useCases.filter((u) => u !== useCase));
    } else {
      // If not selected, add it
      onUseCasesChange([...useCases, useCase]);
    }
  };

  const isUseCaseSelected = (useCase) => useCases.includes(useCase);

  return (
    <div className="space-y-3">
      {/* Selected Use Cases */}
      {useCases.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {useCases.map((useCase, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {useCase}
              <button
                type="button"
                onClick={() => handleRemoveUseCase(useCase)}
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-3 w-3 cursor-pointer hover:bg-destructive/20 rounded" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input with suggestions */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a use case..."
              className="pr-10"
            />

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length >= 5 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 h-max">
                <ScrollArea className="h-[200px]">
                  <div className="p-1">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectFromSuggestion(suggestion)}
                        className="px-3 py-2 hover:bg-muted rounded cursor-pointer text-sm transition-colors"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {showSuggestions && suggestions.length < 5 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 h-fit">
                <div className="p-1">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectFromSuggestion(suggestion)}
                      className="px-3 py-2 hover:bg-muted rounded cursor-pointer text-sm transition-colors"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={() => handleAddUseCase()}
            disabled={!inputValue.trim()}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAllUseCasesOpen(true)}
            size="sm"
          >
            <List className="h-4 w-4 mr-1" />
            Browse
          </Button>
        </div>
      </div>

      {/* All Use Cases Dialog */}
      <Dialog open={isAllUseCasesOpen} onOpenChange={setIsAllUseCasesOpen}>
        <DialogContent className="max-w-md max-h-[70vh]">
          <DialogHeader>
            <DialogTitle>Select Use Cases</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Choose from available use cases (click to toggle)
            </p>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] border rounded-lg">
            <div className="p-4 space-y-2">
              {allUseCases.length > 0 ? (
                allUseCases.map((useCase, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectFromAll(useCase)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      isUseCaseSelected(useCase)
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-sm">{useCase}</span>
                    {isUseCaseSelected(useCase) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No use cases available yet. Start by adding some!
                </p>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setIsAllUseCasesOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UseCaseInput;
