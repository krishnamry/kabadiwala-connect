import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/chat/:contextType/:contextId - Fetch chat history for lot or pickup
router.get('/:contextType/:contextId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contextType, contextId } = req.params;
    const messages = await prisma.chatMessage.findMany({
      where: { contextType: contextType.toUpperCase(), contextId }
    });

    // Mark incoming messages as read for this user
    await prisma.chatMessage.markRead(contextType.toUpperCase(), contextId, req.user!.id);

    return res.json({
      success: true,
      data: messages
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/chat/message - Send message in a contextual thread
router.post('/message', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { receiverId, contextType, contextId, text, audioUrl, imageUrl } = req.body;

    if (!receiverId || !contextType || !contextId) {
      return res.status(400).json({ success: false, error: 'receiverId, contextType, and contextId are required' });
    }

    if (!text && !audioUrl && !imageUrl) {
      return res.status(400).json({ success: false, error: 'Message must contain text, voice note, or image' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        senderId: req.user!.id,
        receiverId,
        contextType: contextType.toUpperCase(),
        contextId,
        text: text || null,
        audioUrl: audioUrl || null,
        imageUrl: imageUrl || null
      }
    });

    return res.status(201).json({
      success: true,
      data: message
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/chat/read - Mark messages as read
router.post('/read', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contextType, contextId } = req.body;
    await prisma.chatMessage.markRead(contextType.toUpperCase(), contextId, req.user!.id);
    return res.json({ success: true, message: 'Messages marked as read' });
  } catch (err) {
    next(err);
  }
});

export default router;
