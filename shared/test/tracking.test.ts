import { describe, it, expect } from 'vitest';
import { generateTrackingCode, isValidTrackingCode, normalizeTrackingCode } from '../src/tracking';

describe('Tracking Code Generator', () => {
  it('generates valid tracking codes matching FB-XXXXXX format', () => {
    const code = generateTrackingCode();
    expect(code.startsWith('FB-')).toBe(true);
    expect(code.length).toBe(9); // 'FB-' + 6 chars
    expect(isValidTrackingCode(code)).toBe(true);
  });

  it('supports custom prefixes and lengths', () => {
    const code = generateTrackingCode('REQ', 8);
    expect(code.startsWith('REQ-')).toBe(true);
    expect(code.length).toBe(12); // 'REQ-' + 8 chars
    expect(isValidTrackingCode(code)).toBe(true);
  });

  it('generates unique tracking codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateTrackingCode());
    }
    expect(codes.size).toBe(100);
  });

  it('validates valid and invalid tracking codes correctly', () => {
    expect(isValidTrackingCode('FB-8K2W9X')).toBe(true);
    expect(isValidTrackingCode('fb-8k2w9x')).toBe(true);
    expect(isValidTrackingCode('REQ-123456')).toBe(true);
    expect(isValidTrackingCode('')).toBe(false);
    expect(isValidTrackingCode(null)).toBe(false);
    expect(isValidTrackingCode('invalid')).toBe(false);
  });

  it('normalizes user tracking input into canonical FB-XXXXXX format', () => {
    expect(normalizeTrackingCode('7k3m9q')).toBe('FB-7K3M9Q');
    expect(normalizeTrackingCode('fb-7k3m9q')).toBe('FB-7K3M9Q');
    expect(normalizeTrackingCode('  fb-7k3m9q  ')).toBe('FB-7K3M9Q');
    expect(normalizeTrackingCode('FB-۷K۳M۹Q')).toBe('FB-7K3M9Q');
    expect(normalizeTrackingCode('REQ-ABCDEF')).toBe('REQ-ABCDEF');
  });
});
