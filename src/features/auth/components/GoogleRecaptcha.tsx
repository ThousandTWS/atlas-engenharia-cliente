import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Alert } from 'antd';

interface GrecaptchaClient {
  render: (
    container: HTMLElement,
    parameters: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
      theme?: 'light' | 'dark';
    },
  ) => number;
  reset: (widgetId?: number) => void;
  ready?: (callback: () => void) => void;
}

interface GrecaptchaGlobal extends Partial<GrecaptchaClient> {
  enterprise?: Partial<GrecaptchaClient>;
}

declare global {
  interface Window {
    grecaptcha?: GrecaptchaGlobal;
  }
}

export interface GoogleRecaptchaHandle {
  reset: () => void;
}

interface GoogleRecaptchaProps {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
  theme?: 'light' | 'dark';
}

const RECAPTCHA_SCRIPT_ID = 'prevent-google-recaptcha-script';
const RECAPTCHA_SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=pt-BR';

function resolveRecaptchaClient(): GrecaptchaClient | null {
  const { grecaptcha } = window;

  if (!grecaptcha) {
    return null;
  }

  if (typeof grecaptcha.render === 'function' && typeof grecaptcha.reset === 'function') {
    return {
      render: grecaptcha.render.bind(grecaptcha),
      reset: grecaptcha.reset.bind(grecaptcha),
      ready: typeof grecaptcha.ready === 'function' ? grecaptcha.ready.bind(grecaptcha) : undefined,
    };
  }

  const enterprise = grecaptcha.enterprise;
  if (enterprise && typeof enterprise.render === 'function' && typeof enterprise.reset === 'function') {
    return {
      render: enterprise.render.bind(enterprise),
      reset: enterprise.reset.bind(enterprise),
      ready: typeof enterprise.ready === 'function'
        ? enterprise.ready.bind(enterprise)
        : (typeof grecaptcha.ready === 'function' ? grecaptcha.ready.bind(grecaptcha) : undefined),
    };
  }

  return null;
}

function waitForRecaptchaClient(timeoutMs = 5000): Promise<GrecaptchaClient> {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      const client = resolveRecaptchaClient();
      if (client) {
        resolve(client);
        return;
      }

      if (Date.now() - start >= timeoutMs) {
        reject(new Error('API do reCAPTCHA carregada sem metodo render. Verifique a chave e o tipo configurado.'));
        return;
      }

      window.setTimeout(check, 50);
    };

    check();
  });
}

function loadRecaptchaScript(): Promise<GrecaptchaClient> {
  const existingClient = resolveRecaptchaClient();
  if (existingClient) {
    return Promise.resolve(existingClient);
  }

  return new Promise((resolve, reject) => {
    const resolveWhenReady = () => {
      waitForRecaptchaClient()
        .then(resolve)
        .catch(reject);
    };

    const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      resolveWhenReady();
      return;
    }

    const script = document.createElement('script');
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = RECAPTCHA_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolveWhenReady();
    script.onerror = () => reject(new Error('Falha ao carregar reCAPTCHA.'));
    document.body.appendChild(script);
  });
}

export const GoogleRecaptcha = forwardRef<GoogleRecaptchaHandle, GoogleRecaptchaProps>(
  ({ siteKey, onTokenChange, theme = 'dark' }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<number | null>(null);
    const recaptchaClientRef = useRef<GrecaptchaClient | null>(null);
    const [runtimeError, setRuntimeError] = useState<string | null>(null);
    const errorMessage = !siteKey ? 'reCAPTCHA nao configurado. Defina VITE_RECAPTCHA_SITE_KEY.' : runtimeError;

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (recaptchaClientRef.current && widgetIdRef.current !== null) {
          recaptchaClientRef.current.reset(widgetIdRef.current);
          onTokenChange(null);
        }
      },
    }));

    useEffect(() => {
      let isMounted = true;

      if (!siteKey) {
        return () => {
          isMounted = false;
        };
      }

      const renderWidget = async () => {
        try {
          const recaptchaClient = await loadRecaptchaScript();

          if (!isMounted || !containerRef.current) {
            return;
          }

          recaptchaClientRef.current = recaptchaClient;

          if (widgetIdRef.current !== null) {
            return;
          }

          widgetIdRef.current = recaptchaClient.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            callback: (token: string) => onTokenChange(token),
            'expired-callback': () => onTokenChange(null),
            'error-callback': () => onTokenChange(null),
          });

          setRuntimeError(null);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Falha ao iniciar reCAPTCHA.';
          setRuntimeError(message);
          onTokenChange(null);
        }
      };

      renderWidget();

      return () => {
        isMounted = false;
      };
    }, [onTokenChange, siteKey, theme]);

    return (
      <div className="prevent-recaptcha-wrapper">
        {errorMessage ? (
          <Alert type="warning" showIcon message={errorMessage} className="prevent-recaptcha-alert" />
        ) : (
          <div ref={containerRef} />
        )}
      </div>
    );
  },
);

GoogleRecaptcha.displayName = 'GoogleRecaptcha';
