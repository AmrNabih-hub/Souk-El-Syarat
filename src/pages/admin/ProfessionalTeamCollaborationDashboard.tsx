/**
 * Professional Team Collaboration Dashboard
 * Masters QA & Staff Engineers Collaboration Interface
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Brain, 
  Target, 
  TrendingUp, 
  Shield, 
  Zap, 
  Database, 
  Globe,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  FileText,
  GitBranch,
  MessageSquare,
  Calendar,
  Award,
  Rocket
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialization: string;
  experience: string;
  status: 'active' | 'busy' | 'available';
  currentTask: string;
  progress: number;
  avatar: string;
}

interface InvestigationProgress {
  phase: string;
  title: string;
  status: 'completed' | 'in-progress' | 'pending';
  progress: number;
  startDate: string;
  endDate: string;
  deliverables: string[];
  teamMembers: string[];
}

interface BrainstormingSession {
  id: string;
  title: string;
  date: string;
  duration: string;
  participants: string[];
  status: 'scheduled' | 'in-progress' | 'completed';
  outcomes: string[];
  nextSteps: string[];
}

interface InvestigationMetric {
  category: string;
  current: number;
  target: number;
  improvement: number;
  status: 'excellent' | 'good' | 'needs-improvement';
}

const ProfessionalTeamCollaborationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [investigationProgress, setInvestigationProgress] = useState<InvestigationProgress[]>([]);
  const [brainstormingSessions, setBrainstormingSessions] = useState<BrainstormingSession[]>([]);
  const [metrics, setMetrics] = useState<InvestigationMetric[]>([]);

  useEffect(() => {
    // Initialize team members
    setTeamMembers([
      {
        id: '1',
        name: 'Master QA Lead',
        role: 'Master QA Engineer - Team Lead',
        specialization: 'Enterprise QA, Performance Testing, Security Testing',
        experience: '15+ years',
        status: 'active',
        currentTask: 'Firebase Investigation Coordination',
        progress: 85,
        avatar: '👨‍💼'
      },
      {
        id: '2',
        name: 'Staff Technical Lead',
        role: 'Staff Engineer - Technical Lead',
        specialization: 'Microservices, Event-driven Architecture, API Gateway',
        experience: '12+ years',
        status: 'active',
        currentTask: 'Architecture Enhancement Analysis',
        progress: 78,
        avatar: '🏗️'
      },
      {
        id: '3',
        name: 'Firebase Expert',
        role: 'Firebase Specialist - Senior Engineer',
        specialization: 'Firebase, Google Cloud, Real-time Features',
        experience: '8+ years',
        status: 'active',
        currentTask: 'Firebase September 2025 Investigation',
        progress: 92,
        avatar: '🔥'
      },
      {
        id: '4',
        name: 'Performance Expert',
        role: 'Performance Engineer - Senior Engineer',
        specialization: 'Performance Optimization, Load Testing, Monitoring',
        experience: '10+ years',
        status: 'active',
        currentTask: 'Performance Deep Analysis',
        progress: 88,
        avatar: '⚡'
      },
      {
        id: '5',
        name: 'Security Expert',
        role: 'Security Engineer - Senior Engineer',
        specialization: 'Zero-trust Architecture, Compliance, Penetration Testing',
        experience: '9+ years',
        status: 'active',
        currentTask: 'Security Hardening Analysis',
        progress: 75,
        avatar: '🛡️'
      }
    ]);

    // Initialize investigation progress
    setInvestigationProgress([
      {
        phase: 'Phase 1',
        title: 'Research & Discovery',
        status: 'completed',
        progress: 100,
        startDate: '2025-01-15',
        endDate: '2025-01-28',
        deliverables: [
          'Firebase documentation analysis',
          'Industry standards research',
          'Architecture gap analysis',
          'Performance bottleneck identification'
        ],
        teamMembers: ['Firebase Expert', 'Staff Technical Lead', 'Performance Expert']
      },
      {
        phase: 'Phase 2',
        title: 'Deep Analysis & Brainstorming',
        status: 'in-progress',
        progress: 65,
        startDate: '2025-01-29',
        endDate: '2025-02-11',
        deliverables: [
          'Cross-functional brainstorming sessions',
          'Technical architecture design',
          'Performance optimization workshops',
          'Security enhancement planning'
        ],
        teamMembers: ['All Team Members']
      },
      {
        phase: 'Phase 3',
        title: 'Planning & Specification',
        status: 'pending',
        progress: 0,
        startDate: '2025-02-12',
        endDate: '2025-02-25',
        deliverables: [
          'Implementation roadmap development',
          'Technical specification creation',
          'Testing strategy design',
          'Risk assessment and mitigation'
        ],
        teamMembers: ['Staff Technical Lead', 'Master QA Lead', 'Security Expert']
      },
      {
        phase: 'Phase 4',
        title: 'Validation & Review',
        status: 'pending',
        progress: 0,
        startDate: '2025-02-26',
        endDate: '2025-03-11',
        deliverables: [
          'Technical review and validation',
          'Quality assurance verification',
          'Stakeholder review and approval',
          'Final deliverable compilation'
        ],
        teamMembers: ['All Team Members']
      }
    ]);

    // Initialize brainstorming sessions
    setBrainstormingSessions([
      {
        id: '1',
        title: 'Firebase Innovation Lab',
        date: '2025-02-05',
        duration: '4 hours',
        participants: ['Firebase Expert', 'Backend Engineers', 'DevOps'],
        status: 'scheduled',
        outcomes: [],
        nextSteps: [
          'Firebase feature matrix with implementation priorities',
          'Integration roadmap with timeline',
          'Performance impact analysis',
          'Security enhancement opportunities'
        ]
      },
      {
        id: '2',
        title: 'Architecture Evolution Workshop',
        date: '2025-02-07',
        duration: '6 hours',
        participants: ['Staff Technical Lead', 'Solution Architects', 'Senior Engineers'],
        status: 'scheduled',
        outcomes: [],
        nextSteps: [
          'Architecture enhancement blueprint',
          'Microservices optimization strategy',
          'Event-driven architecture design',
          'Performance optimization roadmap'
        ]
      },
      {
        id: '3',
        title: 'Performance Engineering Summit',
        date: '2025-02-09',
        duration: '8 hours',
        participants: ['Performance Expert', 'QA Engineers', 'DevOps'],
        status: 'scheduled',
        outcomes: [],
        nextSteps: [
          'Performance bottleneck analysis',
          'Optimization implementation plan',
          'Monitoring and alerting strategy',
          'Load testing and capacity planning'
        ]
      },
      {
        id: '4',
        title: 'Security & Compliance Review',
        date: '2025-02-11',
        duration: '4 hours',
        participants: ['Security Expert', 'Compliance Officers', 'QA'],
        status: 'scheduled',
        outcomes: [],
        nextSteps: [
          'Security audit report',
          'Compliance gap analysis',
          'Security enhancement plan',
          'Penetration testing strategy'
        ]
      }
    ]);

    // Initialize metrics
    setMetrics([
      {
        category: 'Overall Performance Score',
        current: 99,
        target: 100,
        improvement: 1,
        status: 'excellent'
      },
      {
        category: 'Service Availability',
        current: 95,
        target: 99.9,
        improvement: 4.9,
        status: 'needs-improvement'
      },
      {
        category: 'API Gateway Performance',
        current: 85,
        target: 95,
        improvement: 10,
        status: 'needs-improvement'
      },
      {
        category: 'Load Balancing Efficiency',
        current: 90,
        target: 98,
        improvement: 8,
        status: 'good'
      },
      {
        category: 'Request Routing',
        current: 70,
        target: 90,
        improvement: 20,
        status: 'needs-improvement'
      },
      {
        category: 'Service Orchestration',
        current: 90,
        target: 98,
        improvement: 8,
        status: 'good'
      },
      {
        category: 'Enterprise Readiness',
        current: 98,
        target: 100,
        improvement: 2,
        status: 'excellent'
      },
      {
        category: 'Scalability',
        current: 98,
        target: 100,
        improvement: 2,
        status: 'excellent'
      }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-yellow-600 bg-yellow-100';
      case 'available': return 'text-blue-600 bg-blue-100';
      case 'scheduled': return 'text-purple-600 bg-purple-100';
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'needs-improvement': return 'text-red-600';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'busy': return <Clock className="w-4 h-4" />;
      case 'available': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                Professional Team Collaboration
              </h1>
              <p className="text-gray-600 mt-2">
                Masters QA & Staff Engineers - Comprehensive Investigation & Analysis
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Team Status</div>
                <div className="text-lg font-semibold text-green-600">Active</div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'team', label: 'Team Members', icon: Users },
              { id: 'progress', label: 'Investigation Progress', icon: Target },
              { id: 'brainstorming', label: 'Brainstorming Sessions', icon: Brain },
              { id: 'metrics', label: 'Enhancement Metrics', icon: TrendingUp },
              { id: 'collaboration', label: 'Collaboration Tools', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Team Members</p>
                    <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-green-600">All Active</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Investigation Phases</p>
                    <p className="text-2xl font-bold text-gray-900">{investigationProgress.length}</p>
                  </div>
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-blue-600">2 Completed, 2 In Progress</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Brainstorming Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{brainstormingSessions.length}</p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-600" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-purple-600">4 Scheduled</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Enhancement Target</p>
                    <p className="text-2xl font-bold text-gray-900">100%</p>
                  </div>
                  <Award className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-yellow-600">Enterprise Excellence</span>
                </div>
              </div>
            </div>

            {/* Current Focus Areas */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-blue-600" />
                Current Focus Areas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Firebase Investigation</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Firebase September 2025 Features</span>
                      <span className="text-green-600">92% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Architecture Enhancement</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Microservices Optimization</span>
                      <span className="text-blue-600">78% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Performance Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Deep Performance Optimization</span>
                      <span className="text-purple-600">88% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Security Hardening</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Zero-trust Architecture</span>
                      <span className="text-red-600">75% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Professional Team Members
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl">{member.avatar}</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Specialization</p>
                        <p className="text-sm text-gray-700">{member.specialization}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Experience</p>
                        <p className="text-sm text-gray-700">{member.experience}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Current Task</p>
                        <p className="text-sm text-gray-700">{member.currentTask}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Progress</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${member.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{member.progress}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                          {getStatusIcon(member.status)}
                          {member.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Investigation Progress
              </h3>
              <div className="space-y-4">
                {investigationProgress.map((phase, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(phase.status)}`}>
                          {getStatusIcon(phase.status)}
                          {phase.status}
                        </span>
                        <h4 className="font-semibold text-gray-900">{phase.phase}: {phase.title}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{phase.startDate} - {phase.endDate}</p>
                        <p className="text-sm font-medium text-gray-900">{phase.progress}% Complete</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full ${
                          phase.status === 'completed' ? 'bg-green-600' : 
                          phase.status === 'in-progress' ? 'bg-blue-600' : 'bg-gray-400'
                        }`}
                        style={{ width: `${phase.progress}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Deliverables:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {phase.deliverables.map((deliverable, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              {deliverable}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Team Members:</p>
                        <div className="flex flex-wrap gap-2">
                          {phase.teamMembers.map((member, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'brainstorming' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Brainstorming Sessions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {brainstormingSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{session.title}</h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {getStatusIcon(session.status)}
                        {session.status}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {session.date}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {session.duration}
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Participants:</p>
                      <div className="flex flex-wrap gap-2">
                        {session.participants.map((participant, idx) => (
                          <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {participant}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Expected Outcomes:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {session.nextSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Target className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Enhancement Metrics
              </h3>
              <div className="space-y-4">
                {metrics.map((metric, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{metric.category}</h4>
                      <span className={`text-sm font-medium ${getStatusColor(metric.status)}`}>
                        {metric.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Current</p>
                        <p className="text-lg font-bold text-gray-900">{metric.current}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Target</p>
                        <p className="text-lg font-bold text-blue-600">{metric.target}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Improvement Needed</p>
                        <p className="text-lg font-bold text-green-600">+{metric.improvement}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full" 
                        style={{ width: `${(metric.current / metric.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collaboration' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Communication Channels
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Slack</p>
                      <p className="text-sm text-gray-600">Real-time communication</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <GitBranch className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">GitHub</p>
                      <p className="text-sm text-gray-600">Code collaboration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Confluence</p>
                      <p className="text-sm text-gray-600">Documentation</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Upcoming Sessions
                </h3>
                <div className="space-y-3">
                  {brainstormingSessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{session.title}</h4>
                        <span className="text-sm text-gray-600">{session.date}</span>
                      </div>
                      <p className="text-sm text-gray-600">{session.duration}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Team Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900">Phase 1 Complete</h4>
                  <p className="text-sm text-gray-600">Research & Discovery</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900">4 Sessions Planned</h4>
                  <p className="text-sm text-gray-600">Brainstorming & Innovation</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900">100% Target</h4>
                  <p className="text-sm text-gray-600">Enterprise Excellence</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalTeamCollaborationDashboard;