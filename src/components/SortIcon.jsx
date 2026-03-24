import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function SortIcon({ column }) {
  const sorted = column.getIsSorted();
  if (!sorted) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />;
  if (sorted === 'asc') return <ArrowUp className="w-3.5 h-3.5 text-violet-600" />;
  return <ArrowDown className="w-3.5 h-3.5 text-violet-600" />;
}
