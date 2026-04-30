import { describe, it, expect } from 'vitest';
import { formatDate, timeAgo, getStatusColor, getInitialsBg, getDepartmentIcon } from './formatters';

describe('formatters', () => {
  describe('formatDate', () => {
    it('formats an ISO date as "Mon DD, YYYY"', () => {
      expect(formatDate('2026-04-22')).toMatch(/Apr 2[12], 2026/); // tz-tolerant
    });
  });

  describe('timeAgo', () => {
    it('returns "Xm ago" within an hour', () => {
      const iso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(timeAgo(iso)).toBe('5m ago');
    });
    it('returns "Xh ago" within a day', () => {
      const iso = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      expect(timeAgo(iso)).toBe('3h ago');
    });
    it('returns "Xd ago" beyond 24h', () => {
      const iso = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      expect(timeAgo(iso)).toBe('2d ago');
    });
  });

  describe('getStatusColor', () => {
    it('returns the right color per status', () => {
      expect(getStatusColor('active')).toBe('#10b981');
      expect(getStatusColor('critical')).toBe('#f43f5e');
      expect(getStatusColor('stable')).toBe('#6366f1');
      expect(getStatusColor('discharged')).toBe('#94a3b8');
      expect(getStatusColor('pending')).toBe('#f59e0b');
    });
  });

  describe('getInitialsBg', () => {
    it('returns a CSS gradient string', () => {
      expect(getInitialsBg('Alice')).toMatch(/^linear-gradient/);
    });
    it('is deterministic per name', () => {
      expect(getInitialsBg('Alice')).toBe(getInitialsBg('Alice'));
    });
    it('produces different gradients for different first letters', () => {
      // Sample several different starting letters — at least 2 unique results.
      const variants = new Set([
        getInitialsBg('A'), getInitialsBg('B'), getInitialsBg('M'),
        getInitialsBg('Z'), getInitialsBg('X'), getInitialsBg('K'),
      ]);
      expect(variants.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getDepartmentIcon', () => {
    it('maps known departments to emojis', () => {
      expect(getDepartmentIcon('Cardiology')).toBe('❤️');
      expect(getDepartmentIcon('Neurology')).toBe('🧠');
      expect(getDepartmentIcon('Emergency')).toBe('🚨');
    });
    it('falls back to hospital emoji for unknown', () => {
      expect(getDepartmentIcon('Xenobiology')).toBe('🏥');
    });
  });
});
