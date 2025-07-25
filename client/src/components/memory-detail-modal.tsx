import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Heart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import PhotoGallery from "./photo-gallery";
import StarRating from "./star-rating";
import type { MemoryWithDetails } from "@shared/schema";

interface MemoryDetailModalProps {
  memory: MemoryWithDetails;
  currentUserId: string;
  onClose: () => void;
}

export default function MemoryDetailModal({
  memory,
  currentUserId,
  onClose
}: MemoryDetailModalProps) {
  const [commentText, setCommentText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/memories/${memory.id}/comments`, { content });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      toast({
        title: "Comment Added",
        description: "Your comment has been added to this memory!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-off-white rounded-3xl">
        <DialogHeader className="sticky top-0 bg-off-white border-b border-rose-primary/20 pb-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="font-romantic text-3xl text-chocolate handwriting-style">
              {memory.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-brown-warm/60 hover:text-rose-primary"
            >
              <X className="text-xl" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Date and Location */}
          <div className="text-center">
            <p className="text-brown-warm/80 font-sans text-lg mb-2">
              {new Date(memory.dateOfMemory).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            {memory.location && (
              <p className="text-brown-warm/60 font-sans text-sm">{memory.location}</p>
            )}
          </div>

          {/* Photo Gallery */}
          {memory.photos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memory.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt={photo.caption || 'Memory photo'}
                  className="rounded-xl polaroid-shadow w-full h-48 object-cover"
                />
              ))}
            </div>
          )}
          
          {/* Description */}
          <div className="bg-cream-bg/50 rounded-2xl p-6">
            <h3 className="font-romantic text-xl text-chocolate mb-3 handwriting-style">
              The Full Story
            </h3>
            <p className="text-chocolate font-sans leading-relaxed">
              {memory.detailedDescription || memory.description}
            </p>
          </div>

          {/* Ratings */}
          {(memory.foodRating || memory.placeRating || memory.overallRating) && (
            <div className="bg-cream-bg/50 rounded-2xl p-6">
              <h3 className="font-romantic text-xl text-chocolate mb-4 handwriting-style">
                Our Ratings
              </h3>
              <div className="space-y-3">
                {memory.foodRating && (
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-chocolate">Food</span>
                    <StarRating rating={memory.foodRating} readonly size="md" />
                  </div>
                )}
                {memory.placeRating && (
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-chocolate">Place</span>
                    <StarRating rating={memory.placeRating} readonly size="md" />
                  </div>
                )}
                {memory.overallRating && (
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-chocolate">Overall</span>
                    <StarRating rating={memory.overallRating} readonly size="md" />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Comments Section */}
          <div className="bg-cream-bg/50 rounded-2xl p-6">
            <h3 className="font-romantic text-xl text-chocolate mb-4 handwriting-style">
              Our Thoughts
            </h3>
            
            {/* Existing Comments */}
            <div className="space-y-4 mb-6">
              {memory.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  {comment.user.profileImageUrl && (
                    <img 
                      src={comment.user.profileImageUrl} 
                      alt={comment.user.firstName || 'User'} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="bg-off-white rounded-2xl p-4">
                      <p className="font-sans text-sm text-chocolate">{comment.content}</p>
                    </div>
                    <p className="text-xs text-brown-warm/60 mt-1 font-sans">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add Comment */}
            <div className="space-y-3">
              <Textarea
                placeholder="Add your thoughts about this memory..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="bg-off-white border-rose-primary/30 focus:ring-rose-primary/50 font-sans text-sm resize-none"
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  className="bg-rose-primary hover:bg-rose-primary/80 text-chocolate font-sans text-sm rounded-full px-6"
                >
                  <Heart className="mr-1 w-4 h-4" />
                  Add Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
