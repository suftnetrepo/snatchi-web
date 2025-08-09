import React, { useState, useEffect, useCallback } from 'react';
import { zat } from '../utils/api';
import { VERBS } from '../config';
import { TEAM, USER } from '../utils/apiUrl';
import { teamValidator } from '../app/protected/integrator/rules';
import { customStyles } from '../utils/helpers';

// Type definitions
interface User {
  _id: string;
  first_name: string;
  last_name: string;
  role: string;
  secure_url?: string;
}

interface TeamMember {
  _id: string;
  id: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    secure_url?: string;
  };
}

interface TeamSelectOption {
  label: string;
  value: string;
}

interface TeamState {
  data: TeamMember[];
  teamData: TeamSelectOption[];
  userData: User[];
  loading: boolean;
  fields: Record<string, any>;
  error: string | null;
  success: boolean;
  rules: any;
}

interface FetchUsersParams {
  pageIndex?: number;
  pageSize?: number;
}

interface AddTeamMemberBody {
  user_id: string;
  projectId: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  errorMessage?: string;
}

const useTeam = (id: string, flag = true) => {
  const [state, setState] = useState<TeamState>({
    data: [],
    teamData: [],
    userData: [],
    loading: false,
    fields: teamValidator.fields,
    error: null,
    success: false,
    rules: teamValidator.rules
  });

  // Helper function to update state
  const updateState = useCallback((updates: Partial<TeamState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  // Reset form fields
  const handleReset = useCallback(() => {
    updateState({ fields: teamValidator.fields });
  }, [updateState]);

  // Handle form field changes
  const handleChange = useCallback((name: string, value: string) => {
    setState(prevState => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        [name]: value
      }
    }));
  }, []);

  // Handle errors
  const handleError = useCallback((error: string) => {
    updateState({ error, loading: false });
  }, [updateState]);

  // Fetch team data by project ID
  const handleFetch = useCallback(async (projectId: string): Promise<boolean> => {
    if (!projectId) {
      handleError('Project ID is required');
      return false;
    }

    updateState({ loading: true, error: null });

    try {
          // @ts-ignore
      const response: ApiResponse<TeamMember[]> = await zat(TEAM.fetch, null, VERBS.GET, { 
        id: projectId 
      });

      if (response.success && response.data) {
        updateState({ 
          data: response.data, 
          loading: false 
        });
        return true;
      } else {
        handleError(response.errorMessage || 'Failed to fetch team data.');
        return false;
      }
    } catch (error) {
      handleError('An unexpected error occurred while fetching team data.');
      return false;
    }
  }, [handleError, updateState]);

  // Delete team member
  const handleDelete = useCallback(async (team_id: string): Promise<boolean> => {
    if (!team_id || !id) {
      handleError('Team ID and Project ID are required');
      return false;
    }

    updateState({ loading: true, error: null });

    try {
          // @ts-ignore
      const response: ApiResponse = await zat(TEAM.removeOne, null, VERBS.DELETE, {
        id: team_id,
        projectId: id
      });

      if (response.success) {
        setState(prevState => ({
          ...prevState,
          data: prevState.data.filter(team => team._id !== team_id),
          loading: false
        }));
        return true;
      } else {
        handleError(response.errorMessage || 'Failed to delete the team member.');
        return false;
      }
    } catch (error) {
      handleError('An unexpected error occurred while deleting the team member.');
      return false;
    }
  }, [id, handleError, updateState]);

  // Select user to add to team
  const handleSelect = useCallback(async (user_id: string): Promise<boolean> => {
    if (!user_id || !id) {
      handleError('User ID and Project ID are required');
      return false;
    }

    // Check if user is already in the team
    const isUserAlreadyInTeam = state.data.some(team => team.id.id === user_id);
    
    if (isUserAlreadyInTeam) {
      handleError('User is already a team member.');
      return false;
    }

    try {
      const result = await handleAdd({
        user_id,
        projectId: id
      });
      return result;
    } catch (error) {
      handleError('Failed to add user to team.');
      return false;
    }
  }, [id, state.data, handleError]);

  // Add team member
  const handleAdd = useCallback(async (body: AddTeamMemberBody): Promise<boolean> => {
    if (!body.user_id || !body.projectId) {
      handleError('User ID and Project ID are required');
      return false;
    }

    updateState({ loading: true, error: null });

    try {
      const response: ApiResponse<{ _id: string; id: string }> = await zat(
        TEAM.addOne, 
        body, 
        VERBS.POST
      );

      if (response.success && response.data) {
        // Find the user data to create the team member object
        const user = state.userData.find(user => user._id === response.data!.id);
        
        if (!user) {
          handleError('User data not found.');
          return false;
        }

        const newTeamMember: TeamMember = {
          _id: response.data._id,
          id: {
            id: response.data.id,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            secure_url: user.secure_url
          }
        };

        setState(prevState => ({
          ...prevState,
          data: [newTeamMember, ...prevState.data],
          loading: false,
          success: true
        }));
        return true;
      } else {
        handleError(response.errorMessage || 'Failed to add team member.');
        return false;
      }
    } catch (error) {
      handleError('An unexpected error occurred while adding team member.');
      return false;
    }
  }, [state.userData, handleError, updateState]);

  // Fetch users with pagination
  const handleFetchUsers = useCallback(async ({ 
    pageIndex = 1, 
    pageSize = 10 
  }: FetchUsersParams = {}): Promise<boolean> => {
    updateState({ loading: true, error: null });

    try {
          // @ts-ignore
      const response: ApiResponse<User[]> = await zat(USER.fetch, null, VERBS.GET, {
        action: 'users',
        page: pageIndex,
        limit: pageSize
      });

      if (response.success && response.data) {
        const teamData: TeamSelectOption[] = response.data.map(item => ({
          label: `${item.first_name} ${item.last_name}`,
          value: item._id
        }));

        updateState({
          userData: response.data,
          teamData,
          loading: false
        });
        return true;
      } else {
        handleError(response.errorMessage || 'Failed to fetch users.');
        return false;
      }
    } catch (error) {
      handleError('An unexpected error occurred while fetching users.');
      return false;
    }
  }, [updateState, handleError]);

  // Clear success/error messages
  const clearMessages = useCallback(() => {
    updateState({ error: null, success: false });
  }, [updateState]);

  // Get team member by user ID
  const getTeamMemberByUserId = useCallback((userId: string): TeamMember | undefined => {
    return state.data.find(team => team.id.id === userId);
  }, [state.data]);

  // Check if user is already in team
  const isUserInTeam = useCallback((userId: string): boolean => {
    return state.data.some(team => team.id.id === userId);
  }, [state.data]);

  // Get available users (not in team)
  const getAvailableUsers = useCallback((): User[] => {
    return state.userData.filter(user => 
      !state.data.some(team => team.id.id === user._id)
    );
  }, [state.userData, state.data]);

  // Initialize team data on mount
  useEffect(() => {
    if (flag && id) {
      handleFetch(id);
    }
  }, [flag, id, handleFetch]);

  return {
    // State
    ...state,
    
    // Core Actions
    handleChange,
    handleFetch,
    handleDelete,
    handleReset,
    handleSelect,
    handleAdd,
    handleFetchUsers,
    
    // Utility Functions
    clearMessages,
    getTeamMemberByUserId,
    isUserInTeam,
    getAvailableUsers,
    
    // External utilities
    customStyles
  };
};

export { useTeam };
export type { 
  User, 
  TeamMember, 
  TeamSelectOption, 
  TeamState, 
  FetchUsersParams, 
  AddTeamMemberBody 
};