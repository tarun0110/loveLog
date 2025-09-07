import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, Mail } from "lucide-react";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import { Heart, Search, MapPin, Calendar, Star, Plus, LogOut, Home, User } from "lucide-react";

interface PendingInvitation {
  id: string;
  user1Id: string;
  user2Id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  partner: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  // Fetch pending invitations
  const { data: invitations = [], isLoading: loadingInvitations } = useQuery<PendingInvitation[]>({
    queryKey: ["/api/partnerships/pending"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Accept invitation mutation
  const acceptMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await apiRequest("PATCH", `/api/partnerships/${invitationId}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation Accepted",
        description: "You are now partners! You can start creating memories together.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/partnerships/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partnerships/active"] });
    },
    onError: (error) => {
      console.log(error);
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
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject invitation mutation
  const rejectMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await apiRequest("PATCH", `/api/partnerships/${invitationId}/reject`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation Rejected",
        description: "The invitation has been declined.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/partnerships/pending"] });
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
        description: "Failed to reject invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream scrapbook-texture flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 text-rose-primary animate-pulse mx-auto mb-4" />
          <p className="text-chocolate font-sans">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Redirecting to login
  }

  return (
    <div className="min-h-screen bg-cream-bg scrapbook-texture">
      {/* Navigation */}
      <nav className="bg-off-white/95 backdrop-blur-sm shadow-sm border-b border-rose-primary/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Heart className="text-rose-primary text-xl sm:text-2xl" />
              <h1 className="font-romantic text-lg sm:text-2xl text-chocolate font-bold">LoveTimeline</h1>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-chocolate hover:text-rose-primary p-2">
                  <Home className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
      
              <div className="flex items-center space-x-2">
                {(user as any)?.profileImageUrl && (
                  <img 
                    src={(user as any).profileImageUrl} 
                    alt="Your profile" 
                    className="w-8 h-8 rounded-full object-cover border-2 border-rose-primary"
                  />
                )}
                {/* Partner would be shown here if available */}
              </div>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="font-romantic text-2xl sm:text-4xl text-chocolate mb-4 handwriting-style">
            Your Profile
          </h1>
          <p className="text-brown-warm/80 font-sans text-sm sm:text-base px-4">
            Manage your account and partnership invitations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Profile Information */}
          <Card className="bg-off-white rounded-3xl polaroid-shadow drawing-decoration">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-chocolate font-romantic text-xl sm:text-2xl">
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              
              {/* Profile Picture */}
              <div className="flex justify-center">
                {(user as any)?.profileImageUrl ? (
                  <img
                    src={(user as any).profileImageUrl}
                    alt="Profile"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-rose-primary polaroid-shadow"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-rose-primary/20 flex items-center justify-center border-4 border-rose-primary">
                    <User className="w-6 h-6 sm:w-8 sm:h-8 text-rose-primary" />
                  </div>
                )}
              </div>

              <Separator />

              {/* User Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-brown-warm/60" />
                  <div>
                    <p className="text-sm font-sans text-brown-warm/60">Email</p>
                    <p className="font-sans text-chocolate">{(user as any)?.email || "Not provided"}</p>
                  </div>
                </div>

                {((user as any)?.firstName || (user as any)?.lastName) && (
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-brown-warm/60" />
                    <div>
                      <p className="text-sm font-sans text-brown-warm/60">Name</p>
                      <p className="font-sans text-chocolate">
                        {[(user as any)?.firstName, (user as any)?.lastName].filter(Boolean).join(" ")}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-brown-warm/60" />
                  <div>
                    <p className="text-sm font-sans text-brown-warm/60">Member Since</p>
                    <p className="font-sans text-chocolate">
                      {(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString() : "Recently"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = "/api/logout"}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Partnership Invitations */}
          <Card className="bg-off-white rounded-3xl polaroid-shadow drawing-decoration">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-chocolate font-romantic text-xl sm:text-2xl">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Partnership Invitations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInvitations ? (
                <div className="text-center py-8">
                  <Heart className="w-8 h-8 text-rose-primary animate-pulse mx-auto mb-4" />
                  <p className="text-brown-warm/60 font-sans">Loading invitations...</p>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-rose-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-rose-primary/60" />
                  </div>
                  <p className="text-brown-warm/60 font-sans mb-2">No pending invitations</p>
                  <p className="text-sm text-brown-warm/40 font-sans">
                    When someone invites you to be their partner, it will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="border border-rose-primary/20 rounded-2xl p-3 sm:p-4 bg-cream/50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex items-center space-x-3">
                          {invitation.partner.profileImageUrl ? (
                            <img
                              src={invitation.partner.profileImageUrl}
                              alt="Partner"
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-rose-primary flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-primary/20 flex items-center justify-center border-2 border-rose-primary flex-shrink-0">
                              <User className="w-5 h-5 sm:w-6 sm:h-6 text-rose-primary" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-sans font-medium text-chocolate text-sm sm:text-base truncate">
                              {invitation.partner.firstName && invitation.partner.lastName
                                ? `${invitation.partner.firstName} ${invitation.partner.lastName}`
                                : invitation.partner.email}
                            </p>
                            <p className="text-xs sm:text-sm text-brown-warm/60 font-sans truncate">
                              {invitation.partner.email}
                            </p>
                            <p className="text-xs text-brown-warm/40 font-sans">
                              Invited {new Date(invitation.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs self-start sm:self-auto">
                          Pending
                        </Badge>
                      </div>

                      <p className="text-xs sm:text-sm text-brown-warm/80 font-sans mb-4">
                        {invitation.partner.firstName || "Someone"} wants to be your partner and start creating memories together!
                      </p>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptMutation.mutate(invitation.id)}
                          disabled={acceptMutation.isPending || rejectMutation.isPending}
                          className="flex-1 text-xs sm:text-sm"
                        >
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectMutation.mutate(invitation.id)}
                          disabled={acceptMutation.isPending || rejectMutation.isPending}
                          className="flex-1 text-xs sm:text-sm"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}