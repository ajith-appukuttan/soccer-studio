import { BrowserRouter } from 'react-router-dom';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { Router } from '@/components/Router';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

// Mantine styles
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

// Video.js styles
import 'video.js/dist/video-js.css';

// Custom global styles
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <ModalsProvider>
        <Notifications />
        <BrowserRouter>
          <Router />
        </BrowserRouter>
      </ModalsProvider>
    </ThemeProvider>
  );
}

export default App;