import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Heart, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface InvitePartnerModalProps {
  onClose: () => void;
}

export default function InvitePartnerModal({ onClose }: InvitePartnerModalProps) {
  const [partnerEmail, setPartnerEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invitePartnerMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("POST", "/api/partnerships", { partnerEmail: email });
    },
    onSuccess: () => {
      toast({
        title: "Partner Invited!",
        description: "Your partner has been invited to join your timeline. They'll need to accept the invitation.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/partnerships/active"] });
      onClose();
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
        title: "Invitation Failed",
        description: "Failed to invite partner. Please check the email address and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!partnerEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your partner's email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(partnerEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    invitePartnerMutation.mutate(partnerEmail);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-off-white rounded-3xl">
        <DialogHeader className="border-b border-rose-primary/20 pb-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="font-romantic text-3xl text-chocolate handwriting-style">
              Invite Your Partner
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

        <div className="pt-4">
          <div className="text-center mb-6">
            <Heart className="w-16 h-16 text-rose-primary mx-auto mb-4" />
            <p className="font-sans text-brown-warm/80 text-sm">
              Send an invitation to your partner to start creating beautiful memories together.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partnerEmail" className="font-sans text-chocolate font-semibold">
                Partner's Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown-warm/50 w-4 h-4" />
                <Input
                  id="partnerEmail"
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="your.partner@example.com"
                  className="pl-10 bg-cream-bg/50 border-rose-primary/30 focus:ring-rose-primary/50 font-sans"
                  required
                />
              </div>
            </div>

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
                disabled={invitePartnerMutation.isPending}
                className="bg-rose-primary hover:bg-rose-primary/80 text-chocolate font-sans font-semibold rounded-full px-8"
              >
                <Heart className="mr-2 w-4 h-4" />
                {invitePartnerMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}