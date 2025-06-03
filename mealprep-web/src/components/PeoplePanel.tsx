// panel to view, edit, and add people to the meal plan
// each person includes name, target calories per meal, and number of meals
// supports renaming and updating existing values

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePeopleStore } from "@/stores/peopleStore";
import { Trash2, Pencil } from "lucide-react";

export default function PeoplePanel() {
  const people = usePeopleStore((s) => s.people);
  const addPerson = usePeopleStore((s) => s.addPerson);
  const removePerson = usePeopleStore((s) => s.removePerson);
  const updateCalories = usePeopleStore((s) => s.updateCalories);
  const renamePerson = usePeopleStore((s) => s.renamePerson);
  const updatePerson = usePeopleStore((s) => s.updatePerson);

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [meals, setMeals] = useState("6");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    const cal = parseInt(calories.trim(), 10);
    const numMeals = parseInt(meals.trim(), 10);

    if (!name.trim() || isNaN(cal) || cal <= 0 || isNaN(numMeals) || numMeals <= 0) {
      alert("Enter a valid name, calorie target, and meals.");
      return;
    }

    addPerson({
      id: Date.now().toString(),
      name: name.trim(),
      targetCalories: cal,
      meals: numMeals,
    });

    setName("");
    setCalories("");
    setMeals("6");
  };

  return (
    <div className="space-y-6 p-4 border rounded">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">People</h2>

        {people.length === 0 && (
          <p className="text-muted-foreground">No people added yet.</p>
        )}

        <div className="space-y-4">
          {people.map((person) => (
            <div key={person.id} className="flex flex-wrap items-center gap-4">
              {editingId === person.id ? (
                <>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-32"
                  />
                  <Label>Meals</Label>
                  <Input
                    type="number"
                    className="w-20"
                    value={person.meals}
                    onChange={(e) =>
                      updatePerson(person.id, {
                        meals: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      renamePerson(person.id, newName);
                      setEditingId(null);
                    }}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <p className="w-32 font-medium">{person.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {person.meals} meals
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(person.id);
                      setNewName(person.name);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </>
              )}

              <Input
                type="number"
                className="w-24"
                value={person.targetCalories}
                onChange={(e) =>
                  updateCalories(person.id, parseInt(e.target.value) || 0)
                }
              />
              <span className="text-muted-foreground">kcal</span>

              <Button
                variant="destructive"
                size="icon"
                onClick={() => removePerson(person.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <h3 className="font-semibold text-sm">Add New Person</h3>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-40"
          />
          <Input
            placeholder="Calories"
            value={calories}
            type="number"
            onChange={(e) => setCalories(e.target.value)}
            className="w-32"
          />
          <Input
            placeholder="Meals"
            value={meals}
            type="number"
            onChange={(e) => setMeals(e.target.value)}
            className="w-24"
          />
          <Button onClick={handleAdd}>Add</Button>
        </div>
      </div>
    </div>
  );
}
