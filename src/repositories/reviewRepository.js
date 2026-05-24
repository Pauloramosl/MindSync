import { db } from '../database/db';

export const reviewRepository = {
  async getDailyReviews(userId = 'user-default-123') {
    return await db.daily_reviews
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');
  },

  async addDailyReview(review) {
    const record = {
      userId: 'user-default-123',
      createdAt: Date.now(),
      ...review
    };
    await db.daily_reviews.add(record);
    return record;
  },

  async getWeeklyReviews(userId = 'user-default-123') {
    return await db.weekly_reviews
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');
  },

  async addWeeklyReview(review) {
    const record = {
      userId: 'user-default-123',
      createdAt: Date.now(),
      ...review
    };
    await db.weekly_reviews.add(record);
    return record;
  }
};
