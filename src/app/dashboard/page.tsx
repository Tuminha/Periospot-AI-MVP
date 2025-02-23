'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { 
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  LogOut,
  BarChart2
} from 'lucide-react';
import UploadModal from '@/components/UploadModal';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const features = [
    {
      title: 'Upload Research Paper',
      description: 'Upload your dental research papers in PDF or DOCX format for comprehensive analysis.',
      icon: Upload,
      action: 'Upload Paper',
      primary: true,
      onClick: () => setIsUploadModalOpen(true),
      className: 'bg-white hover:shadow-lg transition-all duration-300 border-2 border-periospot-blue-strong'
    },
    {
      title: 'Statistical Analysis: Uncover Insights with Precision',
      description: 'Leverage advanced statistical techniques to analyze research data, validate methodologies, and ensure robust, reliable outcomes. Visualize trends and test significance for actionable insights.',
      icon: BarChart2,
      action: 'View Analysis',
      className: 'bg-white hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-periospot-blue-strong'
    },
    {
      title: 'Reference Validation',
      description: 'Check for accurate interpretation and citation of referenced works.',
      icon: BookOpen,
      action: 'Check References',
      className: 'bg-white hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-periospot-blue-strong'
    },
    {
      title: 'Results Verification',
      description: 'Identify discrepancies between results and conclusions.',
      icon: CheckCircle,
      action: 'Verify Results',
      className: 'bg-white hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-periospot-blue-strong'
    },
    {
      title: 'Methodology Review',
      description: 'Evaluate research methodology and identify potential flaws.',
      icon: AlertTriangle,
      action: 'Review Method',
      className: 'bg-white hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-periospot-blue-strong'
    },
    {
      title: 'Content Analysis',
      description: 'Analyze paper structure, clarity, and scientific writing quality.',
      icon: FileText,
      action: 'Analyze Content',
      className: 'bg-white hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-periospot-blue-strong'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-periospot-blue-strong">
                Welcome, {user?.user_metadata?.full_name || 'User'}
              </h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-periospot-blue-strong hover:bg-periospot-blue-mystic focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-periospot-blue-strong"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`bg-white rounded-xl hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-periospot-blue-strong overflow-hidden ${
                feature.primary ? 'border-2 border-periospot-blue-strong' : ''
              }`}
            >
              <div className="p-6 space-y-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  feature.primary ? 'bg-periospot-blue-strong text-white' : 'bg-gray-50 text-periospot-blue-strong'
                }`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-periospot-blue-strong">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                <button
                  onClick={feature.onClick}
                  className={`w-full inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${
                    feature.primary
                      ? 'text-white bg-periospot-blue-strong hover:bg-periospot-blue-mystic border-transparent'
                      : 'text-periospot-blue-strong bg-white border-periospot-blue-strong hover:bg-gray-50'
                  }`}
                >
                  {feature.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
} 