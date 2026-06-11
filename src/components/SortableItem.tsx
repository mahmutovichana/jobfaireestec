import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ReactNode } from "react";

interface SortableItemProps {
  id: string;
  children: ReactNode;
  as?: "tr" | "div";
  className?: string;
  handleClassName?: string;
}

export function SortableItem({ id, children, as = "div", className = "", handleClassName = "" }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    transition: {
      duration: 350,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    boxShadow: isDragging ? "0 20px 40px -10px hsl(var(--foreground) / 0.25)" : undefined,
    scale: isDragging ? "1.03" : "1",
    position: "relative",
    zIndex: isDragging ? 50 : "auto",
  };

  if (as === "tr") {
    return (
      <tr ref={setNodeRef} style={style} className={className}>
        <td className="w-8 px-2 align-middle">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className={`cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground ${handleClassName}`}
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        </td>
        {children}
      </tr>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={`absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-background/80 backdrop-blur-sm rounded-md p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity ${handleClassName}`}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      {children}
    </div>
  );
}