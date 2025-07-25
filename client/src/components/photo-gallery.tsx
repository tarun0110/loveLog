import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Photo } from "@shared/schema";

interface PhotoGalleryProps {
  photos: Photo[];
  className?: string;
}

export default function PhotoGallery({ photos, className = "" }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos.length) {
    return (
      <div className={`flex items-center justify-center h-48 bg-cream-bg/50 rounded-xl ${className}`}>
        <p className="text-brown-warm/50 font-sans">No photos</p>
      </div>
    );
  }

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative overflow-hidden rounded-xl">
        <img 
          src={photos[currentIndex].url} 
          alt={photos[currentIndex].caption || `Photo ${currentIndex + 1}`}
          className="w-full h-48 object-cover polaroid-shadow"
        />
        
        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
      
      {photos.length > 1 && (
        <div className="flex justify-center mt-2">
          <div className="flex space-x-2">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-rose-primary' : 'bg-rose-primary/30'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
