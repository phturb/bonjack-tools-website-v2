import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccessToken } from "../../helpers/auth";

/**
 * Mutation against one tournament: fetches a token, runs `fn`, then invalidates
 * `["swiss", id]` so the page refetches (no optimistic updates, spec section 10).
 */
export const useSwissMutation = <TVariables = void, TResult = unknown>(
  id: string,
  fn: (token: string, variables: TVariables) => Promise<TResult>,
  onSuccess?: (result: TResult) => void
) => {
  const getToken = useAccessToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: TVariables) => fn(await getToken(), variables),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["swiss", id] });
      onSuccess?.(result);
    },
  });
};
