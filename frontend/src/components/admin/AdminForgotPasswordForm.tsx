'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import {
  Alert,
  Button,
  Card,
  FieldError,
  Form,
  Input,
  Label,
  Spinner,
  TextField,
} from '@heroui/react';
import { useAppDispatch, useAppSelector } from '../../redux/admin/hooks';
import { requestPasswordReset } from '../../redux/admin/slices/authSlice';
import { ADMIN_ROUTES } from '../../lib/admin/api-paths';

type ForgotPasswordInputs = {
  email: string;
};

const validationSchema = Yup.object().shape({
  email: Yup.string().required('Email address is required'),
});

export function AdminForgotPasswordForm() {
  const dispatch = useAppDispatch();
  const { resetSent, status } = useAppSelector((s) => s.adminAuth);
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<ForgotPasswordInputs>({
    resolver: yupResolver(validationSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
  });

  const goToLogin = () => {
    router.push(ADMIN_ROUTES.login);
  };

  const onSubmit = handleSubmit(async ({ email }) => {
    setApiError(null);
    const result = await dispatch(requestPasswordReset(email));
    if (requestPasswordReset.fulfilled.match(result)) {
      reset();
      return;
    }
    setApiError((result.payload as string) || 'Error during processing request');
  });

  const loading = status === 'loading';

  return (
    <div className="admin-auth-shell flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg px-6 pb-8 pt-2 shadow-md sm:px-8">
        <Card.Header className="flex flex-col items-center gap-2 pb-2 pt-4">
          <Image
            src="/brand/approved/tabasamu-monogram.svg"
            alt="Tabasamu Sips"
            width={128}
            height={128}
            className="h-32 w-32"
            priority
          />
          <Card.Title className="text-3xl font-medium">Forgot Password</Card.Title>
          <Card.Description className="max-w-sm text-center">
            Enter your email and we will send you a link to reset your password
          </Card.Description>
        </Card.Header>

        <Card.Content className="px-1 pb-2 sm:px-2">
          {resetSent ? (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <Alert status="success" className="w-full">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Password Reset Successful</Alert.Title>
                  <Alert.Description>
                    If that address is registered, we sent reset instructions.
                  </Alert.Description>
                </Alert.Content>
              </Alert>
              <Button variant="ghost" onPress={goToLogin}>
                Back to Login
              </Button>
            </div>
          ) : (
            <>
              <Form className="flex flex-col gap-4 pb-4" onSubmit={onSubmit}>
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
                      <Input autoComplete="email" placeholder="Email address" />
                      {fieldState.error ? (
                        <FieldError>{fieldState.error.message}</FieldError>
                      ) : null}
                    </TextField>
                  )}
                />

                {apiError ? (
                  <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>Reset Password Error</Alert.Title>
                      <Alert.Description>{apiError}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                ) : null}

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
                      Submit
                    </>
                  )}
                </Button>
              </Form>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
                <span className="text-sm text-muted">Or select to go </span>
                <Button size="sm" type="button" variant="ghost" onPress={goToLogin}>
                  Back to Login
                </Button>
              </div>
            </>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
