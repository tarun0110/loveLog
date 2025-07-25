import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false,
  size = "sm" 
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRatingChange?.(star)}
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? 'text-yellow-500 fill-current' 
                : 'text-yellow-500/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
