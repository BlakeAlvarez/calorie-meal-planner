// page to build meal with various ingredients the user searches or manually adds

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AddFood from "@/components/AddFood";
import PeoplePanel from "@/components/PeoplePanel";
import { useGroupStore } from "@/stores/groupStore";
import { usePeopleStore } from "@/stores/peopleStore";
import { MealDragAssign } from "@/components/MealDragAssign";
import { useStepNavigator } from "@/hooks/useStepNavigator";
import { StepProgressBar } from "@/components/StepProgressBar";
import { HelpButton } from "@/components/HelpButton";
import { useFoodSearchCacheStore } from "@/stores/foodSearchCacheStore";

const BuildMeal = () => {
  const { nextStep, prevStep } = useStepNavigator();
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const { addGroup, groups } = useGroupStore();
  const people = usePeopleStore((s) => s.people);

  // when user navigates away from build meal page, clear cached search items
  useEffect(() => {
    return () => {
      useFoodSearchCacheStore.getState().clearCache();
    };
  }, []);


  // when user presses Back
  const handleBack = () => {
    if (people.length > 0) {
      setConfirmDialogOpen(true); // prompt confirmation if people already set
    } else {
      prevStep();
    }
  };

  // user confirms going back and clearing people
  const handleConfirmBack = () => {
    // clearPeople();
    setConfirmDialogOpen(false);
    prevStep();
  };

  return (
    <div className="p-6 space-y-4">

      {/* shows user progress bar for meal setup flow */}
      <StepProgressBar />

      {/* header, help menu, and next/back navigation */}
        <div className="flex items-center justify-between mb-4">
        <Button variant="secondary" onClick={handleBack}>Back</Button>
        <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Your Meal</h1>
            <HelpButton
            title="Building Your Meal"
            content={
                <>
                <p>This page lets you build your meal by adding food items and organizing them into groups.</p>
                <p>You can:</p>
                <ul className="list-disc list-inside ml-4">
                    <li>Click <strong>Add Food</strong> to add ingredients from the USDA or custom entries</li>
                    <li>Use <strong>+ Add Group</strong> to create cooked ingredient groups (e.g. Stir Fry, Rice Batch)</li>
                    <li>Assign foods to groups using drag-and-drop</li>
                    <li>Edit people with calorie targets using <strong>Edit People</strong></li>
                </ul>
                </>
            }
            />
        </div>
        <Button onClick={nextStep}>Save & Continue</Button>
        </div>

      {/* modal to add food from USDA or custom input */}
      <Dialog open={addFoodOpen} onOpenChange={setAddFoodOpen}>
        <DialogContent className="lg:max-w-screen-lg max-h-screen overflow-y-auto">
          <AddFood onClose={() => setAddFoodOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* modal to add person info for meal prep plan */}
      <Dialog open={peopleOpen} onOpenChange={setPeopleOpen}>
        <DialogContent className="lg:max-w-screen-lg max-h-screen overflow-y-auto">
          <PeoplePanel />
        </DialogContent>
      </Dialog>

      {/* confirmation dialog for leaving step if people are already set */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Meal Setup?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You’ve already entered people. Going back will clear this setup. Are you sure?
          </p>
          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmBack}>Yes, Go Back</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* action buttons to add people, add food items, or add groups to the meal plan */}
      <div>
        <Button onClick={() => setPeopleOpen(true)}>Edit People</Button>
        <Button onClick={() => setAddFoodOpen(true)}>+ Add Food</Button>
        <Button onClick={() => addGroup(`Group ${groups.length + 1}`)}>+ Add Group</Button>
      </div>

      {/* main layout for assigning food items to groups */}
      <MealDragAssign />

    </div>
  );
};

export default BuildMeal;