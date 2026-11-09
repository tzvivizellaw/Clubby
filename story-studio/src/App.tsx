import { useRoute } from './ui/router';
import { ToastProvider } from './ui/Toast';
import { EditorScreen } from './editor/Editor';
import { HomeScreen, IdeasScreen, LibraryScreen, NewStoryScreen, PlayScreen, SampleScreen } from './screens/screens';

export function App() {
  const route = useRoute();
  let screen;
  switch (route.name) {
    case 'home':
      screen = <HomeScreen />;
      break;
    case 'library':
      screen = <LibraryScreen />;
      break;
    case 'new':
      screen = <NewStoryScreen />;
      break;
    case 'ideas':
      screen = <IdeasScreen />;
      break;
    case 'sample':
      screen = <SampleScreen />;
      break;
    case 'edit':
      screen = <EditorScreen key={route.id} id={route.id} />;
      break;
    case 'play':
      screen = <PlayScreen key={route.id} id={route.id} fromEditor={route.fromEditor} />;
      break;
  }
  return <ToastProvider>{screen}</ToastProvider>;
}
