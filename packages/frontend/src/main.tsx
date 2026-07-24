import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router";
import { routers } from "./routes";

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={routers} />,
);
