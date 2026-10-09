import type { Metadata } from 'next';
import React from 'react';
import SignupForm from '../../components/SignupForm';

export const metadata: Metadata = {
  title: 'Log in - TODO',
};

export default function SignupPage(): React.ReactElement {
  return <SignupForm />;
}