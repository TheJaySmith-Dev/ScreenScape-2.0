import React from 'react';
import { AppleThemeProvider } from '../components/AppleThemeProvider';
import StudioMogulUI from '../games/studio-mogul/StudioMogulUI';

const StudioMogulPage: React.FC = () => {
  return (
    <AppleThemeProvider>
      <StudioMogulUI />
    </AppleThemeProvider>
  );
};

export default StudioMogulPage;

