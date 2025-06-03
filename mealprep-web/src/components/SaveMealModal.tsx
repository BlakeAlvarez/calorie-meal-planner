// modal to gather user for information used when saving a meal
// asks for meal name, user's name, and any additional notes if wanted

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MDEditor from "@uiw/react-md-editor";
import clsx from "clsx";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SaveMealModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, createdBy: string, notes: string) => void;
}) {
  const [name, setName] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={clsx(
          "transition-all duration-300 ease-in-out w-full",
          showNotes ? "max-w-4xl" : "max-w-2xl"
        )}
      >
        <DialogHeader>
          <DialogTitle>Save This Meal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Meal name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Your name"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
          />

          {/* toggle for notes section */}
          <div>
            <div className="flex items-center space-x-2">
              <Switch id="show-notes" checked={showNotes} onCheckedChange={() => setShowNotes((prev) => !prev)} />
              <Label htmlFor="show-notes">Add optional meal notes</Label>
            </div>
          </div>

          {/* if toggled, shows notes section */}
          {showNotes && (
            <div className="pt-2 w-full transition-all duration-300 ease-in-out">
              <label className="text-sm font-medium">Meal Notes</label>
              <div className="border rounded-md mt-1">
                <MDEditor
                  value={notes}
                  onChange={(val) => setNotes(val || "")}
                  height={200}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              if (name.trim() && createdBy.trim()) {
                onSave(name.trim(), createdBy.trim(), notes.trim());
                onClose();
              }
            }}
          >
            Save Meal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
