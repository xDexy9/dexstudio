import { Job } from './types';
import { Language } from './i18n';
import { detectLanguage, translateToAllLanguages } from './googleTranslate';
import { updateJob } from '@/services/firestoreService';

/**
 * Get the translated problem description for a job based on user's preferred language.
 * Falls back to original text if no translation is available.
 */
export function getTranslatedProblemDescription(job: Job, userLanguage: Language): string {
  // If user's language matches the original, return original
  if (job.problemDescriptionLanguage === userLanguage) {
    return job.problemDescription;
  }
  
  // If we have a translation for user's language, use it
  if (job.problemDescriptionTranslations?.[userLanguage]) {
    return job.problemDescriptionTranslations[userLanguage]!;
  }
  
  // Fallback to original
  return job.problemDescription;
}

/**
 * Detect language and translate problem description for a new job.
 * Returns the job with translation data populated.
 */
export async function translateJobProblemDescription(
  job: Job
): Promise<Job> {
  try {
    // Detect the language of the problem description
    const detectedLang = await detectLanguage(job.problemDescription);
    
    // Translate to all other languages
    const translations = await translateToAllLanguages(job.problemDescription, detectedLang);
    
    return {
      ...job,
      problemDescriptionLanguage: detectedLang,
      problemDescriptionTranslations: translations,
    };
  } catch (error) {
    console.error('Failed to translate job problem description:', error);
    // Return job as-is if translation fails
    return job;
  }
}

/**
 * Trigger translation for an existing job (updates storage).
 */
export async function translateExistingJob(job: Job): Promise<Job> {
  const translatedJob = await translateJobProblemDescription(job);
  await updateJob(translatedJob.id, {
    problemDescriptionLanguage: translatedJob.problemDescriptionLanguage,
    problemDescriptionTranslations: translatedJob.problemDescriptionTranslations
  });
  return translatedJob;
}