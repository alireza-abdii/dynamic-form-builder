import { describe, it, expect } from 'vitest';
import { FORM_REGISTRY } from '@fb/shared';

describe('GAS Backend Smoke Test', () => {
  it('bundles shared registry with registered forms', () => {
    expect(FORM_REGISTRY).toBeDefined();
    expect(FORM_REGISTRY['employee-contact-info']).toBeDefined();
    expect(FORM_REGISTRY['employee-contact-info']?.fields.length).toBeGreaterThan(0);
  });
});

