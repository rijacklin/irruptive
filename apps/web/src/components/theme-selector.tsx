import {
  ComputerIcon,
  Moon02Icon,
  Sun02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { useTheme, type Theme } from "@/components/theme-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const themes = [
  { value: "system", label: "System", icon: ComputerIcon },
  { value: "light", label: "Light", icon: Sun02Icon },
  { value: "dark", label: "Dark", icon: Moon02Icon },
] as const;

function isTheme(value: string | null): value is Theme {
  return themes.some((theme) => theme.value === value);
}

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const selectedTheme = themes.find((option) => option.value === theme)!;

  return (
    <Select
      value={theme}
      onValueChange={(value) => {
        if (isTheme(value)) {
          setTheme(value);
        }
      }}
    >
      <SelectTrigger aria-label="Color theme">
        <SelectValue>
          <HugeiconsIcon icon={selectedTheme.icon} strokeWidth={2} />
          <span className="hidden sm:inline">{selectedTheme.label}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {themes.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <HugeiconsIcon icon={option.icon} strokeWidth={2} />
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
