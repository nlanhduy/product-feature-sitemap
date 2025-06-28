"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Edit,
  Trash2,
  Plus,
  Target,
  Lightbulb,
  FileText,
  List,
} from "lucide-react";

const NodeDetails = ({
  node,
  onEdit,
  onDelete,
  onAddChild,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !node) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] py-10 px-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span className="truncate">{node.name}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(node)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddChild(node.id)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(node.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Feature Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {node.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {node.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Use Cases */}
          {node.useCases && node.useCases.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Use Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {node.useCases.map((useCase, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {useCase}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Value Proposition */}
          {node.valueProposition && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Value Proposition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {node.valueProposition}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Hierarchy Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Hierarchy Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Feature ID:</span>
                <span className="font-mono text-xs">{node.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sub-features:</span>
                <span>{node.children ? node.children.length : 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expanded:</span>
                <span>{node.isExpanded ? "Yes" : "No"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => onEdit(node)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Feature
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => onAddChild(node.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Sub-feature
              </Button>
              <Separator />
              <Button
                className="w-full justify-start"
                variant="destructive"
                onClick={() => onDelete(node.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Feature
              </Button>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NodeDetails;
