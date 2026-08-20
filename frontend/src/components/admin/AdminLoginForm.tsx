'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  FieldError,
  Form,
  Input,
  Label,
  Spinner,
  TextField,
  Toast,
} from '@heroui/react';
import { useAppDispatch, useAppSelector } from '../../redux/admin/hooks';
import { clearError, loginStaff } from '../../redux/admin/slices/authSlice';
import { adminAuthClient } from '../../lib/admin/auth-client';
import { clearStaleAuth, restoreStoredSession } from '../../lib/admin/auth-session';
import { ADMIN_ROUTES } from '../../lib/admin/api-paths';

const SESSION_CHECK_TIMEOUT_MS = 8_000;

type LoginInputs = {
  email: string;
  password: string;
};

const validationSchema = Yup.object().shape({
  email: Yup.string().required('Email address is required'),
  password: Yup.string().required('Password is required'),
});

export function AdminLoginForm() {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((s) => s.adminAuth);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') ?? ADMIN_ROUTES.dashboard;

  const [pageLoader, setPageLoader] = useState(true);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [rememberMe, setRememberMe] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<LoginInputs>({
    resolver: yupResolver(validationSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!adminAuthClient.getAuthToken()) {
        setPageLoader(false);
        return;
      }

      setPageLoader(true);
      setLoadingText('Checking session...');

      try {
        const session = await Promise.race([
          restoreStoredSession(),
          new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), SESSION_CHECK_TIMEOUT_MS);
          }),
        ]);

        if (cancelled) return;

        if (session) {
          router.replace(returnUrl);
          return;
        }

        clearStaleAuth();
      } catch {
        clearStaleAuth();
      } finally {
        if (!cancelled) {
          setPageLoader(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [returnUrl, router]);

  const onSubmit = handleSubmit(async ({ email, password }) => {
    dispatch(clearError());
    clearStaleAuth();
    setApiError(null);
    const result = await dispatch(loginStaff({ email, password }));
    if (loginStaff.fulfilled.match(result)) {
      router.push(returnUrl);
      return;
    }
    const message =
      (result.payload as string) || 'Sign in failed. Check your email and password.';
    setApiError(message);
    Toast.toast.danger('Login Error', { description: message });
  });

  const goToForgotPassword = () => {
    router.push(ADMIN_ROUTES.forgotPassword);
  };

  const loading = status === 'loading';

  return (
    <div className="admin-auth-shell flex min-h-screen items-center justify-center p-4">
      {pageLoader && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/70">
          <p className="text-center text-3xl font-medium text-white md:text-5xl">{loadingText}</p>
          <Spinner size="lg" />
        </div>
      )}

      <Card className="w-full max-w-lg px-4 pb-8 pt-2 shadow-md sm:px-8 rounded-lg">
        <Card.Header className="flex flex-col items-center gap-1.5 pb-3 pt-3">
          <Image
            src="/brand/approved/tabasamu-monogram.svg"
            alt="Tabasamu Sips"
            width={128}
            height={128}
            className="h-24 w-24"
            priority
          />
          <Card.Title className="text-3xl font-medium text-[#0B8CE6]">Sign in</Card.Title>
          <Card.Description className="text-base">Tabasamu Admin</Card.Description>
        </Card.Header>

        <Card.Content className="px-1 pb-2 sm:px-2">
          <Form className="flex flex-col gap-4 pb-4" onSubmit={onSubmit}>
            {apiError ? (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Login Error</Alert.Title>
                  <Alert.Description>{apiError}</Alert.Description>
                </Alert.Content>
              </Alert>
            ) : null}

            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  fullWidth
                  isRequired
                  isInvalid={!!fieldState.error}
                  name={field.name}
                  type="email"
                  validationBehavior="aria"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                >
                  <Label>Email</Label>
                  <Input autoComplete="username" placeholder="Email address" />
                  {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                </TextField>
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  fullWidth
                  isRequired
                  isInvalid={!!fieldState.error}
                  name={field.name}
                  type="password"
                  validationBehavior="aria"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                >
                  <Label>Password</Label>
                  <Input autoComplete="current-password" placeholder="********" />
                  {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
                </TextField>
              )}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Checkbox
                isSelected={rememberMe}
                name="rememberme"
                onChange={setRememberMe}
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  Remember me
                </Checkbox.Content>
              </Checkbox>
              <Button type="button" variant="ghost" onPress={goToForgotPassword}>
                Forgot Password?
              </Button>
            </div>

            <Button
              fullWidth
              isPending={loading}
              size="lg"
              type="submit"
              className="bg-teal-700 uppercase tracking-wide hover:bg-teal-800"
            >
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  Sign In
                </>
              )}
            </Button>
          </Form>
        </Card.Content>
      </Card>
    </div>
  );
}
