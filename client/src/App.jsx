import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DirectoryView from "./DirectoryView";
import "./App.css";
import Register from "./Register";

const router = createBrowserRouter([
  {
    path: "/user",
    element: <Register />,
  },
  {
    path: "/",
    element: <Register />,
  },
  {
    path: "/directory/",
    element: <DirectoryView />,
  },
  {
    path: "/directory/:id",
    element: <DirectoryView />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
