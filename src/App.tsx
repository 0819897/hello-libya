import { Navigate, Route, Routes } from 'react-router-dom';
import { ProgressProvider, useProgress } from './state/ProgressContext';
import { getLastGrade } from './state/progress';
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
import TeacherMode from './screens/TeacherMode';
import { ErrorBoundary } from './ui/ErrorBoundary';

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
      <Route path="/certificate/:gradeId" element={<Certificate />} />
      <Route path="/dictionary" element={<Dictionary />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/teacher" element={<TeacherMode />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<Navigate to={Object.keys(progress.lessons).length ? `/grade/${getLastGrade(progress)}` : '/grades'} replace />} />
    </Routes>
  );
}

export default function App() {
  return <ErrorBoundary><ProgressProvider><AppRoutes /></ProgressProvider></ErrorBoundary>;
}
