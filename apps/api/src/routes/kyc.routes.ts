import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, isRegulatoryUser } from '../middleware/auth';

const router = Router();

// GET /api/kyc/status - Current user KYC tier & active limits
router.get('/status', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { kabadiwala: true, recycler: true }
    });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const kycStatus = user.kycStatus || 'UNVERIFIED';
    const isVerified = kycStatus === 'VERIFIED';

    const limits = {
      collector: {
        maxActiveLots: isVerified ? 999 : 1,
        maxLotValueInr: isVerified ? 1000000 : 5000,
        liveBiddingAllowed: isVerified,
        priorityRanked: isVerified
      },
      recycler: {
        liveBiddingAllowed: isVerified,
        weighbridgeHandoverAllowed: isVerified,
        eprCreditIssuanceAllowed: isVerified
      }
    };

    return res.json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        role: user.role,
        kycStatus,
        kycDocuments: user.kycDocuments,
        limits
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/kyc/submit - Submit KYC documents
router.post('/submit', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentType, documentNumber, docFrontUrl, docBackUrl, selfieUrl, upiId, bankAccount, gstin, cpcbCertNumber } = req.body;

    const kycDocs = {
      submittedAt: new Date().toISOString(),
      documentType: documentType || 'AADHAAR',
      documentNumberMask: documentNumber ? `XXXX-XXXX-${documentNumber.slice(-4)}` : 'XXXX-XXXX-8921',
      docFrontUrl: docFrontUrl || null,
      docBackUrl: docBackUrl || null,
      selfieUrl: selfieUrl || null,
      upiId: upiId || null,
      bankAccount: bankAccount || null,
      gstin: gstin || null,
      cpcbCertNumber: cpcbCertNumber || null
    };

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        kycStatus: 'UNDER_REVIEW',
        kycDocuments: kycDocs
      }
    });

    return res.json({
      success: true,
      message: 'KYC documents submitted successfully. Verification status is now UNDER_REVIEW.',
      data: {
        kycStatus: updatedUser.kycStatus,
        kycDocuments: updatedUser.kycDocuments
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/kyc/pending - Regulatory role views all pending KYC submissions
router.get('/pending', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isRegulatory = isRegulatoryUser(req.user?.role);
    if (!isRegulatory) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Regulatory role required' });
    }

    const pendingUsers = await prisma.user.findMany({
      where: { kycStatus: 'UNDER_REVIEW' }
    });

    return res.json({
      success: true,
      data: pendingUsers
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/kyc/verify/:userId - Regulatory role approves or rejects KYC
router.post('/verify/:userId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isRegulatory = isRegulatoryUser(req.user?.role);
    if (!isRegulatory) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Regulatory role required' });
    }

    const { userId } = req.params;
    const { status, remarks } = req.body; // status: 'VERIFIED' | 'REJECTED'

    if (status !== 'VERIFIED' && status !== 'REJECTED') {
      return res.status(400).json({ success: false, error: 'Status must be VERIFIED or REJECTED' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const updatedDocs = {
      ...(user.kycDocuments || {}),
      verifiedAt: new Date().toISOString(),
      verifiedBy: req.user!.id,
      reviewStatus: status,
      remarks: remarks || (status === 'VERIFIED' ? 'Approved by Municipal Authority' : 'Incomplete documentation')
    };

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: status,
        kycDocuments: updatedDocs
      }
    });

    // If collector, also mark KabadiwalaProfile verified
    if (user.role === 'KABADIWALA' || user.role === 'collector') {
      await prisma.kabadiwalaProfile.update({
        where: { userId },
        data: { verified: status === 'VERIFIED' }
      });
    }

    // If recycler, also mark RecyclerProfile verified
    if (user.role === 'RECYCLER' || user.role === 'recycler') {
      await prisma.recyclerProfile.update({
        where: { userId },
        data: { verified: status === 'VERIFIED' }
      });
    }

    return res.json({
      success: true,
      message: `User KYC updated to ${status}`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

export default router;
