import React from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "./state/AuthContext.jsx";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
