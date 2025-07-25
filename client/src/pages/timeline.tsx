import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Search, MapPin, Calendar, Star, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import MemoryCard from "@/components/memory-card";
import MemoryDetailModal from "@/components/memory-detail-modal";
import AddMemoryModal from "@/components/add-memory-modal";
import SearchFilters from "@/components/search-filters";
import type { MemoryWithDetails } from "@shared/schema";

export default function Timeline() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMemory, setSelectedMemory] = useState<MemoryWithDetails | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    location?: string;
    rating?: number;
    dateFrom?: string;
    dateTo?: string;
  }>({});

  // Build query params
  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.set('search', searchQuery);
  if (filters.location) queryParams.set('location', filters.location);
  if (filters.rating) queryParams.set('rating', filters.rating.toString());
  if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) queryParams.set('dateTo', filters.dateTo);

  const { data: memories = [], isLoading: memoriesLoading, error } = useQuery<MemoryWithDetails[]>({
    queryKey: ["/api/memories", queryParams.toString()],
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: async (memoryId: string) => {
      await apiRequest("PATCH", `/api/memories/${memoryId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      toast({
        title: "Memory Approved",
        description: "The memory has been added to your timeline!",
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
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      toast({
        title: "Memory Rejected",
        description: "The memory has been removed from the timeline.",
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
        description: "Failed to reject memory. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
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
  }, [user, authLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
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
      {/* Navigation */}
      <nav className="bg-off-white/95 backdrop-blur-sm shadow-sm border-b border-rose-primary/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Heart className="text-rose-primary text-2xl" />
              <h1 className="font-romantic text-2xl text-chocolate font-bold">LoveTimeline</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-chocolate hover:text-rose-primary">
                <Search className="text-lg" />
              </Button>
              <Button variant="ghost" size="sm" className="text-chocolate hover:text-rose-primary">
                <MapPin className="text-lg" />
              </Button>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Timeline Header */}
        <div className="text-center mb-12">
          <h2 className="font-romantic text-4xl md:text-5xl text-chocolate mb-4 handwriting-style">
            Our Love Story
          </h2>
          <p className="font-sans text-brown-warm/80 text-lg mb-6">
            Cherishing every moment of our beautiful journey together
          </p>
          
          {/* Timeline Stats */}
          <div className="flex justify-center space-x-8 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-chocolate">{totalDates}</div>
              <div className="text-sm text-brown-warm font-sans">Amazing Dates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chocolate">{totalPhotos}</div>
              <div className="text-sm text-brown-warm font-sans">Beautiful Photos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chocolate">∞</div>
              <div className="text-sm text-brown-warm font-sans">Love Forever</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <SearchFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Timeline Container */}
        <div className="space-y-12">
          {/* Pending memories for approval */}
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

          {/* Approved memories */}
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

        {/* Load More Button */}
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

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 bg-rose-primary hover:bg-rose-primary/80 text-chocolate w-16 h-16 rounded-full shadow-xl hover:scale-105 transition-all flex items-center justify-center"
      >
        <Plus className="text-xl" />
      </Button>

      {/* Modals */}
      {selectedMemory && (
        <MemoryDetailModal
          memory={selectedMemory}
          currentUserId={(user as any)?.id || ''}
          onClose={() => setSelectedMemory(null)}
        />
      )}

      {showAddModal && (
        <AddMemoryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
          }}
        />
      )}
    </div>
  );
}
