import { Navigate } from 'react-router-dom';

const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;

export { default as TournamentPublicPage } from './TournamentPublicPage';
