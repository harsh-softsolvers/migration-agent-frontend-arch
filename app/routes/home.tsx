import { useEffect } from 'react';
import type { Route } from "./+types/home";
import { ExcelUpload } from "../components/ExcelUpload";
import { useWorkflowStore } from '~/store/workflowSlice';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Excel Migration Tool" },
    { name: "description", content: "Upload and migrate Excel documents" },
  ];
}

export default function Home() {
  const workflowStore = useWorkflowStore();

  // Hide workflow progress on home page
  useEffect(() => {
    workflowStore.setShowProgress(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Excel Migration Tool
          </h1>
          <p className="text-gray-600">
            Upload your Excel document to get started with the migration process
          </p>
        </div>
        <ExcelUpload />
      </div>
    </div>
  );
}
