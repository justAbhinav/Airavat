'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Brain,
  Workflow,
  Blocks,
  Lock,
  Eye,
  Users,
  Zap,
  ChevronRight,
  Check,
  Info,
  FileText,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeContext, useTheme, getThemeClasses } from '@/hooks/use-theme';
import { ZKProofDemo } from '@/components/zk-proof-demo';
import { BlockchainLogViewer } from '@/components/blockchain-log-viewer';
import { useRouter } from 'next/navigation';

function AiravatContent() {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const router = useRouter();

  const [consentSettings, setConsentSettings] = useState({
    transactions: 'Minimal',
    accountDetails: 'Minimal',
    personalInfo: 'Minimal',
    timeLimit: 30,
    purposes: {
      loanProcessing: false,
      fraudDetection: false,
      creditScoring: false,
      marketing: false,
    },
    additionalNotes: '',
  });

  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [consentSaved, setConsentSaved] = useState(false);

  // PDF check states
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [pdfCheckData, setPdfCheckData] = useState({
    userID: '',
    email: '',
    token: '',
  });
  const [userFiles, setUserFiles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load consent preferences on component mount
  useEffect(() => {
    const loadConsentPreferences = async () => {
      try {
        const response = await fetch('/api/consent-preferences');
        if (response.ok) {
          const data = await response.json();
          setConsentSettings({
            transactions: data.transactions || 'Minimal',
            accountDetails: data.accountDetails || 'Minimal',
            personalInfo: data.personalInfo || 'Minimal',
            timeLimit: data.timeLimit || 30,
            purposes: data.purposes || {
              loanProcessing: false,
              fraudDetection: false,
              creditScoring: false,
              marketing: false,
            },
            additionalNotes: data.additionalNotes || '',
          });
        }
      } catch (error) {
        console.error('Error loading consent preferences:', error);
      }
    };

    loadConsentPreferences();
  }, []);

  const features = [
    {
      id: 'vra',
      title: 'VRA - Verification and Risk Assessment Agent',
      description:
        'AI-driven risk scoring to block risky data requests and protect sensitive information',
      icon: Shield,
      color: 'from-red-500 to-pink-500',
    },
    {
      id: 'rba',
      title: 'RBA - Request Builder Agent',
      description:
        'Minimizes shared data using ML-driven decisions for optimal privacy',
      icon: Brain,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'tma',
      title: 'TMA - Task Master Agent',
      description:
        'Orchestrates secure data workflows with zero-trust verification',
      icon: Workflow,
      color: 'from-purple-500 to-indigo-500',
    },
    {
      id: 'bba',
      title: 'BBA - Blockchain Based Agent',
      description:
        'Logs all actions on blockchain for complete transparency and auditability',
      icon: Blocks,
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'zkba',
      title: 'ZKBA - Zero-Knowledge Based Agent',
      description:
        'This agent builds zero-knowledge protocols (ZKPs) for requests requiring privacy-preserving computation. It receives requests from the TMA and returns the necessary details to initiate a ZKP endpoint.',
      icon: Lock,
      color: 'from-orange-500 to-yellow-500',
    },
    {
      id: 'dra',
      title: 'DRA - Data Retrieval Agent',
      description:
        'This agent manages data lookup and retrieval securely, abstracting endpoints. It handles two request types: data lookup from the RBA (locating data without responding) and data fetch from the TMA (moving data to the Time-Lock Server with a timer)',
      icon: Blocks,
      color: 'from-teal-500 to-cyan-500',
    },
    {
      id: 'tlsa',
      title: 'TLSA - Time Lock Server Agent',
      description:
        'This agent guards the Time-Lock Server, performing secondary risk assessments and verifications (e.g., IP checks) on access requests. It denies requests if the risk exceeds the original assessment, acting as a vault security guard.',
      icon: Lock,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      id: 'tls',
      title: 'TLS - Time Lock Server',
      description:
        'This server stores shared data in a timed lock, allowing retrieval only until the timer expires, after which the data is deleted',
      icon: Brain,
      color: 'from-emerald-500 to-green-500',
    },
    {
      id: 'oca',
      title: 'OCA - Orchestration Control Agent',
      description:
        'Coordinates and manages the overall workflow between all agents, ensuring proper sequencing and error handling',
      icon: Workflow,
      color: 'from-violet-500 to-purple-500',
    },
  ];

  const agents = [
    { id: 'vra', name: 'VRA', role: 'Risk Assessment', x: 15, y: 20 },
    { id: 'rba', name: 'RBA', role: 'Request Processing', x: 35, y: 15 },
    { id: 'tma', name: 'TMA', role: 'Task Orchestration', x: 55, y: 20 },
    { id: 'dra', name: 'DRA', role: 'Data Retrieval', x: 75, y: 15 },
    { id: 'tlsa', name: 'TLSA', role: 'Time Lock Security', x: 85, y: 35 },
    { id: 'bba', name: 'BBA', role: 'Blockchain Logging', x: 15, y: 60 },
    { id: 'zkba', name: 'ZKBA', role: 'Zero-Knowledge Proofs', x: 35, y: 70 },
    { id: 'tls', name: 'TLS', role: 'Time Lock Server', x: 55, y: 65 },
    { id: 'oca', name: 'OCA', role: 'Orchestration Control', x: 75, y: 60 },
  ];

  const getDataLevelText = (level: string) => {
    return level || 'Minimal';
  };

  const getDataLevelColor = (level: string) => {
    const colorMap = {
      Minimal: theme === 'light' ? 'text-green-600' : 'text-green-500',
      Moderate: theme === 'light' ? 'text-yellow-600' : 'text-yellow-500',
      Full: theme === 'light' ? 'text-red-600' : 'text-red-500',
    };
    return (
      colorMap[level as keyof typeof colorMap] ||
      (theme === 'light' ? 'text-green-600' : 'text-green-500')
    );
  };

  // Helper functions to convert between enum strings and slider values
  const enumToSliderValue = (level: string): number => {
    const levelMap = { Minimal: 1, Moderate: 2, Full: 3 };
    return levelMap[level as keyof typeof levelMap] || 1;
  };

  const sliderValueToEnum = (value: number): string => {
    const enumMap = { 1: 'Minimal', 2: 'Moderate', 3: 'Full' };
    return enumMap[value as keyof typeof enumMap] || 'Minimal';
  };

  const handleSaveConsent = async () => {
    try {
      const response = await fetch('/api/consent-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consentSettings),
      });

      if (response.ok) {
        setConsentSaved(true);
        setTimeout(() => setConsentSaved(false), 3000);
      } else {
        console.error('Failed to save consent preferences');
      }
    } catch (error) {
      console.error('Error saving consent preferences:', error);
    }
  };

  // Hash function for userID
  const hashUserID = async (userID: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(userID);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  // Handle PDF check form submission
  const handlePdfSubmit = async () => {
    if (!pdfCheckData.userID || !pdfCheckData.email || !pdfCheckData.token) {
      alert('Please fill in all required fields: UserID, Email, and Token');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate userHash from userID
      const hashedUserID = await hashUserID(pdfCheckData.userID);

      // Create FormData - only send userHash, not userID
      const formData = new FormData();
      formData.append('userHash', hashedUserID);
      formData.append('email', pdfCheckData.email);
      formData.append('token', pdfCheckData.token);
      const jwtToken = 'eyJhbGciOiJIUzI1NiJ9.e30.NO3TAh5-AR98dkx9UIgBDE-u4hZs4Rh7F0qu8iRfob8';

      // Make API call to your real endpoint with required header
      const response = await fetch(
        'https://amd-varying-screening-janet.trycloudflare.com/webhook/retrieve_file',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'application': 'bank_application_data_call_airavat',
          },
          body: formData,
        }
      );

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle binary file response
      const fileBlob = await response.blob();
      console.log('Received file blob:', fileBlob);

      // Extract filename from Content-Disposition header
      let filename = 'download-file';
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      if (fileBlob && fileBlob.size > 0) {
        setUserFiles([{ blob: fileBlob, name: filename }]);
      } else {
        setUserFiles([]);
        alert('File access denied or not found');
      }
    } catch (error) {
      console.error('Error checking files:', error);

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert(
          'Network error: Unable to reach the API. Please check your connection or try again later.'
        );
      } else {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        alert('An error occurred while checking files: ' + errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle opening PDF check dialog
  const handleOpenPdfCheck = () => {
    setPdfCheckData({
      userID: '',
      email: '',
      token: '',
    });
    setUserFiles([]);
    setIsPdfDialogOpen(true);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if API call fails
      router.push('/login');
    }
  };

  return (
    <div
      className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} overflow-hidden transition-colors duration-500`}
    >
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div
          className={`absolute inset-0 ${themeClasses.gradientOverlay} transition-colors duration-500`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 ${themeClasses.particleColor} rounded-full animate-pulse transition-colors duration-500`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header with Logout */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className={`${themeClasses.cardBg} ${themeClasses.cardBorder} hover:bg-red-500 hover:text-white transition-all duration-300`}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Airavat
              </h1>
              <p className="text-2xl md:text-3xl font-semibold mb-4 text-gray-300">
                Your Data, Your Control, Our Protection
              </p>
              <p
                className={`text-lg md:text-xl ${themeClasses.mutedText} max-w-3xl mx-auto mb-8 transition-colors duration-300`}
              >
                Revolutionary multi-agent architecture securing fintech
                ecosystems with Agentic AI driven privacy, blockchain
                transparency, zero-knowledge proofs and many more...
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105"
                onClick={() =>
                  document
                    .getElementById('consent-section')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Try Demo <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className={`border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-gray-900 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 ${
                  theme === 'light' ? 'bg-white/50' : 'bg-transparent'
                }`}
                onClick={() =>
                  document
                    .getElementById('features-section')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Explore Features
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div
                className={`${themeClasses.cardBg} backdrop-blur-sm rounded-xl p-6 border ${themeClasses.cardBorder} transition-colors duration-300`}
              >
                <Zap className="w-8 h-8 text-yellow-400 mb-3 mx-auto" />
                <h3 className={`font-semibold mb-2 ${themeClasses.text}`}>
                  AI-Driven Security
                </h3>
                <p className={`${themeClasses.mutedText} text-sm`}>
                  Advanced Agentic AI algorithms protect your sensitive data
                </p>
              </div>
              <div
                className={`${themeClasses.cardBg} backdrop-blur-sm rounded-xl p-6 border ${themeClasses.cardBorder} transition-colors duration-300`}
              >
                <Eye className="w-8 h-8 text-purple-400 mb-3 mx-auto" />
                <h3 className={`font-semibold mb-2 ${themeClasses.text}`}>
                  Privacy-First Design
                </h3>
                <p className={`${themeClasses.mutedText} text-sm`}>
                  Zero-knowledge proofs ensure data privacy
                </p>
              </div>
              <div
                className={`${themeClasses.cardBg} backdrop-blur-sm rounded-xl p-6 border ${themeClasses.cardBorder} transition-colors duration-300`}
              >
                <Blocks className="w-8 h-8 text-green-400 mb-3 mx-auto" />
                <h3 className={`font-semibold mb-2 ${themeClasses.text}`}>
                  Blockchain Transparency
                </h3>
                <p className={`${themeClasses.mutedText} text-sm`}>
                  Immutable audit trails for complete trust
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features-section" className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Multi-Agentic AI Architecture
              </h2>
              <p
                className={`text-xl ${themeClasses.mutedText} max-w-3xl mx-auto transition-colors duration-300`}
              >
                Nine specialized AI agents working in harmony to protect your
                fintech data
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card
                  key={feature.id}
                  className={`${themeClasses.cardBg} backdrop-blur-sm border ${themeClasses.cardBorder} hover:border-gray-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group`}
                >
                  <CardHeader>
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle
                      className={`text-xl font-bold ${themeClasses.text} group-hover:text-cyan-400 transition-colors`}
                    >
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription
                      className={`${themeClasses.mutedText} text-base leading-relaxed`}
                    >
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Zero-Knowledge Proofs Demo Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                How Zero-Knowledge Proofs Work ?
              </h2>
              <p className="text-2xl font-semibold mb-4 text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text">
                Verify without revealing!!! Awesome right ?
              </p>
              <p
                className={`text-xl ${themeClasses.mutedText} max-w-3xl mx-auto transition-colors duration-300`}
              >
                Prove you have sufficient funds without revealing your actual
                balance. Experience the magic of cryptographic privacy.
              </p>
            </div>

            <ZKProofDemo theme={theme} />
          </div>
        </section>

        {/* Blockchain Transparency Section */}
        <section
          className={`py-20 px-4 ${themeClasses.sectionBg} transition-colors duration-300`}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Blockchain Transparency
              </h2>
              <p className="text-2xl font-semibold mb-4 text-transparent bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text">
                Every data access is recorded forever!
              </p>
              <p
                className={`text-xl ${themeClasses.mutedText} max-w-3xl mx-auto transition-colors duration-300`}
              >
                Immutable audit trail of all data sharing activities. See
                exactly who accessed what data and when, ensuring complete
                transparency and accountability.
              </p>
            </div>

            <BlockchainLogViewer theme={theme} />
          </div>
        </section>

        {/* Consent Management Interface */}
        <section
          id="consent-section"
          className={`py-20 px-4 ${themeClasses.sectionBg} transition-colors duration-300`}
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Consent Management
              </h2>
              <p
                className={`text-xl ${themeClasses.mutedText} max-w-3xl mx-auto transition-colors duration-300`}
              >
                Take control of your data sharing preferences with granular
                privacy controls
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Controls */}
              <div className="space-y-8">
                <Card
                  className={`${themeClasses.cardBg} backdrop-blur-sm border ${themeClasses.cardBorder} transition-colors duration-300`}
                >
                  <CardHeader>
                    <CardTitle
                      className={`text-2xl font-bold ${themeClasses.text} flex items-center gap-2`}
                    >
                      <Shield className="w-6 h-6 text-cyan-400" />
                      Data Sharing Levels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Transaction Data */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className={`${themeClasses.text} font-medium`}>
                          Transaction History
                        </label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info
                              className={`w-4 h-4 ${themeClasses.mutedText}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Controls access to your transaction records and
                              spending patterns
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Slider
                        value={[
                          enumToSliderValue(consentSettings.transactions),
                        ]}
                        onValueChange={(value) =>
                          setConsentSettings((prev) => ({
                            ...prev,
                            transactions: sliderValueToEnum(value[0]),
                          }))
                        }
                        max={3}
                        step={1}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm">
                        <span className={themeClasses.mutedText}>None</span>
                        <span
                          className={`font-medium ${getDataLevelColor(
                            consentSettings.transactions
                          )}`}
                        >
                          {getDataLevelText(consentSettings.transactions)}
                        </span>
                        <span className={themeClasses.mutedText}>Full</span>
                      </div>
                    </div>

                    {/* Account Details */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className={`${themeClasses.text} font-medium`}>
                          Account Details
                        </label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info
                              className={`w-4 h-4 ${themeClasses.mutedText}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Controls access to account balances and financial
                              summaries
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Slider
                        value={[
                          enumToSliderValue(consentSettings.accountDetails),
                        ]}
                        onValueChange={(value) =>
                          setConsentSettings((prev) => ({
                            ...prev,
                            accountDetails: sliderValueToEnum(value[0]),
                          }))
                        }
                        max={3}
                        step={1}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm">
                        <span className={themeClasses.mutedText}>None</span>
                        <span
                          className={`font-medium ${getDataLevelColor(
                            consentSettings.accountDetails
                          )}`}
                        >
                          {getDataLevelText(consentSettings.accountDetails)}
                        </span>
                        <span className={themeClasses.mutedText}>Full</span>
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className={`${themeClasses.text} font-medium`}>
                          Personal Information
                        </label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info
                              className={`w-4 h-4 ${themeClasses.mutedText}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Controls access to personal details and contact
                              information
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Slider
                        value={[
                          enumToSliderValue(consentSettings.personalInfo),
                        ]}
                        onValueChange={(value) =>
                          setConsentSettings((prev) => ({
                            ...prev,
                            personalInfo: sliderValueToEnum(value[0]),
                          }))
                        }
                        max={3}
                        step={1}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm">
                        <span className={themeClasses.mutedText}>None</span>
                        <span
                          className={`font-medium ${getDataLevelColor(
                            consentSettings.personalInfo
                          )}`}
                        >
                          {getDataLevelText(consentSettings.personalInfo)}
                        </span>
                        <span className={themeClasses.mutedText}>Full</span>
                      </div>
                    </div>

                    {/* Time Limit */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className={`${themeClasses.text} font-medium`}>
                          Data Access Duration
                        </label>
                        <Badge
                          variant="secondary"
                          className="bg-purple-500/20 text-purple-300"
                        >
                          {consentSettings.timeLimit} days
                        </Badge>
                      </div>
                      <Slider
                        value={[consentSettings.timeLimit]}
                        onValueChange={(value) =>
                          setConsentSettings((prev) => ({
                            ...prev,
                            timeLimit: value[0],
                          }))
                        }
                        min={1}
                        max={365}
                        step={1}
                        className="mb-2"
                      />
                      <div
                        className={`flex justify-between text-sm ${themeClasses.mutedText}`}
                      >
                        <span>1 day</span>
                        <span>365 days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Purpose Selection */}
                <Card
                  className={`${themeClasses.cardBg} backdrop-blur-sm border ${themeClasses.cardBorder} transition-colors duration-300`}
                >
                  <CardHeader>
                    <CardTitle
                      className={`text-xl font-bold ${themeClasses.text}`}
                    >
                      Third-Party Purposes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(consentSettings.purposes).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <label
                            className={`${themeClasses.text} font-medium capitalize`}
                          >
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) =>
                              setConsentSettings((prev) => ({
                                ...prev,
                                purposes: { ...prev.purposes, [key]: checked },
                              }))
                            }
                          />
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>

                {/* Additional Notes */}
                <Card
                  className={`${themeClasses.cardBg} backdrop-blur-sm border ${themeClasses.cardBorder} transition-colors duration-300`}
                >
                  <CardHeader>
                    <CardTitle
                      className={`text-xl font-bold ${themeClasses.text} flex items-center gap-2`}
                    >
                      <MessageSquare className="w-6 h-6 text-blue-400" />
                      Additional Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className={`text-sm ${themeClasses.mutedText}`}>
                        Add any additional comments or specific requirements for
                        your data sharing preferences. This information will be
                        processed for better understanding of your consent
                        requirements.
                      </p>
                      <Textarea
                        placeholder="Enter any additional notes, specific requirements, or comments about your data sharing preferences..."
                        value={consentSettings.additionalNotes}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setConsentSettings((prev) => ({
                            ...prev,
                            additionalNotes: e.target.value,
                          }))
                        }
                        className={`min-h-[120px] ${themeClasses.text} bg-transparent border ${themeClasses.cardBorder} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview Pane */}
              <div>
                <Card
                  className={`${themeClasses.cardBg} backdrop-blur-sm border ${themeClasses.cardBorder} sticky top-8 transition-colors duration-300`}
                >
                  <CardHeader>
                    <CardTitle
                      className={`text-xl font-bold ${themeClasses.text} flex items-center gap-2`}
                    >
                      <Eye className="w-6 h-6 text-green-400" />
                      Data Sharing Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div
                        className={`flex justify-between items-center p-3 ${
                          theme === 'light' ? 'bg-gray-100' : 'bg-gray-700/50'
                        } rounded-lg transition-colors duration-300`}
                      >
                        <span className={themeClasses.text}>
                          Transaction Data
                        </span>
                        <Badge
                          className={`${getDataLevelColor(
                            consentSettings.transactions[0]
                          )}`}
                        >
                          {getDataLevelText(consentSettings.transactions[0])}
                        </Badge>
                      </div>
                      <div
                        className={`flex justify-between items-center p-3 ${
                          theme === 'light' ? 'bg-gray-100' : 'bg-gray-700/50'
                        } rounded-lg transition-colors duration-300`}
                      >
                        <span className={themeClasses.text}>
                          Account Details
                        </span>
                        <Badge
                          className={`${getDataLevelColor(
                            consentSettings.accountDetails[0]
                          )}`}
                        >
                          {getDataLevelText(consentSettings.accountDetails[0])}
                        </Badge>
                      </div>
                      <div
                        className={`flex justify-between items-center p-3 ${
                          theme === 'light' ? 'bg-gray-100' : 'bg-gray-700/50'
                        } rounded-lg transition-colors duration-300`}
                      >
                        <span className={themeClasses.text}>Personal Info</span>
                        <Badge
                          className={`${getDataLevelColor(
                            consentSettings.personalInfo[0]
                          )}`}
                        >
                          {getDataLevelText(consentSettings.personalInfo[0])}
                        </Badge>
                      </div>
                    </div>

                    <div
                      className={`border-t ${
                        theme === 'light'
                          ? 'border-gray-200'
                          : 'border-gray-600'
                      } pt-4 transition-colors duration-300`}
                    >
                      <h4 className={`${themeClasses.text} font-medium mb-2`}>
                        Approved Purposes:
                      </h4>
                      <div className="space-y-1">
                        {Object.entries(consentSettings.purposes)
                          .filter(([_, value]) => value)
                          .map(([key, _]) => (
                            <div
                              key={key}
                              className="flex items-center gap-2 text-green-400"
                            >
                              <Check className="w-4 h-4" />
                              <span className="capitalize text-sm">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div
                      className={`border-t ${
                        theme === 'light'
                          ? 'border-gray-200'
                          : 'border-gray-600'
                      } pt-4 transition-colors duration-300`}
                    >
                      <p className={`text-sm ${themeClasses.mutedText} mb-4`}>
                        Data will be shared for {consentSettings.timeLimit} days
                        with privacy-preserving techniques applied.
                      </p>
                      <Button
                        onClick={handleSaveConsent}
                        className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 mb-3"
                        disabled={consentSaved}
                      >
                        {consentSaved ? (
                          <>
                            <Check className="w-5 h-5 mr-2" />
                            Consent Saved!
                          </>
                        ) : (
                          'Save Consent Preferences'
                        )}
                      </Button>

                      {/* Check PDF File Button */}
                      <Dialog
                        open={isPdfDialogOpen}
                        onOpenChange={setIsPdfDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            onClick={handleOpenPdfCheck}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
                          >
                            <FileText className="w-5 h-5 mr-2" />
                            Check Files
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Check Files</DialogTitle>
                            <DialogDescription>
                              Enter your credentials to access your files.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="userID" className="text-right">
                                User ID
                              </Label>
                              <Input
                                id="userID"
                                type="text"
                                value={pdfCheckData.userID}
                                onChange={(e) =>
                                  setPdfCheckData((prev) => ({
                                    ...prev,
                                    userID: e.target.value,
                                  }))
                                }
                                className="col-span-3"
                                placeholder="Enter your user ID"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="email" className="text-right">
                                Email
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                value={pdfCheckData.email}
                                onChange={(e) =>
                                  setPdfCheckData((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                  }))
                                }
                                className="col-span-3"
                                placeholder="Enter your email"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="token" className="text-right">
                                Token
                              </Label>
                              <Input
                                id="token"
                                type="text"
                                value={pdfCheckData.token}
                                onChange={(e) =>
                                  setPdfCheckData((prev) => ({
                                    ...prev,
                                    token: e.target.value,
                                  }))
                                }
                                className="col-span-3"
                                placeholder="Enter your token"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-4">
                            <Button
                              onClick={handlePdfSubmit}
                              disabled={
                                isSubmitting ||
                                !pdfCheckData.userID ||
                                !pdfCheckData.email ||
                                !pdfCheckData.token
                              }
                              className="w-full"
                            >
                              {isSubmitting ? 'Checking...' : 'Submit'}
                            </Button>

                            {userFiles.length > 0 && (
                              <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                                  Files Access Granted ({userFiles.length} files)
                                </h4>
                                <div className="space-y-4">
                                  {userFiles.map((file, index) => {
                                    const fileUrl = URL.createObjectURL(file.blob);
                                    const mimeType = file.blob.type;
                                    // PDF
                                    if (mimeType === 'application/pdf') {
                                      return (
                                        <div key={index} className="flex flex-col gap-2">
                                          <span className="font-medium text-green-700 dark:text-green-200">{file.name}</span>
                                          <a
                                            href={fileUrl}
                                            download={file.name}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                                          >
                                            Download
                                          </a>
                                          <iframe src={fileUrl} title={file.name} className="w-full h-96 border rounded" />
                                        </div>
                                      );
                                    }
                                    // Images
                                    if (mimeType.startsWith('image/')) {
                                      return (
                                        <div key={index} className="flex flex-col gap-2">
                                          <span className="font-medium text-green-700 dark:text-green-200">{file.name}</span>
                                          <a
                                            href={fileUrl}
                                            download={file.name}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                                          >
                                            Download
                                          </a>
                                          <img src={fileUrl} alt={file.name} className="max-w-full max-h-96 border rounded" />
                                        </div>
                                      );
                                    }
                                    // Audio
                                    if (mimeType.startsWith('audio/')) {
                                      return (
                                        <div key={index} className="flex flex-col gap-2">
                                          <span className="font-medium text-green-700 dark:text-green-200">{file.name}</span>
                                          <a
                                            href={fileUrl}
                                            download={file.name}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                                          >
                                            Download
                                          </a>
                                          <audio controls src={fileUrl} className="w-full" />
                                        </div>
                                      );
                                    }
                                    // Video
                                    if (mimeType.startsWith('video/')) {
                                      return (
                                        <div key={index} className="flex flex-col gap-2">
                                          <span className="font-medium text-green-700 dark:text-green-200">{file.name}</span>
                                          <a
                                            href={fileUrl}
                                            download={file.name}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                                          >
                                            Download
                                          </a>
                                          <video controls src={fileUrl} className="w-full max-h-96 border rounded" />
                                        </div>
                                      );
                                    }
                                    // Text
                                    if (mimeType.startsWith('text/')) {
                                      return (
                                        <div key={index} className="flex flex-col gap-2">
                                          <span className="font-medium text-green-700 dark:text-green-200">{file.name}</span>
                                          <a
                                            href={fileUrl}
                                            download={file.name}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                                          >
                                            Download
                                          </a>
                                          <iframe src={fileUrl} title={file.name} className="w-full h-96 border rounded bg-white" />
                                        </div>
                                      );
                                    }
                                    // Default: download only
                                    return (
                                      <div key={index} className="flex items-center gap-2">
                                        <span className="font-medium text-green-700 dark:text-green-200">{file.name}</span>
                                        <a
                                          href={fileUrl}
                                          download={file.name}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                                        >
                                          Download
                                        </a>
                                        <span className="text-xs text-gray-500">(Preview not supported)</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture Overview */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-500 bg-clip-text text-transparent">
                Architecture Overview
              </h2>
              <p
                className={`text-xl ${themeClasses.mutedText} max-w-3xl mx-auto transition-colors duration-300`}
              >
                Interactive multi-agent system orchestrating secure data
                workflows
              </p>
            </div>

            <div className="relative">
              <Card
                className={`${themeClasses.cardBg} backdrop-blur-sm border ${themeClasses.cardBorder} p-8 transition-colors duration-300`}
              >
                <div className="relative h-96 w-full">
                  {/* Connection Lines */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    style={{ zIndex: 1 }}
                  >
                    <defs>
                      <linearGradient
                        id="lineGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    {/* Draw connections between agents */}
                    <line
                      x1="20%"
                      y1="30%"
                      x2="50%"
                      y2="20%"
                      stroke="url(#lineGradient)"
                      strokeWidth="2"
                      opacity="0.6"
                    />
                    <line
                      x1="50%"
                      y1="20%"
                      x2="80%"
                      y2="30%"
                      stroke="url(#lineGradient)"
                      strokeWidth="2"
                      opacity="0.6"
                    />
                    <line
                      x1="20%"
                      y1="30%"
                      x2="20%"
                      y2="70%"
                      stroke="url(#lineGradient)"
                      strokeWidth="2"
                      opacity="0.6"
                    />
                    <line
                      x1="80%"
                      y1="30%"
                      x2="80%"
                      y2="70%"
                      stroke="url(#lineGradient)"
                      strokeWidth="2"
                      opacity="0.6"
                    />
                    <line
                      x1="20%"
                      y1="70%"
                      x2="50%"
                      y2="80%"
                      stroke="url(#lineGradient)"
                      strokeWidth="2"
                      opacity="0.6"
                    />
                    <line
                      x1="50%"
                      y1="80%"
                      x2="80%"
                      y2="70%"
                      strokeWidth="2"
                      opacity="0.6"
                    />
                  </svg>

                  {/* Agent Nodes */}
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                        activeAgent === agent.id
                          ? 'scale-125 z-20'
                          : 'z-10 hover:scale-110'
                      }`}
                      style={{ left: `${agent.x}%`, top: `${agent.y}%` }}
                      onMouseEnter={() => setActiveAgent(agent.id)}
                      onMouseLeave={() => setActiveAgent(null)}
                    >
                      <div
                        className={`w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg ${
                          activeAgent === agent.id ? 'shadow-cyan-500/50' : ''
                        }`}
                      >
                        <span className="text-white font-bold text-sm">
                          {agent.name}
                        </span>
                      </div>
                      {activeAgent === agent.id && (
                        <div
                          className={`absolute top-full mt-2 left-1/2 transform -translate-x-1/2 ${themeClasses.cardBg} ${themeClasses.text} px-3 py-2 rounded-lg shadow-lg whitespace-nowrap border ${themeClasses.cardBorder} transition-colors duration-300`}
                        >
                          <div className="text-sm font-semibold">
                            {agent.name}
                          </div>
                          <div className={`text-xs ${themeClasses.mutedText}`}>
                            {agent.role}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-4 ${
                      themeClasses.cardBg
                    } rounded-lg border transition-all duration-300 ${
                      activeAgent === agent.id
                        ? `border-cyan-400 ${themeClasses.cardBg}`
                        : themeClasses.cardBorder
                    }`}
                  >
                    <div className={`font-semibold ${themeClasses.text}`}>
                      {agent.name}
                    </div>
                    <div className={`text-sm ${themeClasses.mutedText}`}>
                      {agent.role}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section
          className={`py-20 px-4 ${themeClasses.sectionBg} transition-colors duration-300`}
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                About Airavat
              </h2>
              <p
                className={`text-xl ${themeClasses.mutedText} max-w-4xl mx-auto leading-relaxed transition-colors duration-300`}
              >
                Airavat is revolutionizing fintech data security through
                innovative multi-agent architecture, combining AI-driven risk
                assessment, blockchain transparency, and zero-knowledge proofs
                to create a new standard for responsible data sharing in
                financial ecosystems.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
              <Card
                className={`${themeClasses.cardBg} backdrop-blur-sm border ${themeClasses.cardBorder} transition-colors duration-300`}
              >
                <CardHeader>
                  <CardTitle
                    className={`text-2xl font-bold ${themeClasses.text} flex items-center gap-2`}
                  >
                    <Shield className="w-6 h-6 text-cyan-400" />
                    Our Mission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`${themeClasses.mutedText} leading-relaxed`}>
                    To rebuild trust in fintech ecosystems by providing users
                    with unprecedented control over their sensitive data while
                    enabling secure, compliant, and transparent data sharing
                    that benefits both consumers and financial institutions.
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`${themeClasses.cardBg} backdrop-blur-sm border ${themeClasses.cardBorder} transition-colors duration-300`}
              >
                <CardHeader>
                  <CardTitle
                    className={`text-2xl font-bold ${themeClasses.text} flex items-center gap-2`}
                  >
                    <Zap className="w-6 h-6 text-yellow-400" />
                    Innovation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`${themeClasses.mutedText} leading-relaxed`}>
                    Leveraging cutting-edge technologies including differential
                    privacy, homomorphic encryption, and zk-SNARKs to create a
                    privacy-preserving platform that meets GDPR and DPDP Act
                    compliance requirements while maintaining usability.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Team Section */}
            <div className="text-center">
              <h3 className={`text-3xl font-bold mb-8 ${themeClasses.text}`}>
                Meet the Team
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  {
                    name: 'Lakshya Rawat',
                    role: 'Project Lead & Blockchain Developer',
                  },
                  { name: 'Abhinav Singh', role: 'Agentic AI Developer' },
                  { name: 'Akhil Murarka', role: 'AI Developer ' },
                  {
                    name: 'Ayush Bansal',
                    role: 'Zero Knowledge Expert and Cyber Security Developer',
                  },
                ].map((member, index) => (
                  <Card
                    key={index}
                    className={`${themeClasses.cardBg} backdrop-blur-sm border ${themeClasses.cardBorder} transition-colors duration-300`}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <h4 className={`font-semibold ${themeClasses.text} mb-1`}>
                        {member.name}
                      </h4>
                      <p className={`text-sm ${themeClasses.mutedText}`}>
                        {member.role}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-300 px-4 py-2 text-lg"
              >
                🚀 Build in Accordance to the SuRaksha Hackathon Rules
              </Badge>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          className={`py-12 px-4 border-t ${
            theme === 'light' ? 'border-gray-200' : 'border-gray-800'
          } transition-colors duration-300`}
        >
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Airavat
              </h3>
            </div>
            <p
              className={`${themeClasses.mutedText} mb-4 transition-colors duration-300`}
            >
              Securing the future of fintech data sharing with responsible AI
              and privacy-first design.
            </p>
            <div
              className={`flex justify-center gap-6 text-sm ${themeClasses.mutedText}`}
            >
              <a
                href="https://www.freeprivacypolicy.com/live/f05a3ced-628e-450f-8634-9d03d21d858f"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 transition-colors"
              >
                Privacy Policy
              </a>
              <a href="#" className="hover:text-cyan-400 transition-colors">
                Terms of Service
              </a>
              <a
                href="https://www.legalwiz.in/blog/what-is-gdpr-compliance-and-applicability-in-india"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 transition-colors"
              >
                GDPR Compliance
              </a>
              <a href="#" className="hover:text-cyan-400 transition-colors">
                Contact
              </a>
            </div>
            <p
              className={`text-xs ${
                theme === 'light' ? 'text-gray-500' : 'text-gray-600'
              } mt-6 transition-colors duration-300`}
            >
              © 2025 Airavat. Built for SuRaksha Hackathon Theme 2. All rights
              reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function AiravatWebsite() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <TooltipProvider>
        <AiravatContent />
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </TooltipProvider>
    </ThemeContext.Provider>
  );
}
