import { useEffect, useMemo, useState } from "react";

import { useUsernameAvailabilityQuery } from "@/utils/queryUtils";

import { useTranslation } from "react-i18next";

export interface UseUsernameValidationOptions {
  currentUsername?: string; // For edit mode - skip validation if username matches current
  debounceMs?: number; // Debounce delay in milliseconds
  required?: boolean; // Whether username is required (default: true)
}

export interface UseUsernameValidationResult {
  isValid: boolean;
  isAvailable: boolean | null;
  isChecking: boolean;
  error: string;
  hasError: boolean;
  validateRequired: () => boolean; // Method to check if required validation passes
  isEmpty: boolean; // Whether username is empty
}

export const useUsernameValidation = (
  username: string,
  options: UseUsernameValidationOptions = {}
): UseUsernameValidationResult => {
  const { t } = useTranslation();
  const { currentUsername, debounceMs = 500, required = true } = options;

  const [debouncedUsername, setDebouncedUsername] = useState("");
  const [error, setError] = useState("");

  // Debounce username input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedUsername(username);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [username, debounceMs]);

  // Determine if we should check username availability
  const shouldCheckUsername = useMemo(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) return false;
    if (currentUsername && debouncedUsername === currentUsername) return false;
    if (!/^[a-zA-Z0-9_]+$/.test(debouncedUsername)) return false;
    if (debouncedUsername.length > 20) return false;
    return true;
  }, [debouncedUsername, currentUsername]);

  // Query for username availability
  const {
    data: usernameCheckResult,
    isLoading: isChecking,
    error: queryError,
  } = useUsernameAvailabilityQuery(debouncedUsername, {
    enabled: shouldCheckUsername,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Determine availability state
  const isAvailable = useMemo(() => {
    if (!username || username.length < 3) return null;
    if (currentUsername && username === currentUsername) return true; // Current username is always "available"
    if (!shouldCheckUsername) return false; // Invalid format
    return usernameCheckResult?.available ?? null;
  }, [username, currentUsername, shouldCheckUsername, usernameCheckResult]);

  // Method to validate required field (for form submission)
  const validateRequired = useMemo(() => {
    return () => {
      if (required && !username?.trim()) {
        setError(t("Username is required"));
        return false;
      }
      return true;
    };
  }, [required, username, t]);

  // Update error state based on validation rules
  useEffect(() => {
    if (!username) {
      setError("");
      return;
    }

    // If editing and username hasn't changed, no error
    if (currentUsername && username === currentUsername) {
      setError("");
      return;
    }

    // Length validation
    if (username.length > 0 && username.length < 3) {
      setError(t("Username must be at least 3 characters"));
      return;
    }

    if (username.length > 20) {
      setError(t("Username must be between 3-20 characters"));
      return;
    }

    // Format validation
    if (username.length >= 3 && !/^[a-zA-Z0-9_]+$/.test(username)) {
      setError(
        t("Username can only contain letters, numbers, and underscores")
      );
      return;
    }

    // Query error
    if (queryError) {
      setError(t("Failed to check username availability"));
      return;
    }

    // Availability check
    if (isAvailable === false) {
      setError(t("Username is already taken"));
      return;
    }

    // No errors
    setError("");
  }, [username, currentUsername, isAvailable, queryError, t]);

  // Check if username is empty
  const isEmpty = useMemo(() => {
    return !username?.trim();
  }, [username]);

  // Determine if username is valid (format + availability)
  const isValid = useMemo(() => {
    if (!username || username.length < 3) return false;
    if (currentUsername && username === currentUsername) return true;
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
    if (username.length > 20) return false;
    return isAvailable === true;
  }, [username, currentUsername, isAvailable]);

  return {
    isValid,
    isAvailable,
    isChecking,
    error,
    hasError: !!error,
    validateRequired,
    isEmpty,
  };
};
