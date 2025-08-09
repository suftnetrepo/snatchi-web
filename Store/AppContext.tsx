import { createContext, useState, useContext, ReactNode } from 'react';

interface Task {}

interface State {
  showUserOffCanvas: boolean;
  taskOffCanvas: boolean;
  startDate: Date;
  endDate: Date;
  user_id: string;
}

interface Action {
  showOffCanvas: (show: boolean) => void;
  showTaskOffCanvas: (show: boolean, currentTask: Task) => void;
  updateSelectedDate: (startDate: Date, endDate: Date, user_id: string) => void;
}

type AppContextType = State & Action;
const defaultContextValue: AppContextType = {
  showUserOffCanvas: false,
  taskOffCanvas: false,
  startDate: new Date(),
  endDate: new Date(),
  user_id: '',
  showOffCanvas: () => {},
  showTaskOffCanvas: () => {},
  updateSelectedDate: () => {}
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
    // @ts-ignore
    showUserOffCanvas: false,
    taskOffCanvas: false,
    startDate: new Date(),
    endDate: new Date(),
    user_id: ''
  };

  const [state, setState] = useState<State>(initialState);

  const action: Action = {
    showOffCanvas: (show) => {
      setState((prevState) => ({
        ...prevState,
        showUserOffCanvas: show
      }));
    },

    showTaskOffCanvas: (show, currentTask) => {
      setState((prevState) => ({
        ...prevState,
        taskOffCanvas: show,
        showUserOffCanvas: false,
        currentTask
      }));
    },

    updateSelectedDate: (startDate: Date, endDate: Date, user_id: string) => {
      setState((prevState) => ({
        ...prevState,
        startDate: startDate,
        endDate: endDate,
        user_id: user_id
      }));
    }
  };

  return <AppContext.Provider value={{ ...action, ...state }}>{children}</AppContext.Provider>;
};
