import { createBrowserRouter } from 'react-router-dom';
import App from '../../App';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { HomePage } from '../../features/home/pages/HomePage';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '../../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage';
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage';
import { ObrasPage } from '../../features/obras/pages/ObrasPage';
import { ProcessosAdmPage } from '../../features/processos-adm/pages/ProcessosAdmPage';
import { CustosIndiretosPage } from '../../features/custos-indiretos/pages/CustosIndiretosPage';
import { LancamentosPage } from '../../features/lancamentos/pages/LancamentosPage';
import { CLCBPage } from '../../features/clcb/pages/CLCBPage';
import { AVCBPage } from '../../features/avcb/pages/AVCBPage';
import { ProfilePage } from '../../features/profile/pages/ProfilePage';
import { NotFoundPage } from '../../shared/components/NotFoundPage';
import {GestaoClientesPage} from "../../features/gestao-de-clientes/page/GestaoDeClientes.tsx";
import {GestaoAdsPage} from "../../features/gestao-ads/pages/GestaoAdsPage.tsx";

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'obras',
        element: <ObrasPage />,
      },
      {
        path: 'processos',
        element: <ProcessosAdmPage />,
      },
      {
        path: 'clcb',
        element: <CLCBPage />,
      },
      {
        path: 'avcb',
        element: <AVCBPage />,
      },
      {
        path: 'custos-indiretos',
        element: <CustosIndiretosPage />,
      },
      {
        path: 'lancamentos',
        element: <LancamentosPage />,
      },
      {
        path: 'gestao-de-clientes',
        element: <GestaoClientesPage />,
      },
      {
        path: 'gestao-ads',
        element: <GestaoAdsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: 'auth',
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
    ]
  },
]);
