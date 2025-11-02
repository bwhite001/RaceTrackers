import { Navigate, useLocation } from 'react-router-dom';
import useNavigationStore from '../store/navigationStore';

const ProtectedRoute = ({ children, moduleType }) => {
  const location = useLocation();
  const { canNavigateTo, currentModule, operationStatus } = useNavigationStore();

  // Always allow navigation to home
  if (location.pathname === '/') {
    return children;
  }

  // Check if navigation to this module is allowed
  if (!canNavigateTo(moduleType)) {
    // If operation is in progress, show warning and redirect to current module
    if (operationStatus === 'in-progress') {
      return (
        <Navigate 
          to={`/${currentModule}`} 
          replace={true} 
          state={{ 
            warning: 'Cannot navigate away during active operation',
            from: location.pathname 
          }} 
        />
      );
    }
    
    // If no operation but trying to access unauthorized module, redirect to home
    return <Navigate to="/" replace={true} />;
  }

  return children;
};

export default ProtectedRoute;
