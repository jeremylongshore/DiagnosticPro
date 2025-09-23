// Feature flags for migration control
export const FEATURE_FLAGS = {
    USE_SUPABASE: import.meta.env.VITE_USE_NEW_API !== 'true', // Dynamic based on env
    USE_FIRESTORE: import.meta.env.VITE_USE_NEW_API === 'true', // Set to true for new backend
    USE_VERTEX_AI: import.meta.env.VITE_USE_NEW_API === 'true', // Set to true for Vertex AI instead of OpenAI
    DEBUG_MODE: import.meta.env.DEV // True in development mode
};
export const isFeatureEnabled = (flag) => {
    return FEATURE_FLAGS[flag];
};
