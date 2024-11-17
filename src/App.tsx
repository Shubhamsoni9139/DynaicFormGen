import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import DynamicFormGenerator from "./DynamicFormGenerator.tsx"; // Adjust the import path if necessary

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <DynamicFormGenerator />
    </>
  );
}

export default App;
