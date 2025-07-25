import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, History, Star, MapPin } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-cream-bg scrapbook-texture">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Heart className="text-rose-primary text-4xl" />
            <h1 className="font-romantic text-5xl md:text-6xl text-chocolate font-bold">LoveTimeline</h1>
          </div>
          <p className="font-sans text-xl text-brown-warm/80 max-w-2xl mx-auto mb-8">
            Document and cherish your journey together with beautiful memories, photos, and moments that matter.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-rose-primary hover:bg-rose-primary/80 text-chocolate font-sans font-semibold px-8 py-4 text-lg rounded-full shadow-lg transform hover:scale-105 transition-all"
          >
            Start Your Love Story
            <Heart className="ml-2 w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-off-white/80 backdrop-blur-sm polaroid-shadow transform rotate-1 hover:rotate-0 transition-transform duration-300">
            <CardContent className="p-6 text-center">
              <History className="w-12 h-12 text-rose-primary mx-auto mb-4" />
              <h3 className="font-romantic text-xl text-chocolate mb-2">History View</h3>
              <p className="font-sans text-brown-warm/80 text-sm">
                See all your beautiful dates in chronological order with stunning visuals.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-off-white/80 backdrop-blur-sm polaroid-shadow transform -rotate-1 hover:rotate-0 transition-transform duration-300">
            <CardContent className="p-6 text-center">
              <Star className="w-12 h-12 text-rose-primary mx-auto mb-4" />
              <h3 className="font-romantic text-xl text-chocolate mb-2">Rate & Review</h3>
              <p className="font-sans text-brown-warm/80 text-sm">
                Rate food, places, and overall experiences to remember the best spots.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-off-white/80 backdrop-blur-sm polaroid-shadow transform rotate-1 hover:rotate-0 transition-transform duration-300">
            <CardContent className="p-6 text-center">
              <MapPin className="w-12 h-12 text-rose-primary mx-auto mb-4" />
              <h3 className="font-romantic text-xl text-chocolate mb-2">Interactive Map</h3>
              <p className="font-sans text-brown-warm/80 text-sm">
                View all your visited places on a beautiful interactive map.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="font-romantic text-3xl text-chocolate mb-6">Ready to Begin?</h2>
          <p className="font-sans text-brown-warm/80 mb-8">
            Create your collaborative timeline and start capturing precious moments together.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            variant="outline"
            className="border-rose-primary text-chocolate hover:bg-rose-primary/10 font-sans px-6 py-3 rounded-full"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
