import { useCallback, useState } from "react";
import type { AvatarStyle, UseUpdateAvatarResult } from "../types/avatar";
import { useProfile } from "../lib/profile-context";
import { useAuth } from "../lib/auth-context";
import { captureEvent } from "../lib/posthog";
export function useUpdateAvatar(): UseUpdateAvatarResult {
  const { profile, setProfile } = useProfile();
  const { isAuthenticated } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAvatar = useCallback(
    async (seed: string, style: AvatarStyle = "toon-head") => {
      setIsSaving(true);
      setError(null);
      try {
        setProfile({ ...profile, avatarSeed: seed, avatarStyle: style });
        captureEvent("avatar updated", {
          avatar_style: style,
          synced_to_cloud: isAuthenticated,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Não foi possível salvar.",
        );
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profile, setProfile, isAuthenticated],
  );

  return { updateAvatar, isSaving, error };
}
