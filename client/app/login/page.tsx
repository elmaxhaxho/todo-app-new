import type { Metadata } from 'next';
import React from 'react';
import LoginForm from '../../components/LoginForm';

export const metadata: Metadata = {
  title: 'Log in - TODO',
};

export default function LoginPage(): React.ReactElement {
  return <LoginForm />;
}