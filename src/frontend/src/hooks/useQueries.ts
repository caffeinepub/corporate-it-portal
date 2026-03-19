import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type UserProfile, UserRole, UserStatus } from "../backend.d";
import { useActor } from "./useActor";

export { UserRole, UserStatus };
export type { UserProfile };

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.getCallerUserProfile();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetMyRegistrationStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["myRegistrationStatus"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getMyRegistrationStatus();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useGetPendingRegistrations() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["pendingRegistrations"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getPendingRegistrations();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetAllRegistrations() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["allRegistrations"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllRegistrations();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      dateOfBirth: string;
      email: string;
      mobile: string;
      country: string;
      roleTitle: string;
      registrationPurpose: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.registerUser(
        params.name,
        params.dateOfBirth,
        params.email,
        params.mobile,
        params.country,
        params.roleTitle,
        params.registrationPurpose,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRegistrationStatus"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useApproveUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("Actor not available");
      await actor.approveUser(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingRegistrations"] });
      queryClient.invalidateQueries({ queryKey: ["allRegistrations"] });
    },
  });
}

export function useRejectUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      reason,
    }: { principal: Principal; reason: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.rejectUser(principal, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingRegistrations"] });
      queryClient.invalidateQueries({ queryKey: ["allRegistrations"] });
    },
  });
}
