import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /api/reviews - Submit double-blind review
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      targetUserId,
      saleTokenId,
      ratingOverall,
      ratingScaleAcc,
      ratingPayoutSpd,
      ratingPurity,
      reviewText
    } = req.body;

    const reviewerId = req.user!.id;

    if (reviewerId === targetUserId) {
      return res.status(400).json({ success: false, error: 'Cannot review yourself' });
    }

    // Check if reviewer already reviewed this saleToken
    if (saleTokenId) {
      const existing = await prisma.review.findMany({
        where: { reviewerId, saleTokenId }
      });
      if (existing.length > 0) {
        return res.status(400).json({ success: false, error: 'You have already submitted a review for this sale' });
      }
    }

    const review = await prisma.review.create({
      data: {
        reviewerId,
        targetUserId,
        saleTokenId: saleTokenId || null,
        ratingOverall: Number(ratingOverall) || 5,
        ratingScaleAcc: ratingScaleAcc !== undefined ? Number(ratingScaleAcc) : null,
        ratingPayoutSpd: ratingPayoutSpd !== undefined ? Number(ratingPayoutSpd) : null,
        ratingPurity: ratingPurity !== undefined ? Number(ratingPurity) : null,
        reviewText: reviewText || null
      }
    });

    const isRevealed = review.status === 'REVEALED';

    return res.status(201).json({
      success: true,
      message: isRevealed
        ? 'Mutual reviews completed! Ratings are now publicly revealed.'
        : 'Rating submitted securely. It will be revealed once the other party submits their review (or within 48 hours) to prevent retaliatory ratings.',
      data: review
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reviews/user/:userId - Get public revealed reviews for user
router.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { targetUserId: userId, status: 'REVEALED' }
    });

    return res.json({
      success: true,
      data: reviews
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reviews/sale/:saleTokenId - Get review status for a specific transaction
router.get('/sale/:saleTokenId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { saleTokenId } = req.params;
    const allReviews = await prisma.review.findMany({
      where: { saleTokenId }
    });

    const myReview = allReviews.find((r: any) => r.reviewerId === req.user!.id);
    const peerReview = allReviews.find((r: any) => r.reviewerId !== req.user!.id);

    return res.json({
      success: true,
      data: {
        myReview: myReview || null,
        peerReview: peerReview?.status === 'REVEALED' ? peerReview : null,
        isMutualComplete: allReviews.length >= 2 && allReviews.every((r: any) => r.status === 'REVEALED')
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
