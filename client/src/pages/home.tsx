import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, History, Users, LogOut, User as UserIcon, UserX, Trash2, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import InvitePartnerModal from "@/components/invite-partner-modal";
import type { User } from "@shared/schema";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: partnership, isLoading: partnershipLoading } = useQuery<any>({
    queryKey: ["/api/partnerships/active"],
    retry: false,
  });

  const { data: allPartnerships = [], isLoading: allPartnershipsLoading } = useQuery<any[]>({
    queryKey: ["/api/partnerships"],
    retry: false,
  });

  // End partnership mutation
  const endPartnershipMutation = useMutation({
    mutationFn: async (partnershipId: string) => {
      await apiRequest("PATCH", `/api/partnerships/${partnershipId}/end`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partnerships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partnerships/active"] });
      toast({
        title: "Partnership Ended",
        description: "Your partnership has been ended successfully.",
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
        description: "Failed to end partnership. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete partnership mutation
  const deletePartnershipMutation = useMutation({
    mutationFn: async (partnershipId: string) => {
      await apiRequest("DELETE", `/api/partnerships/${partnershipId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partnerships"] });
      toast({
        title: "Partnership Deleted",
        description: "Partnership has been removed successfully.",
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
        description: "Failed to delete partnership. Please try again.",
        variant: "destructive",
      });
    },
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

  if (isLoading || partnershipLoading || allPartnershipsLoading) {
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

        <div className="space-y-8">
          {/* All Partnerships Section */}
          <Card className="bg-off-white/80 backdrop-blur-sm polaroid-shadow">
            <CardHeader>
              <CardTitle className="font-romantic text-2xl text-chocolate flex items-center">
                <Users className="mr-3 text-rose-primary" />
                Your Partnerships
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {allPartnerships?.length > 0 ? (
                allPartnerships.map((p: any) => (
                  <div key={p.id} className={`p-4 rounded-lg border-2 ${
                    p.status === 'active' ? 'border-green-300 bg-green-50' : 
                    p.status === 'ended' ? 'border-red-300 bg-red-50' : 
                    'border-yellow-300 bg-yellow-50'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        {p.partner?.profileImageUrl && (
                          <img 
                            src={p.partner.profileImageUrl} 
                            alt={`${p.partner.firstName || 'Partner'}'s profile`}
                            className="w-12 h-12 rounded-full object-cover border-2 border-rose-primary"
                          />
                        )}
                        <div>
                          <h3 className="font-sans font-semibold text-chocolate">
                            {p.partner?.firstName} {p.partner?.lastName}
                          </h3>
                          <p className="text-sm text-brown-warm/80">{p.partner?.email}</p>
                          <p className="text-xs text-brown-warm/60">
                            {p.status === 'active' ? 'Active Partnership' : 
                             p.status === 'ended' ? 'Ended Partnership' : 
                             'Pending Partnership'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        {p.status === 'active' && (
                          <>
                            <Link href="/timeline">
                              <Button size="sm" className="bg-rose-primary hover:bg-rose-primary/80 text-chocolate font-sans">
                                <History className="mr-1 w-4 h-4" />
                                View Timeline
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => endPartnershipMutation.mutate(p.id)}
                              disabled={endPartnershipMutation.isPending}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              <UserX className="mr-1 w-4 h-4" />
                              End Partnership
                            </Button>
                          </>
                        )}
                        {p.status === 'ended' && (
                          <div className="space-y-2">
                            <p className="text-xs text-red-600 font-medium">
                              Partnership Ended
                              {p.endedAt && (
                                <span className="block text-brown-warm/60">
                                  {new Date(p.endedAt).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deletePartnershipMutation.mutate(p.id)}
                              disabled={deletePartnershipMutation.isPending}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="mr-1 w-4 h-4" />
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    {p.status === 'ended' && (
                      <div className="mt-3 p-2 bg-yellow-100 rounded border-l-4 border-yellow-400">
                        <div className="flex items-center">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                          <p className="text-sm text-yellow-800">
                            No new memories can be added to ended partnerships
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-brown-warm/50 mx-auto mb-4" />
                  <p className="font-sans text-brown-warm mb-4">No partnerships yet</p>
                  <Button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-rose-primary hover:bg-rose-primary/80 text-chocolate font-sans font-semibold px-6 py-2 rounded-full"
                  >
                    <Users className="mr-2 w-4 h-4" />
                    Invite Your Partner
                  </Button>
                </div>
              )}
              
              {allPartnerships?.length > 0 && !allPartnerships.some(p => p.status === 'active') && (
                <div className="text-center pt-4 border-t border-rose-primary/20">
                  <Button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-rose-primary hover:bg-rose-primary/80 text-chocolate font-sans font-semibold px-6 py-2 rounded-full"
                  >
                    <Users className="mr-2 w-4 h-4" />
                    Start New Partnership
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {allPartnerships?.length === 0 && (
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
