import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface User {}
interface Task {}

interface State {
  currentUser: User | null;
  currentTask: User | null;
  showUserOffCanvas: boolean;
  taskOffCanvas: boolean;
}

interface Action {
  login: (params: { user: User }) => void;
  signUp: (params: { user: User }) => void;
  signOut: () => void;
  updateCurrentUser: (currentUser: User) => void;
  showOffCanvas: (show: boolean) => void;
  showTaskOffCanvas: (show: boolean, currentTask: Task) => void;
}

type AppContextType = State & Action;
const defaultContextValue: AppContextType = {
  currentUser: null,
  currentTask: null,
  showUserOffCanvas: false,
  taskOffCanvas: false,
  login: () => {},
  signUp: () => {},
  signOut: () => {},
  updateCurrentUser: () => {},
  showOffCanvas: () => {},
  showTaskOffCanvas: () => {}
};

export const AppContext = createContext<AppContextType>(defaultContextValue);
export const useAppContext = () => {
  const context = useContext(AppContext);
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const initialState: State = {
    currentUser: null,
    currentTask: null,
    // @ts-ignore
    showUserOffCanvas: false,
    taskOffCanvas: false
  };

  const [state, setState] = useState<State>(initialState);

  useEffect(() => {
    try {
      const storedUser = window.localStorage.getItem('user');
      const user = storedUser && storedUser !== 'undefined' ? JSON.parse(storedUser) : null;

      if (user) {
        setState((pre) => ({ ...pre, currentUser: user }));
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
        setState((pre) => ({ ...pre, currentUser: user }));
      } catch (error) {
        console.error('Failed to save state to local storage:', error);
      }
    },

    signUp: (params) => {
      const { user } = params;

      try {
        window.localStorage.setItem('user', JSON.stringify(user));
        setState((pre) => ({ ...pre, currentUser: user }));
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

    showOffCanvas: (show) => {
      try {
        setState((prevState) => ({
          ...prevState,
          showUserOffCanvas: show
        }));
      } catch (error) {
        console.error('Failed to remove state from local storage:', error);
      }
    },

    showTaskOffCanvas: (show, currentTask) => {
      try {
        setState((prevState) => ({
          ...prevState,
          taskOffCanvas: show,
          showUserOffCanvas: false,
          currentTask
        }));
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
