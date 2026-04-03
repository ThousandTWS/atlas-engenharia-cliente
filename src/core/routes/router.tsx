import { createBrowserRouter } from 'react-router-dom';
import App from '../../App';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { HomePage } from '../../features/home/pages/HomePage';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage';
import { ForgotPasswordPage } from '../../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage';
import { ObrasPage } from '../../features/obras/pages/ObrasPage';
import { ObraFormPage } from '../../features/obras/pages/ObraFormPage';
import { ProcessosAdmPage } from '../../features/processos-adm/pages/ProcessosAdmPage';
import { ProcessoAdmFormPage } from '../../features/processos-adm/pages/ProcessoAdmFormPage';
import { CustosIndiretosPage } from '../../features/custos-indiretos/pages/CustosIndiretosPage';
import { CustoIndiretoFormPage } from '../../features/custos-indiretos/pages/CustoIndiretoFormPage';
import { LancamentosPage } from '../../features/lancamentos/pages/LancamentosPage';
import { LancamentoFormPage } from '../../features/lancamentos/pages/LancamentoFormPage';
import { CLCBPage } from '../../features/clcb/pages/CLCBPage';
import { CLCBFormPage } from '../../features/clcb/pages/CLCBFormPage';
import { AVCBPage } from '../../features/avcb/pages/AVCBPage';
import { AVCBFormPage } from '../../features/avcb/pages/AVCBFormPage';
import { ProfilePage } from '../../features/profile/pages/ProfilePage';
import { NotFoundPage } from '../../shared/components/NotFoundPage';
import {GestaoClientesPage} from "../../features/gestao-de-clientes/page/GestaoDeClientes.tsx";
import { ClienteFormPage } from "../../features/gestao-de-clientes/page/ClienteFormPage.tsx";
import {GestaoAdsPage} from "../../features/gestao-ads/pages/GestaoAdsPage.tsx";
import { GeminiChatPage } from '../../features/gestao-ads/pages/GeminiChatPage';
import { ServicesTrackingPage } from '../../features/services/pages/ServicesTrackingPage';
import { CadastrosHubPage } from '../../features/cadastros/pages/CadastrosHubPage';
import { BudgetRegisterPage } from '../../features/cadastros/pages/BudgetRegisterPage';
import { ProvidersRegisterPage } from '../../features/cadastros/pages/ProvidersRegisterPage';
import { ServiceClientRegisterPage } from '../../features/cadastros/pages/ServiceClientRegisterPage';
import { NotificationsPage } from '../../features/notifications/pages/NotificationsPage';

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
        path: 'acompanhamento-servicos',
        element: <ServicesTrackingPage />,
      },
      {
        path: 'cadastros',
        element: <CadastrosHubPage />,
      },
      {
        path: 'cadastros/orcamentos',
        element: <BudgetRegisterPage />,
      },
      {
        path: 'cadastros/servicos',
        element: <ServiceClientRegisterPage />,
      },
      {
        path: 'cadastros/prestadores',
        element: <ProvidersRegisterPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'notificacoes',
        element: <NotificationsPage />,
      },
      {
        path: 'obras',
        element: <ObrasPage />,
      },
      {
        path: 'obras/novo',
        element: <ObraFormPage />,
      },
      {
        path: 'obras/:id/editar',
        element: <ObraFormPage />,
      },
      {
        path: 'processos',
        element: <ProcessosAdmPage />,
      },
      {
        path: 'processos/novo',
        element: <ProcessoAdmFormPage />,
      },
      {
        path: 'processos/:id/editar',
        element: <ProcessoAdmFormPage />,
      },
      {
        path: 'clcb',
        element: <CLCBPage />,
      },
      {
        path: 'clcb/novo',
        element: <CLCBFormPage />,
      },
      {
        path: 'clcb/:id/editar',
        element: <CLCBFormPage />,
      },
      {
        path: 'avcb',
        element: <AVCBPage />,
      },
      {
        path: 'avcb/novo',
        element: <AVCBFormPage />,
      },
      {
        path: 'avcb/:id/editar',
        element: <AVCBFormPage />,
      },
      {
        path: 'custos-indiretos',
        element: <CustosIndiretosPage />,
      },
      {
        path: 'custos-indiretos/novo',
        element: <CustoIndiretoFormPage />,
      },
      {
        path: 'custos-indiretos/:id/editar',
        element: <CustoIndiretoFormPage />,
      },
      {
        path: 'lancamentos',
        element: <LancamentosPage />,
      },
      {
        path: 'lancamentos/novo',
        element: <LancamentoFormPage />,
      },
      {
        path: 'lancamentos/:id/editar',
        element: <LancamentoFormPage />,
      },
      {
        path: 'gestao-de-clientes',
        element: <GestaoClientesPage />,
      },
      {
        path: 'gestao-de-clientes/novo',
        element: <ClienteFormPage />,
      },
      {
        path: 'gestao-de-clientes/:id/editar',
        element: <ClienteFormPage />,
      },
      {
        path: 'gestao-ads',
        element: <GestaoAdsPage />,
      },
      {
        path: 'gestao-ads/chat',
        element: <GeminiChatPage />,
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
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ]
  },
]);
