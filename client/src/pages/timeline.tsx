import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Search, Plus, LogOut, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import MemoryCard from "@/components/memory-card";
import MemoryDetailModal from "@/components/memory-detail-modal";
import AddMemoryModal from "@/components/add-memory-modal";
import SearchFilters from "@/components/search-filters";
import type { MemoryWithDetails } from "@shared/schema";

export default function Timeline() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams();
  const partnershipId = params.partnershipId ? params.partnershipId : "";
  console.log('partnershio id client ', partnershipId);
  const [selectedMemory, setSelectedMemory] = useState<MemoryWithDetails | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    location?: string;
    rating?: number;
    dateFrom?: string;
    dateTo?: string;
  }>({});

  // Build query params
  const queryParams = new URLSearchParams();
  if (partnershipId!="") queryParams.set('partnershipId', partnershipId);
  if (searchQuery) queryParams.set('search', searchQuery);
  if (filters.location) queryParams.set('location', filters.location);
  if (filters.rating) queryParams.set('rating', filters.rating.toString());
  if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) queryParams.set('dateTo', filters.dateTo);

  const { data: memories = [], isLoading: memoriesLoading, error } = useQuery<MemoryWithDetails[]>({
    queryKey: ["/api/memories", partnershipId, queryParams.toString()],
    queryFn: async () => {
      const url = `/api/memories?${queryParams.toString()}`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 404) {
          // Handle case where no memories are found for the partnership
          return [];
        }
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!partnershipId,
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: async (memoryId: string) => {
      await apiRequest("PATCH", `/api/memories/${memoryId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories", partnershipId] });
      toast({
        title: "Memory Approved",
        description: "The memory has been added to your timeline!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Please log in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to approve memory. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (memoryId: string) => {
      await apiRequest("PATCH", `/api/memories/${memoryId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories", partnershipId] });
      toast({
        title: "Memory Rejected",
        description: "The memory has been removed from the timeline.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Please log in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to reject memory. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to view a timeline.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [user, authLoading, toast]);

  useEffect(() => {
    if (error) {
      console.log('Error: ', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You do not have permission to view this timeline.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch memories. Please try again.",
          variant: "destructive",
        });
      }
      setTimeout(() => {
        window.location.href = "/";
      }, 50000);
    }
  }, [error, toast]);

  if (authLoading || memoriesLoading) {
    return (
      <div className="min-h-screen bg-cream-bg scrapbook-texture flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-rose-primary mx-auto mb-4 animate-pulse" />
          <p className="font-romantic text-xl text-chocolate">Loading your memories...</p>
        </div>
      </div>
    );
  }
  
  const approvedMemories = memories.filter((memory: MemoryWithDetails) => memory.status === 'approved');
  const pendingMemories = memories.filter((memory: MemoryWithDetails) => memory.status === 'pending');

  const totalDates = approvedMemories.length;
  const totalPhotos = approvedMemories.reduce((sum: number, memory: MemoryWithDetails) => sum + memory.photos.length, 0);

  return (
    <div className="min-h-screen bg-cream-bg scrapbook-texture">
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
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-chocolate hover:text-rose-primary p-2">
                  <User className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-chocolate hover:text-rose-primary p-2"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="w-4 h-4" />
              </Button>
              <div className="flex items-center space-x-2">
                {(user as any)?.profileImageUrl && (
                  <img 
                    src={(user as any).profileImageUrl} 
                    alt="Your profile" 
                    className="w-8 h-8 rounded-full object-cover border-2 border-rose-primary"
                  />
                )}
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-romantic text-2xl sm:text-4xl md:text-5xl text-chocolate mb-4 handwriting-style">
            Our Love Story
          </h2>
          <p className="font-sans text-brown-warm/80 text-base sm:text-lg mb-6 px-4">
            Cherishing every moment of our beautiful journey together
          </p>
          <div className="grid grid-cols-3 gap-4 sm:flex sm:justify-center sm:space-x-8 mb-8">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-chocolate">{totalDates}</div>
              <div className="text-xs sm:text-sm text-brown-warm font-sans">Amazing Dates</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-chocolate">{totalPhotos}</div>
              <div className="text-xs sm:text-sm text-brown-warm font-sans">Beautiful Photos</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-chocolate">∞</div>
              <div className="text-xs sm:text-sm text-brown-warm font-sans">Love Forever</div>
            </div>
          </div>
        </div>

        {showSearch && (
          <SearchFilters 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}

        <div className="space-y-12">
          {pendingMemories.map((memory: MemoryWithDetails) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              currentUserId={(user as any)?.id || ''}
              onExpand={() => setSelectedMemory(memory)}
              onApprove={() => approveMutation.mutate(memory.id)}
              onReject={() => rejectMutation.mutate(memory.id)}
              isPending={approveMutation.isPending || rejectMutation.isPending}
            />
          ))}

          {approvedMemories.map((memory: MemoryWithDetails) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              currentUserId={(user as any)?.id || ''}
              onExpand={() => setSelectedMemory(memory)}
            />
          ))}

          {memories.length === 0 && (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 text-rose-primary/50 mx-auto mb-4" />
              <h3 className="font-romantic text-2xl text-chocolate mb-2">No memories yet</h3>
              <p className="font-sans text-brown-warm/80 mb-6">
                Start creating beautiful memories together!
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-rose-primary hover:bg-rose-primary/80 text-chocolate font-sans font-semibold px-6 py-3 rounded-full"
              >
                <Plus className="mr-2 w-4 h-4" />
                Add Your First Memory
              </Button>
            </div>
          )}
        </div>

        {memories.length > 0 && (
          <div className="text-center mt-12">
            <Button 
              variant="outline"
              className="border-rose-primary text-chocolate hover:bg-rose-primary/10 px-8 py-3 rounded-full font-sans font-semibold"
            >
              Load More Memories
              <Heart className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

      <Button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 bg-rose-primary hover:bg-rose-primary/80 text-chocolate w-16 h-16 rounded-full shadow-xl hover:scale-105 transition-all flex items-center justify-center"
      >
        <Plus className="text-xl" />
      </Button>

      {selectedMemory && (
        <MemoryDetailModal
          memory={selectedMemory}
          currentUserId={(user as any)?.id || ''}
          onClose={() => setSelectedMemory(null)}
        />
      )}

      {showAddModal && partnershipId && (
        <AddMemoryModal
          partnershipId={partnershipId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ["/api/memories", partnershipId] });
          }}
        />
      )}
    </div>
  );
}
