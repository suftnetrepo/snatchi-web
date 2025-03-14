const storage = {
  
    setItem: (key, value) => {
        if (typeof window !== 'undefined') {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
            localStorage.setItem(key, stringValue);
        }
    },

   
    getItem: (key) => {
        if (typeof window !== 'undefined') {
            const item = localStorage.getItem(key);
            try {
                return JSON.parse(item); 
            } catch {
                return item; 
            }
        }
        return null; 
    },

  
    removeItem: (key) => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
        }
    },

   
    clear: () => {
        if (typeof window !== 'undefined') {
            localStorage.clear();
        }
    },
};

export { storage }
