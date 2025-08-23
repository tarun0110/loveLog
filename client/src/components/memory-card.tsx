import { Button } from "@/components/ui/button";
import { Check, X, ExpandIcon, MapPin, Clock } from "lucide-react";
import PhotoGallery from "./ui/photo-gallery";
import StarRating from "./ui/star-rating";
import type { MemoryWithDetails } from "@shared/schema";

interface MemoryCardProps {
  memory: MemoryWithDetails;
  currentUserId: string;
  onExpand: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isPending?: boolean;
}

export default function MemoryCard({ 
  memory, 
  currentUserId, 
  onExpand, 
  onApprove, 
  onReject,
  isPending = false 
}: MemoryCardProps) {
  const isPendingMemory = memory.status === 'pending';
  const canApprove = isPendingMemory && memory.createdById !== currentUserId;
  
  return (
    <div className="memory-card drawing-decoration bg-off-white rounded-3xl p-4 sm:p-6 polaroid-shadow relative">
      {/* Approval Badge */}
      {isPendingMemory && (
        <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-yellow-400 text-white rounded-full p-1 sm:p-2 text-xs font-sans font-semibold shadow-lg">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />
          <span className="hidden sm:inline">Pending</span>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Photo Gallery */}
        <div className="lg:w-1/2">
          <PhotoGallery photos={memory.photos} />
        </div>
        
        {/* Memory Details */}
        <div className="lg:w-1/2 space-y-3 sm:space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-romantic text-xl sm:text-2xl text-chocolate mb-2 handwriting-style break-words">
                {memory.title}
              </h3>
              <p className="text-brown-warm/80 font-sans text-xs sm:text-sm">
                {new Date(memory.dateOfMemory).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onExpand}
              className="text-brown-warm/60 hover:text-rose-primary p-2 flex-shrink-0"
            >
              <ExpandIcon className="w-4 h-4 sm:text-lg" />
            </Button>
          </div>
          
          <p className="text-chocolate font-sans leading-relaxed text-sm sm:text-base">
            {memory.description}
          </p>
          
          {/* Ratings */}
          <div className="space-y-1 sm:space-y-2">
            {memory.foodRating && (
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs sm:text-sm text-brown-warm">Food</span>
                <StarRating rating={memory.foodRating} readonly />
              </div>
            )}
            {memory.placeRating && (
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs sm:text-sm text-brown-warm">Place</span>
                <StarRating rating={memory.placeRating} readonly />
              </div>
            )}
            {memory.overallRating && (
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs sm:text-sm text-brown-warm">Overall</span>
                <StarRating rating={memory.overallRating} readonly />
              </div>
            )}
          </div>
          
          {/* Location */}
          {memory.location && (
            <div className="flex items-center text-brown-warm/80 font-sans text-xs sm:text-sm">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{memory.location}</span>
            </div>
          )}
          
          {/* Added by */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-rose-primary/20 gap-3">
            <div className="flex items-center">
              <span className="font-sans text-xs text-brown-warm/60">Added by</span>
              {memory.createdBy.profileImageUrl && (
                <img 
                  src={memory.createdBy.profileImageUrl} 
                  alt="Added by" 
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover ml-2 flex-shrink-0"
                />
              )}
              <span className="font-sans text-xs text-brown-warm/80 ml-2 truncate">
                {memory.createdBy.firstName || 'Partner'}
              </span>
            </div>
            
            {canApprove && onApprove && onReject ? (
              <div className="flex space-x-2 self-start sm:self-auto">
                <Button
                  size="sm"
                  onClick={onApprove}
                  disabled={isPending}
                  className="bg-green-600 hover:bg-green-700 text-white p-2"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onReject}
                  disabled={isPending}
                  className="p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : memory.status === 'approved' ? (
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <Check className="w-4 h-4 text-rose-primary" />
                <span className="font-sans text-xs text-brown-warm/60">Approved</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
