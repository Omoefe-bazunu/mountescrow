'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from './email.service';

export interface WalletAdjustment {
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  adminId: string;
  adminEmail: string;
}

export async function adjustUserWallet(adjustment: WalletAdjustment): Promise<void> {
  try {
    const { userId, amount, type, reason, adminId, adminEmail } = adjustment;
    
    // Get user wallet
    const walletRef = db.collection('userWallets').doc(userId);
    const walletDoc = await walletRef.get();
    
    if (!walletDoc.exists) {
      throw new Error('User wallet not found');
    }
    
    const currentBalance = walletDoc.data()?.balance || 0;
    const adjustmentAmount = type === 'credit' ? amount : -amount;
    const newBalance = currentBalance + adjustmentAmount;
    
    if (newBalance < 0) {
      throw new Error('Insufficient balance for debit adjustment');
    }
    
    // Update wallet balance
    await walletRef.update({
      balance: newBalance,
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    // Log the transaction
    await db.collection('transactions').add({
      userId,
      type: type.toUpperCase(),
      amount: Math.abs(amount),
      status: 'SUCCESS',
      description: `Admin adjustment: ${reason}`,
      createdAt: FieldValue.serverTimestamp(),
      service: 'ADMIN',
      adminId,
      adminEmail,
    });
    
    // Get user details for notification
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.email) {
      await sendEmail({
        to_email: userData.email,
        to_name: userData.displayName || 'User',
        subject: `Wallet ${type === 'credit' ? 'Credit' : 'Debit'} - Mountescrow`,
        message: `Your wallet has been ${type === 'credit' ? 'credited' : 'debited'} with $${amount.toFixed(2)}. 
        
Reason: ${reason}
New Balance: $${newBalance.toFixed(2)}

If you have any questions, please contact our support team.`,
      });
    }
    
    // Log admin action
    await db.collection('logs').add({
      timestamp: FieldValue.serverTimestamp(),
      level: 'INFO',
      service: 'ADMIN',
      message: `Wallet adjustment performed`,
      userId,
      adminId,
      adminEmail,
      type,
      amount,
      reason,
      newBalance,
    });
    
  } catch (error) {
    console.error('Error adjusting user wallet:', error);
    throw error;
  }
}

export async function resolveDispute(
  disputeId: string,
  resolution: {
    resolutionType: 'refund_buyer' | 'release_seller' | 'partial_refund' | 'no_action';
    amount?: number;
    notes: string;
    adminId: string;
    adminEmail: string;
  }
): Promise<void> {
  try {
    const disputeRef = db.collection('disputes').doc(disputeId);
    const disputeDoc = await disputeRef.get();
    
    if (!disputeDoc.exists) {
      throw new Error('Dispute not found');
    }
    
    const disputeData = disputeDoc.data()!;
    
    // Update dispute with resolution
    await disputeRef.update({
      status: 'resolved',
      resolution: {
        ...resolution,
        resolvedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    // Handle wallet adjustments if needed
    if (resolution.resolutionType !== 'no_action' && resolution.amount) {
      // This would need more complex logic to determine user IDs and handle refunds/releases
      // For now, we'll just log the action
      await db.collection('logs').add({
        timestamp: FieldValue.serverTimestamp(),
        level: 'INFO',
        service: 'ADMIN',
        message: `Dispute resolved with ${resolution.resolutionType}`,
        disputeId,
        adminId: resolution.adminId,
        adminEmail: resolution.adminEmail,
        resolutionType: resolution.resolutionType,
        amount: resolution.amount,
      });
    }
    
    // Notify involved parties
    await sendEmail({
      to_email: disputeData.disputedByEmail,
      to_name: 'User',
      subject: `Dispute Resolved - ${disputeData.subject}`,
      message: `Your dispute "${disputeData.subject}" has been resolved.
      
Resolution: ${resolution.notes}

Thank you for your patience.`,
      deal_title: disputeData.dealTitle,
    });
    
    await sendEmail({
      to_email: disputeData.disputedAgainst,
      to_name: 'User',
      subject: `Dispute Resolved - ${disputeData.subject}`,
      message: `The dispute "${disputeData.subject}" has been resolved.
      
Resolution: ${resolution.notes}

Thank you for your cooperation.`,
      deal_title: disputeData.dealTitle,
    });
    
  } catch (error) {
    console.error('Error resolving dispute:', error);
    throw error;
  }
}