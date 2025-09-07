import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Heart, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import StarRating from "./ui/star-rating";

interface AddMemoryModalProps {
  partnershipId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMemoryModal({ partnershipId, onClose, onSuccess }: AddMemoryModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [dateOfMemory, setDateOfMemory] = useState("");
  const [location, setLocation] = useState("");
  const [foodRating, setFoodRating] = useState(0);
  const [placeRating, setPlaceRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [photos, setPhotos] = useState<{ url: string; caption: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const createMemoryMutation = useMutation({
    mutationFn: async (memoryData: any) => {
      await apiRequest("POST", "/api/memories", memoryData);
    },
    onSuccess: () => {
      toast({
        title: "Memory Created",
        description: "Your memory has been submitted for approval!",
      });
      onSuccess();
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
        description: "Failed to create memory. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append("photos", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photos");
      }
      return response.json();
    },
    onSuccess: (data) => {
      const newPhotos = data.urls.map((url: string) => {
        const caption = "";
        return { url, caption };
      });

      setPhotos([...photos, ...newPhotos]);
      toast({
        title: "Photos Uploaded",
        description: `${data.urls.length} photo(s) have been successfully uploaded.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Error",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !dateOfMemory) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const memoryData = {
      partnershipId,
      title,
      description,
      detailedDescription: detailedDescription || description,
      dateOfMemory: new Date(dateOfMemory).toISOString(),
      location: location || undefined,
      foodRating: foodRating || undefined,
      placeRating: placeRating || undefined,
      overallRating: overallRating || undefined,
      photos: photos.length > 0 ? photos : undefined,
    };

    createMemoryMutation.mutate(memoryData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      uploadPhotoMutation.mutate(filesArray);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-off-white rounded-3xl">
        <DialogHeader className="sticky top-0 bg-off-white border-b border-rose-primary/20 pb-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="font-romantic text-3xl text-chocolate handwriting-style">
              Add New Memory
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

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="font-sans text-chocolate font-semibold">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your memory a beautiful title..."
              className="bg-cream-bg/50 border-rose-primary/30 focus:ring-rose-primary/50 font-sans"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="font-sans text-chocolate font-semibold">
              Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={dateOfMemory}
              onChange={(e) => setDateOfMemory(e.target.value)}
              className="bg-cream-bg/50 border-rose-primary/30 focus:ring-rose-primary/50 font-sans"
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="font-sans text-chocolate font-semibold">
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where did this memory take place?"
              className="bg-cream-bg/50 border-rose-primary/30 focus:ring-rose-primary/50 font-sans"
            />
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-sans text-chocolate font-semibold">
              Short Description *
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief summary of this memory..."
              className="bg-cream-bg/50 border-rose-primary/30 focus:ring-rose-primary/50 font-sans resize-none"
              rows={3}
              required
            />
          </div>

          {/* Detailed Description */}
          <div className="space-y-2">
            <Label htmlFor="detailedDescription" className="font-sans text-chocolate font-semibold">
              Detailed Description
            </Label>
            <Textarea
              id="detailedDescription"
              value={detailedDescription}
              onChange={(e) => setDetailedDescription(e.target.value)}
              placeholder="Tell the full story of this beautiful memory..."
              className="bg-cream-bg/50 border-rose-primary/30 focus:ring-rose-primary/50 font-sans resize-none"
              rows={4}
            />
          </div>

          {/* Ratings */}
          <div className="space-y-4">
            <h3 className="font-romantic text-lg text-chocolate handwriting-style">Rate Your Experience</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-sans text-chocolate text-sm">Food</Label>
                <StarRating
                  rating={foodRating}
                  onRatingChange={setFoodRating}
                  size="md"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-sans text-chocolate text-sm">Place</Label>
                <StarRating
                  rating={placeRating}
                  onRatingChange={setPlaceRating}
                  size="md"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-sans text-chocolate text-sm">Overall</Label>
                <StarRating
                  rating={overallRating}
                  onRatingChange={setOverallRating}
                  size="md"
                />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="font-sans text-chocolate font-semibold">Photos</Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                multiple
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPhotoMutation.isPending}
                className="border-rose-primary/30 text-chocolate hover:bg-rose-primary/10"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadPhotoMutation.isPending ? "Uploading..." : "Upload Photos"}
              </Button>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-24 object-cover rounded-lg polaroid-shadow"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-rose-primary/30 text-chocolate hover:bg-rose-primary/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMemoryMutation.isPending}
              className="bg-rose-primary hover:bg-rose-primary/80 text-chocolate font-sans font-semibold rounded-full px-8"
            >
              <Heart className="mr-2 w-4 h-4" />
              {createMemoryMutation.isPending ? "Creating..." : "Create Memory"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
