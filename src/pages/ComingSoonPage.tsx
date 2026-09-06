import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';

export const ComingSoonPage: React.FC<{ moduleName: string }> = ({ moduleName }) => {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader title={moduleName} subtitle="Module under development" />
      <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Coming Soon</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          The {moduleName} module is currently being built and will be available in the next deployment phase.
        </p>
      </Card>
    </div>
  );
};
