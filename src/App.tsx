import { RouterProvider } from "react-router-dom";
import { Toast } from "@heroui/react";
import { router } from "./router";
import { AuthProvider } from "./auth/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      {/* Região dos avisos rápidos (components/ui/avisos.ts), no canto inferior direito. */}
      <Toast.Provider placement="bottom end" />
    </AuthProvider>
  );
}
