// client/src/main.jsx — remove StrictMode
import React        from "react";
import ReactDOM     from "react-dom/client";
import { Provider } from "react-redux";
import { Toaster }  from "react-hot-toast";
import { store }    from "@/store";
import { AuthProvider } from "@/context/AuthContext";
import App          from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{ duration: 3000 }}
      />
    </AuthProvider>
  </Provider>
);