
import { getReferenceModelPrompt } from './modelReferenceEngine';

// Export as both 'getReferenceModelPrompt' and 'getStandardModelPrompt'
// to maintain interface compatibility with standard dispatchers if needed,
// though promptEngine.js will likely call getReferenceModelPrompt specifically or we route it there.
// Actually, let's just export what we have and handle mapping in promptEngine.js.

export { getReferenceModelPrompt };

// Alias for "Standard" calls if the system defaults to calling getStandardModelPrompt
export const getStandardModelPrompt = getReferenceModelPrompt;
