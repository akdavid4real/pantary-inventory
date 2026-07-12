import { AppRoutes } from "./routing/AppRoutes";
import { useAppNavigation } from "./routing/useAppNavigation";
import "./styles/dashboard.css";
import "./styles/screen-layout.css";

export default function App() {
  const { page, navigate } = useAppNavigation();

  return <AppRoutes page={page} onNavigate={navigate} />;
}
