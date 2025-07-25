import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, History, Users, LogOut, User as UserIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import InvitePartnerModal from "@/components/invite-partner-modal";
import type { User } from "@shared/schema";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: partnership, isLoading: partnershipLoading } = useQuery<any>({
    queryKey: ["/api/partnerships/active"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !user) {
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
  }, [user, isLoading, toast]);

  if (isLoading || partnershipLoading) {
    return (
      <div className="min-h-screen bg-cream-bg scrapbook-texture flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-rose-primary mx-auto mb-4 animate-pulse" />
          <p className="font-romantic text-xl text-chocolate">Loading your love story...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-bg scrapbook-texture">
      {/* Navigation */}
      <nav className="bg-off-white/95 backdrop-blur-sm shadow-sm border-b border-rose-primary/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Heart className="text-rose-primary text-2xl" />
              <h1 className="font-romantic text-2xl text-chocolate font-bold">LoveTimeline</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-chocolate hover:text-rose-primary">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <span className="font-sans text-chocolate">
                Welcome, {(user as any)?.firstName || 'Love'}!
              </span>
              {(user as any)?.profileImageUrl && (
                <img 
                  src={(user as any).profileImageUrl!} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover border-2 border-rose-primary"
                />
              )}
              <Button 
                onClick={() => window.location.href = '/api/logout'}
                variant="ghost"
                size="sm"
                className="text-chocolate hover:text-rose-primary"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="font-romantic text-4xl md:text-5xl text-chocolate mb-4 handwriting-style">
            Your Love Story Dashboard
          </h2>
          <p className="font-sans text-brown-warm/80 text-lg">
            Welcome to your shared timeline of beautiful memories
          </p>
        </div>

        {partnership ? (
          <div className="space-y-8">
            <Card className="bg-off-white/80 backdrop-blur-sm polaroid-shadow">
              <CardHeader>
                <CardTitle className="font-romantic text-2xl text-chocolate flex items-center">
                  <Users className="mr-3 text-rose-primary" />
                  Your Partnership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-sans text-brown-warm">
                  Status: <span className="text-chocolate font-semibold capitalize">{partnership.status}</span>
                </p>
                <div className="flex justify-center">
                  <Link href="/timeline">
                    <Button className="bg-rose-primary hover:bg-rose-primary/80 text-chocolate font-sans font-semibold px-8 py-3 rounded-full shadow-lg">
                      <History className="mr-2 w-5 h-5" />
                      View History
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-off-white/80 backdrop-blur-sm polaroid-shadow">
            <CardHeader>
              <CardTitle className="font-romantic text-2xl text-chocolate">
                Connect with Your Partner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-sans text-brown-warm">
                To start creating your love timeline, you need to connect with your partner.
              </p>
              <Button 
                onClick={() => setShowInviteModal(true)}
                className="bg-rose-primary hover:bg-rose-primary/80 text-chocolate font-sans font-semibold px-6 py-2 rounded-full"
              >
                <Heart className="mr-2 w-4 h-4" />
                Invite Partner
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Invite Partner Modal */}
      {showInviteModal && (
        <InvitePartnerModal onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );
}
