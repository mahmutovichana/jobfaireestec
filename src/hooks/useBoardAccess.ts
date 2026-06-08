import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";

/**
 * Board access = admin OR user signed in with an @eestec-sa.ba email.
 * Matches the server-side is_board_member(uuid) RLS function.
 */
export function useBoardAccess() {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useIsAdmin();
  const email = user?.email?.toLowerCase() ?? "";
  const isEestecBoard = email.endsWith("@eestec-sa.ba");
  return { isBoard: isAdmin || isEestecBoard, isLoading };
}