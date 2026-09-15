import React, { createContext, useContext, useState } from 'react';

const DrawerCtx = createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export const useDrawer = () => useContext(DrawerCtx);

export function DrawerProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DrawerCtx.Provider
      value={{
        isOpen,
        open:  () => setIsOpen(true),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </DrawerCtx.Provider>
  );
}
