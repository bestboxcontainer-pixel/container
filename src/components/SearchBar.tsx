"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

/**
 * Barre de recherche de l'en-tête.
 *
 * Un vrai formulaire, et non un champ relié à un gestionnaire de clic : la
 * touche Entrée doit suffire, c'est ainsi que l'on cherche. Le bouton n'est
 * qu'un second chemin vers la même soumission.
 */
export function SearchBar({
  placeholder,
  label,
  defaultValue = "",
}: {
  placeholder: string;
  label: string;
  defaultValue?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const terme = value.trim();
        // Une recherche vide renverrait une page de résultats sans question.
        if (terme.length < 2) return;
        router.push(`/suche?q=${encodeURIComponent(terme)}`);
      }}
      className="flex h-10 items-stretch overflow-hidden rounded-sm"
    >
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="w-full flex-1 border-0 bg-white px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        aria-label={label}
        className="flex items-center justify-center bg-primary px-4 text-primary-foreground hover:brightness-110"
      >
        <Search className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
