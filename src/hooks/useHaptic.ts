import { useCallback } from 'react';

export const useHaptic = () => {
    const trigger = useCallback((pattern: number | number[]) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }, []);

    return {
        success: useCallback(() => trigger(50), [trigger]),
        error: useCallback(() => trigger([50, 100, 50]), [trigger]),
        impact: useCallback(() => trigger(20), [trigger]),
        custom: trigger,
    };
};
