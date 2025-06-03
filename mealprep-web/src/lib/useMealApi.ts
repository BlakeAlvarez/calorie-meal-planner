// api utility functions to fetch meals from backend

import type { Meal } from "@/types/meal";

const API_BASE = import.meta.env.VITE_API_BASE

// get specific meal by ID
export async function getMeal(id: number) {
  const res = await fetch(`${API_BASE}/api/meals/${id}`);
  if (!res.ok) throw new Error("Meal not found");
  return await res.json();
}

// gets all saved meals from backend (used for saved meals page list/search)
export async function getAllMeals(): Promise<Meal[]> {
  const res = await fetch(`${API_BASE}/api/meals`);
  return await res.json();
}