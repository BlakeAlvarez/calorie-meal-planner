// utility function to merge classnames with tailwind-merge and clsx
// avoids duplicate class conflicts and keeps tailwind classes clean

import {clsx, type ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
