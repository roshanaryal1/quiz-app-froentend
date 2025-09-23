// Custom hook for preventing memory leaks with API calls
import { useEffect, useRef } from 'react';

export const useAbortController = () => {
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Create new AbortController for each component mount
    abortControllerRef.current = new AbortController();

    // Cleanup function to abort any pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Return the signal to use in fetch requests
  return abortControllerRef.current?.signal;
};

export default useAbortController;
