/**
 * Unified Form Resolver for Google Apps Script.
 * Seamlessly resolves forms from static codebase registry (@fb/shared)
 * and dynamic forms stored in Google Sheets (`_forms` tab).
 */
import type { FormDefinition, FormSummary } from '@fb/shared';
import { FORM_REGISTRY, AVAILABLE_FORM_IDS } from '@fb/shared';
import { getScriptConfig } from '../config';
import { openSpreadsheet } from '../sheets/repository';
import { getDynamicForm, getAllDynamicForms } from './dynamic-forms';

export interface ResolvedFormResult {
  form: FormDefinition;
  isDynamic: boolean;
}

export function resolveForm(formId: string): ResolvedFormResult | null {
  // 1. Check static registry first (zero latency)
  if (FORM_REGISTRY[formId]) {
    return {
      form: FORM_REGISTRY[formId],
      isDynamic: false
    };
  }

  // 2. Check dynamic forms from Google Sheets
  const cfg = getScriptConfig();
  if (!cfg.spreadsheetId) return null;

  try {
    const ss = openSpreadsheet(cfg.spreadsheetId);
    const dyn = getDynamicForm(ss, formId);
    if (dyn) {
      return {
        form: dyn,
        isDynamic: true
      };
    }
  } catch (err) {
    console.error(`[form-resolver] Error reading dynamic form «${formId}»:`, err);
  }

  return null;
}

export function listAllForms(): FormSummary[] {
  const summaries: FormSummary[] = [];

  // 1. Add static forms
  for (const id of AVAILABLE_FORM_IDS) {
    const f = FORM_REGISTRY[id];
    if (f) {
      summaries.push({
        id: f.id,
        version: f.version,
        title: f.title,
        description: f.description,
        status: f.status,
        closesAt: f.closesAt ?? null,
        access: f.access,
        fieldCount: f.fields.length,
        isDynamic: false
      });
    }
  }

  // 2. Add dynamic forms
  const cfg = getScriptConfig();
  if (cfg.spreadsheetId) {
    try {
      const ss = openSpreadsheet(cfg.spreadsheetId);
      const dynamicForms = getAllDynamicForms(ss);
      for (const df of dynamicForms) {
        summaries.push({
          id: df.id,
          version: df.version,
          title: df.title,
          description: df.description,
          status: df.status,
          closesAt: df.closesAt ?? null,
          access: df.access,
          fieldCount: df.fields.length,
          isDynamic: true
        });
      }
    } catch (err) {
      console.error('[form-resolver] Error listing dynamic forms:', err);
    }
  }

  return summaries;
}

