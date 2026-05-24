import { reviewRepository } from '../repositories/reviewRepository';

export const reviewService = {
  async getDailyReviews(userId = 'user-default-123') {
    return await reviewRepository.getDailyReviews(userId);
  },

  async getWeeklyReviews(userId = 'user-default-123') {
    return await reviewRepository.getWeeklyReviews(userId);
  }
};
export default reviewService;
