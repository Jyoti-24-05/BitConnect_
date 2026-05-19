// client/src/main.jsx
import React        from "react";
import ReactDOM     from "react-dom/client";
import { Provider } from "react-redux";
import { Toaster }  from "react-hot-toast";
import { store }    from "@/store";
import { AuthProvider } from "@/context/AuthContext";
import App          from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "var(--color-background-primary)",
              color:      "var(--color-text-primary)",
              border:     "1px solid var(--color-border-tertiary)",
            },
          }}
        />
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);