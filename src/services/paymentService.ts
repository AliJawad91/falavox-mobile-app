// src/services/paymentService.ts
import { authApi } from './authApi';

export interface Plan {
  id: string;
  name: string;
  minutes: number;
  amount: number; // in cents
  description: string;
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  data: {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    minutes: number;
    plan: {
      id: string;
      name: string;
      description: string;
    };
  };
}

export interface PaymentHistoryItem {
  _id: string;
  planId: string;
  amount: number;
  minutes: number;
  status: string;
  createdAt: string;
}

class PaymentService {
  /**
   * Get all available plans
   */
  async getPlans(): Promise<Plan[]> {
    try {
      const response = await authApi.get('/payments/plans');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  }

  /**
   * Create payment intent for a plan
   */
  async createPaymentIntent(planId: string): Promise<CreatePaymentIntentResponse['data']> {
    try {
      const response = await authApi.post<CreatePaymentIntentResponse>('/payments/create-intent', {
        planId
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirm payment after successful payment intent
   */
  async confirmPayment(paymentIntentId: string): Promise<any> {
    try {
      const response = await authApi.post('/payments/confirm', {
        paymentIntentId
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(limit: number = 20): Promise<PaymentHistoryItem[]> {
    try {
      const response = await authApi.get(`/payments/history?limit=${limit}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }
}

export default new PaymentService();

