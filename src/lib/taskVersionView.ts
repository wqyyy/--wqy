import { createContext, useContext } from "react";
import type { TaskVersion } from "./taskVersions";

export const TaskVersionViewContext = createContext<{ version?: TaskVersion; readOnly: boolean; canRun: boolean }>({ readOnly: false, canRun: true });
export const useTaskVersionView = () => useContext(TaskVersionViewContext);
