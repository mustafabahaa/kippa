import { useMemo, useState } from 'react';
import type { Category } from '@kippa/domain';
import { useAppContext } from '@/hooks/useAppContext';
import { useCategoryFrequency } from '@/hooks/useFinance';
import { CategoryChips, CategoryDialog } from '@/features/shared/components/CategoryPicker';

type Props = {
  categories: Category[];
  categoryId: string;
  mode: 'expense' | 'income';
  onChange: (id: string) => void;
};

/** Mirrors Fast Entry's category choice: frequent categories as chips on the
 * review dialog, with every category reachable through the search dialog. */
export function PendingCategoryPicker({ categories, categoryId, mode, onChange }: Props) {
  const { householdId } = useAppContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const frequencyScores = useCategoryFrequency(householdId, mode);

  const sortedCategories = useMemo(() => categories
    .map((category) => ({ ...category, score: frequencyScores[category.id] ?? 0 }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score; // score DESC
      return a.name.localeCompare(b.name); // name ASC tiebreak
    }), [categories, frequencyScores]);

  const selectedCategory = sortedCategories.find((category) => category.id === categoryId) ?? null;

  const frequentCategories = useMemo(() => {
    const used = sortedCategories.filter((category) => category.score > 0);
    return (used.length > 0 ? used : sortedCategories).slice(0, 8);
  }, [sortedCategories]);

  const displayedCategories = useMemo(() => {
    if (!selectedCategory || frequentCategories.some((category) => category.id === selectedCategory.id)) {
      return frequentCategories;
    }
    return [selectedCategory, ...frequentCategories.slice(0, 7)];
  }, [frequentCategories, selectedCategory]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return sortedCategories;
    return sortedCategories.filter((category) => category.name.toLocaleLowerCase().includes(query));
  }, [search, sortedCategories]);

  return (
    <>
      <CategoryChips
        categories={displayedCategories}
        mode={mode}
        onOpenAll={() => setDialogOpen(true)}
        onSelect={onChange}
        selectedCategoryId={categoryId || null}
        totalCount={sortedCategories.length}
      />
      <CategoryDialog
        categories={filteredCategories}
        open={dialogOpen}
        search={search}
        selectedCategoryId={categoryId || null}
        onSearchChange={setSearch}
        onSelect={(id) => {
          onChange(id);
          setDialogOpen(false);
          setSearch('');
        }}
        onClose={() => {
          setDialogOpen(false);
          setSearch('');
        }}
      />
    </>
  );
}
