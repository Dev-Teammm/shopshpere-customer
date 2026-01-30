import { API_ENDPOINTS, publicApiCall } from "./api";

export interface SubmitFeedbackRequest {
  username: string;
  email: string;
  content: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  data?: { id: number; username: string; email: string; content: string; createdAt: string };
}

/**
 * Submit feedback (public, no account required).
 */
export async function submitFeedback(request: SubmitFeedbackRequest): Promise<FeedbackResponse> {
  const res = await publicApiCall<FeedbackResponse>(API_ENDPOINTS.FEEDBACK, {
    method: "POST",
    body: JSON.stringify(request),
  });
  return res;
}
