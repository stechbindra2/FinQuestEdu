import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../database/database.module';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async trackEvent(userId: string, eventType: string, eventData: any, context?: any) {
    const { error } = await this.supabase
      .from('learning_analytics')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        context: context || {},
        timestamp: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to track event:', error);
    }
  }

  async getUserAnalytics(userId: string, timeframe: 'day' | 'week' | 'month' = 'week') {
    const startDate = this.getTimeframeStartDate(timeframe);

    const { data } = await this.supabase
      .from('learning_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });

    return data || [];
  }

  async getSystemAnalytics(timeframe: 'day' | 'week' | 'month' = 'week') {
    const startDate = this.getTimeframeStartDate(timeframe);

    const { data } = await this.supabase
      .from('learning_analytics')
      .select('event_type, event_data, timestamp')
      .gte('timestamp', startDate.toISOString());

    return this.aggregateSystemMetrics(data || []);
  }

  private getTimeframeStartDate(timeframe: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'day':
        now.setHours(0, 0, 0, 0);
        return now;
      case 'week':
        const dayOfWeek = now.getDay();
        now.setDate(now.getDate() - dayOfWeek);
        now.setHours(0, 0, 0, 0);
        return now;
      case 'month':
        now.setDate(1);
        now.setHours(0, 0, 0, 0);
        return now;
      default:
        return now;
    }
  }

  private aggregateSystemMetrics(events: any[]) {
    const metrics = {
      totalEvents: events.length,
      eventTypes: {},
      hourlyDistribution: new Array(24).fill(0),
      avgSessionTime: 0,
    };

    events.forEach(event => {
      // Count event types
      metrics.eventTypes[event.event_type] = (metrics.eventTypes[event.event_type] || 0) + 1;

      // Hour distribution
      const hour = new Date(event.timestamp).getHours();
      metrics.hourlyDistribution[hour]++;
    });

    return metrics;
  }
}
