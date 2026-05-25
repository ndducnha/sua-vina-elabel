import { RouterProvider } from "react-router";
import { router } from "@/routes";
import { AppProviders } from "@/providers/AppProviders";
import { AuthHydrationGate } from "@/providers/AuthHydrationGate";
import { TaskManager } from "@/components/task-manager";

function App() {
  return (
    <AppProviders>
      <AuthHydrationGate>
        <RouterProvider router={router} />
        <TaskManager />
      </AuthHydrationGate>
    </AppProviders>
  );
}

export default App;
