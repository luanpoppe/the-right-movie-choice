import { createContext, PropsWithChildren, useContext, useState } from "react";

type States = {
  exemplo?: string;
  setExemplo?: SetState<string>;
};

const ContextComponent = createContext<States>({});
export const useGlobalContext = () => useContext(ContextComponent);

export function GlobalContext({ children }: PropsWithChildren) {
  const [exemplo, setExemplo] = useState<string>("");

  const contextObj = {
    exemplo,
    setExemplo,
  };

  return (
    <ContextComponent.Provider value={contextObj}>
      {children}
    </ContextComponent.Provider>
  );
}
