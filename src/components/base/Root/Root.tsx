import { StyledEngineProvider } from "@mui/material/styles";
import React from "react";
import App from "../App";

const Root: React.FC = () => {
  return (
    <React.Suspense>
      <StyledEngineProvider injectFirst>
        <App />
      </StyledEngineProvider>
    </React.Suspense>
  );
};

export default Root;
