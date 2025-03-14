import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface User {
  // Define the User type properties here
}

interface State {
  currentUser: User | null;
}

interface Action {
  login: (params: { user: User }) => void;
  signUp: (params: { user: User }) => void;
  signOut: () => void;
  updateCurrentUser: (currentUser: User) => void;
}

// Combine state and action types for the context
type AppContextType = State & Action;

const defaultContextValue: AppContextType = {
  currentUser: null,
  login: () => {}, 
  signUp: () => {}, 
  signOut: () => {},
  updateCurrentUser: () => {}
};

// Initialize the context with a default state
export const AppContext = createContext<AppContextType>(defaultContextValue);

// Custom hook for using the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const initialState: State = {
    currentUser: null
  };

  const [state, setState] = useState<State>(initialState);

  useEffect(() => {
    try {
      const storedUser = window.localStorage.getItem('user');
      const user = storedUser && storedUser !== 'undefined' ? JSON.parse(storedUser) : null;

      if (user) {
        setState({ currentUser: user });
      }
    } catch (error) {
      console.error('Failed to load state from local storage:', error);
    }
  }, []);

  const action: Action = {
    login: (params) => {
      const { user } = params;

      try {
        window.localStorage.setItem('user', JSON.stringify(user));
        setState({ currentUser: user });
      } catch (error) {
        console.error('Failed to save state to local storage:', error);
      }
    },

    signUp: (params) => {
      const { user } = params;

      try {
        window.localStorage.setItem('user', JSON.stringify(user));
        setState({ currentUser: user });
      } catch (error) {
        console.error('Failed to save state to local storage:', error);
      }
    },

    signOut: () => {
      try {
        window.localStorage.removeItem('user');
        setState(initialState);
      } catch (error) {
        console.error('Failed to remove state from local storage:', error);
      }
    },

    updateCurrentUser: (currentUser) => {
      setState((prevState) => ({ ...prevState, currentUser }));
      window.localStorage.setItem('user', JSON.stringify(currentUser));
    }
  };

  return <AppContext.Provider value={{ ...action, ...state }}>{children}</AppContext.Provider>;
};
