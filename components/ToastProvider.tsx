'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '12px',
          fontWeight: '600',
          fontSize: '15px',
          padding: '14px 18px',
        },
      }}
    />
  );
}
