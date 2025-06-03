// help guide modal, might be removed most likely

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function HelpGuideModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">How It Works</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>How to Use the App</DialogTitle>
          <DialogDescription>Precise steps for calorie-accurate meal prep</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-1">1. Add Foods</h3>
            <p>Search USDA or add custom ingredients. Use raw weights whenever possible.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">2. Group Ingredients</h3>
            <p>Assign foods to logical cooked groups (e.g., “Fried Rice”, “Chicken Stir Fry”). Each group gets a cooked weight later.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">3. Plan Calories</h3>
            <ul className="list-disc ml-5">
              <li><strong>Grams</strong>: Use if you already know how much raw weight to use</li>
              <li><strong>Kcal</strong>: Enter target calories for that item</li>
              <li><strong>%</strong>: Auto-divides total target calories proportionally</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-1">4. Weigh Cooked Food</h3>
            <p>After cooking each group, weigh the total cooked weight and enter it. This ensures calories are scaled properly.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">5. Distribute Meals</h3>
            <p>Portions are calculated per person based on their calorie goals and number of meals.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Tips for Accurate Weighing</h3>
            <ul className="list-disc ml-5">
              <li>Weigh ingredients raw if possible</li>
              <li>Use a digital food scale (grams preferred)</li>
              <li>Weigh cooked meals as a full batch before dividing</li>
              <li>Use containers with labels or colors to identify who gets what</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
