import { Navigate, Route, Routes } from 'react-router-dom';
import { ProgressProvider, useProgress } from './state/ProgressContext';
import LessonPlayer from './screens/LessonPlayer';
import Welcome from './screens/Welcome';
import GradeMap from './screens/GradeMap';
import UnitPath from './screens/UnitPath';
import Profile from './screens/Profile';
import Dictionary from './screens/Dictionary';
import Settings from './screens/Settings';
import About from './screens/About';
import BigChallenge from './screens/BigChallenge';
import Certificate from './screens/Certificate';

function AppRoutes() {
  const { progress } = useProgress();
  if (!progress.name) {
    return (
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Welcome />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/grades" element={<GradeMap />} />
      <Route path="/grade/:gradeId" element={<UnitPath />} />
      <Route path="/lesson/:gradeId/:lessonId" element={<LessonPlayer />} />
      <Route path="/big/:gradeId" element={<BigChallenge />} />
      <Route path="/certificate" element={<Certificate />} />
      <Route path="/dictionary" element={<Dictionary />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<Navigate to={Object.keys(progress.lessons).length ? '/grade/grade4' : '/grades'} replace />} />
    </Routes>
  );
}

export default function App() {
  return <ProgressProvider><AppRoutes /></ProgressProvider>;
}
