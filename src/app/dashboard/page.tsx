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
import { parseMarkdown } from '@/lib/utils';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [acceptedPaper, setAcceptedPaper] = useState<any>(null);
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

  const handleAcceptPaper = (metadata: any) => {
    setAcceptedPaper(metadata);
    setIsUploadModalOpen(false);
  };

  const features = [
    {
      title: acceptedPaper 
        ? `Cool ${user?.user_metadata?.full_name?.split(' ')[0] || 'there'}, your paper is ready for analysis! 🚀` 
        : 'Upload Research Paper',
      description: acceptedPaper
        ? `"**${acceptedPaper.title}**" by ${acceptedPaper.authors?.[0]?.lastName}, ${acceptedPaper.authors?.[0]?.firstName} published in ${acceptedPaper.publicationYear} in ${acceptedPaper.journal} has been uploaded and is ready for analysis. Let's explore its insights!`
        : 'Upload your dental research papers in PDF or DOCX format for comprehensive analysis.',
      icon: Upload,
      action: acceptedPaper ? 'Change Paper' : 'Upload Paper',
      primary: !acceptedPaper,
      onClick: () => setIsUploadModalOpen(true),
      className: acceptedPaper
        ? 'bg-green-50 hover:shadow-lg transition-all duration-300 border-2 border-green-500'
        : 'bg-white hover:shadow-lg transition-all duration-300 border-2 border-periospot-blue-strong'
    },
    {
      title: 'Content Analysis',
      description: 'Start with a comprehensive evaluation of structure (using IMRAD framework), clarity (through readability metrics), and scientific writing quality. Our analysis ensures logical flow, proper section organization, and adherence to journal-specific guidelines. Receive detailed feedback on abstract quality, argument coherence, and technical terminology usage.',
      icon: FileText,
      action: acceptedPaper ? 'Start Analysis' : 'Analyze Content',
      onClick: () => {/* Add analysis logic */},
      className: acceptedPaper
        ? 'bg-white hover:shadow-lg transition-all duration-300 border-2 border-green-500 animate-pulse-subtle'
        : 'bg-white hover:shadow-lg transition-all duration-300 border border-gray-100 opacity-50',
      disabled: !acceptedPaper
    },
    {
      title: 'Methodology Review',
      description: 'Thoroughly assess research design, sampling methods, and data collection procedures. We identify potential flaws including selection bias, confounding variables, and methodology gaps. Analysis covers ethical compliance, protocol adherence, and alignment with peer-reviewed best practices in dental research.',
      icon: AlertTriangle,
      action: acceptedPaper ? 'Begin Review' : 'Review Method',
      onClick: () => {/* Add review logic */},
      className: acceptedPaper
        ? 'bg-white hover:shadow-lg transition-all duration-300 border border-green-300'
        : 'bg-white hover:shadow-lg transition-all duration-300 border border-gray-100 opacity-50',
      disabled: !acceptedPaper
    },
    {
      title: 'Statistical Analysis',
      description: 'Leverage advanced statistical techniques to validate data analysis methodologies and ensure robust outcomes. We examine effect sizes, power calculations, and assumption testing while identifying potential statistical errors. Receive visualizations of trends and comprehensive significance testing results.',
      icon: BarChart2,
      action: acceptedPaper ? 'Run Analysis' : 'View Analysis',
      onClick: () => {/* Add stats logic */},
      className: acceptedPaper
        ? 'bg-white hover:shadow-lg transition-all duration-300 border border-green-300'
        : 'bg-white hover:shadow-lg transition-all duration-300 border border-gray-100 opacity-50',
      disabled: !acceptedPaper
    },
    {
      title: 'Results Verification',
      description: 'Rigorously compare results and conclusions using statistical validation and data integrity checks. We identify unsupported claims, detect overstatements, and validate statistical significance interpretations. Get detailed insights on the strength of evidence supporting each major conclusion.',
      icon: CheckCircle,
      action: acceptedPaper ? 'Start Verification' : 'Verify Results',
      onClick: () => {/* Add verification logic */},
      className: acceptedPaper
        ? 'bg-white hover:shadow-lg transition-all duration-300 border border-green-300'
        : 'bg-white hover:shadow-lg transition-all duration-300 border border-gray-100 opacity-50',
      disabled: !acceptedPaper
    },
    {
      title: 'Reference Validation',
      description: 'Comprehensive verification of citation accuracy and contextual relevance. We cross-check against multiple style guides (APA, Vancouver), detect missing or incorrect citations, and flag potential citation manipulation. Analysis includes reference recency, journal impact factors, and citation network mapping.',
      icon: BookOpen,
      action: acceptedPaper ? 'Validate References' : 'Check References',
      onClick: () => {/* Add validation logic */},
      className: acceptedPaper
        ? 'bg-white hover:shadow-lg transition-all duration-300 border border-green-300'
        : 'bg-white hover:shadow-lg transition-all duration-300 border border-gray-100 opacity-50',
      disabled: !acceptedPaper
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
              className={`rounded-xl hover:shadow-xl transition-all duration-300 overflow-hidden ${feature.className}`}
            >
              <div className="p-6 space-y-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  feature.primary 
                    ? 'bg-periospot-blue-strong text-white' 
                    : acceptedPaper && index === 0
                      ? 'bg-green-100 text-green-600'
                      : acceptedPaper
                        ? 'bg-green-50 text-green-600'
                        : 'bg-gray-50 text-periospot-blue-strong'
                }`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-periospot-blue-strong">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed"
                     dangerouslySetInnerHTML={{ __html: parseMarkdown(feature.description) }}>
                  </p>
                </div>
                <button
                  onClick={feature.onClick}
                  disabled={feature.disabled}
                  className={`w-full inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${
                    feature.primary
                      ? 'text-white bg-periospot-blue-strong hover:bg-periospot-blue-mystic border-transparent'
                      : acceptedPaper && index === 0
                        ? 'text-green-700 bg-green-100 hover:bg-green-200 border-green-500'
                        : acceptedPaper
                          ? 'text-white bg-periospot-blue-strong hover:bg-periospot-blue-mystic border-transparent'
                          : 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
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
        onAccept={handleAcceptPaper}
      />
    </div>
  );
} 