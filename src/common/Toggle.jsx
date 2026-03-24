import { ToggleLeft, ToggleRight } from 'lucide-react';

export default function Toggle({ enabled, onToggle }) {
  return (
    <button onClick={onToggle} className="focus:outline-none">
      {enabled
        ? <ToggleRight className="w-9 h-9 text-violet-600" />
        : <ToggleLeft className="w-9 h-9 text-gray-300" />
      }
    </button>
  );
}
