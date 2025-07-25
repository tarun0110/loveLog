import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPartnershipSchema, insertMemorySchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Partnership routes
  app.post('/api/partnerships', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { partnerEmail } = req.body;

      if (!partnerEmail) {
        return res.status(400).json({ message: "Partner email is required" });
      }

      // Find partner by email
      const partner = await storage.getUserByEmail(partnerEmail);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }

      // Check if partnership already exists
      const existingPartnership = await storage.getPartnership(userId, partner.id);
      if (existingPartnership) {
        return res.status(400).json({ message: "Partnership already exists" });
      }

      const partnershipData = insertPartnershipSchema.parse({
        user1Id: userId,
        user2Id: partner.id,
        status: "pending"
      });

      const partnership = await storage.createPartnership(partnershipData);
      res.status(201).json(partnership);
    } catch (error) {
      console.error("Error creating partnership:", error);
      res.status(500).json({ message: "Failed to create partnership" });
    }
  });

  app.get('/api/partnerships/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const partnership = await storage.getActivePartnership(userId);
      res.json(partnership);
    } catch (error) {
      console.error("Error fetching active partnership:", error);
      res.status(500).json({ message: "Failed to fetch partnership" });
    }
  });

  app.get('/api/partnerships/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invitations = await storage.getPendingInvitations(userId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.patch('/api/partnerships/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Get the partnership to verify user can accept it
      const invitations = await storage.getPendingInvitations(userId);
      const invitation = invitations.find(inv => inv.id === id);
      
      if (!invitation) {
        return res.status(403).json({ message: "Invitation not found or unauthorized" });
      }

      const updatedPartnership = await storage.updatePartnershipStatus(id, "active");
      res.json(updatedPartnership);
    } catch (error) {
      console.error("Error accepting partnership:", error);
      res.status(500).json({ message: "Failed to accept partnership" });
    }
  });

  app.patch('/api/partnerships/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Get the partnership to verify user can reject it
      const invitations = await storage.getPendingInvitations(userId);
      const invitation = invitations.find(inv => inv.id === id);
      
      if (!invitation) {
        return res.status(403).json({ message: "Invitation not found or unauthorized" });
      }

      const updatedPartnership = await storage.updatePartnershipStatus(id, "rejected");
      res.json(updatedPartnership);
    } catch (error) {
      console.error("Error rejecting partnership:", error);
      res.status(500).json({ message: "Failed to reject partnership" });
    }
  });

  // Memory routes
  app.get('/api/memories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit = 10, offset = 0, search, location, rating, dateFrom, dateTo } = req.query;

      const partnership = await storage.getActivePartnership(userId);
      if (!partnership) {
        return res.status(404).json({ message: "No active partnership found" });
      }

      let memories;
      
      if (search) {
        memories = await storage.searchMemories(partnership.id, search as string);
      } else if (location || rating || dateFrom || dateTo) {
        const filters: any = {};
        if (location) filters.location = location;
        if (rating) filters.rating = parseInt(rating as string);
        if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
        if (dateTo) filters.dateTo = new Date(dateTo as string);
        
        memories = await storage.filterMemories(partnership.id, filters);
      } else {
        memories = await storage.getMemoriesForPartnership(
          partnership.id,
          parseInt(limit as string),
          parseInt(offset as string)
        );
      }

      res.json(memories);
    } catch (error) {
      console.error("Error fetching memories:", error);
      res.status(500).json({ message: "Failed to fetch memories" });
    }
  });

  app.post('/api/memories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const partnership = await storage.getActivePartnership(userId);
      if (!partnership) {
        return res.status(404).json({ message: "No active partnership found" });
      }

      const memoryData = insertMemorySchema.parse({
        ...req.body,
        partnershipId: partnership.id,
        createdById: userId,
        status: "pending"
      });

      const memory = await storage.createMemory(memoryData);
      res.status(201).json(memory);
    } catch (error) {
      console.error("Error creating memory:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create memory" });
    }
  });

  app.get('/api/memories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const memory = await storage.getMemoryById(id);
      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }

      // Verify user has access to this memory
      const partnership = await storage.getActivePartnership(userId);
      if (!partnership || memory.partnershipId !== partnership.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.json(memory);
    } catch (error) {
      console.error("Error fetching memory:", error);
      res.status(500).json({ message: "Failed to fetch memory" });
    }
  });

  app.patch('/api/memories/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const memory = await storage.getMemoryById(id);
      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }

      // Verify user can approve (is the partner, not the creator)
      if (memory.createdById === userId) {
        return res.status(400).json({ message: "Cannot approve your own memory" });
      }

      const partnership = await storage.getActivePartnership(userId);
      if (!partnership || memory.partnershipId !== partnership.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updatedMemory = await storage.updateMemoryStatus(id, "approved", userId);
      res.json(updatedMemory);
    } catch (error) {
      console.error("Error approving memory:", error);
      res.status(500).json({ message: "Failed to approve memory" });
    }
  });

  app.patch('/api/memories/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const memory = await storage.getMemoryById(id);
      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }

      // Verify user can reject (is the partner, not the creator)
      if (memory.createdById === userId) {
        return res.status(400).json({ message: "Cannot reject your own memory" });
      }

      const partnership = await storage.getActivePartnership(userId);
      if (!partnership || memory.partnershipId !== partnership.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updatedMemory = await storage.updateMemoryStatus(id, "rejected");
      res.json(updatedMemory);
    } catch (error) {
      console.error("Error rejecting memory:", error);
      res.status(500).json({ message: "Failed to reject memory" });
    }
  });

  // Comment routes
  app.post('/api/memories/:memoryId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { memoryId } = req.params;

      const memory = await storage.getMemoryById(memoryId);
      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }

      // Verify user has access to this memory
      const partnership = await storage.getActivePartnership(userId);
      if (!partnership || memory.partnershipId !== partnership.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const commentData = insertCommentSchema.parse({
        memoryId,
        userId,
        content: req.body.content
      });

      const comment = await storage.addComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Photo upload route (placeholder - would integrate with file upload service)
  app.post('/api/upload', isAuthenticated, async (req: any, res) => {
    try {
      // In a real implementation, this would handle file uploads
      // For now, return mock URLs
      const { files } = req.body;
      
      const uploadedFiles = files.map((file: any, index: number) => ({
        url: `https://api.placeholder.com/600x400/F8BBD9/3E2723?text=Photo${index + 1}`,
        caption: file.caption || '',
      }));

      res.json({ files: uploadedFiles });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
