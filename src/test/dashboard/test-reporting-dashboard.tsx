/**
 * 📊 Test Reporting Dashboard
 * Professional test reporting and analytics dashboard for Souk El-Syarat platform
 */

import React, { useState, useEffect } from 'react'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface TestMetrics {
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  flakyTests: number
  coverage: number
  executionTime: number
  passRate: number
  trend: 'up' | 'down' | 'stable'
}

interface TestSuiteMetrics {
  name: string
  metrics: TestMetrics
  lastRun: Date
  status: 'success' | 'warning' | 'error'
}

interface TestTrend {
  date: string
  passRate: number
  totalTests: number
  executionTime: number
}

interface TestEnvironmentStatus {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastDeployment: Date
  version: string
  uptime: number
}

export const TestReportingDashboard: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuiteMetrics[]>([])
  const [testTrends, setTestTrends] = useState<TestTrend[]>([])
  const [environments, setEnvironments] = useState<TestEnvironmentStatus[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [selectedTimeRange])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Simulate API calls
      await Promise.all([
        loadTestSuites(),
        loadTestTrends(),
        loadEnvironmentStatus()
      ])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTestSuites = async () => {
    // Simulate test suite data
    const suites: TestSuiteMetrics[] = [
      {
        name: 'Unit Tests',
        metrics: {
          totalTests: 150,
          passedTests: 145,
          failedTests: 3,
          skippedTests: 2,
          flakyTests: 1,
          coverage: 85,
          executionTime: 12000,
          passRate: 96.7,
          trend: 'up'
        },
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'success'
      },
      {
        name: 'Integration Tests',
        metrics: {
          totalTests: 75,
          passedTests: 72,
          failedTests: 2,
          skippedTests: 1,
          flakyTests: 0,
          coverage: 80,
          executionTime: 18000,
          passRate: 96.0,
          trend: 'stable'
        },
        lastRun: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        status: 'success'
      },
      {
        name: 'Security Tests',
        metrics: {
          totalTests: 45,
          passedTests: 42,
          failedTests: 2,
          skippedTests: 1,
          flakyTests: 0,
          coverage: 90,
          executionTime: 25000,
          passRate: 93.3,
          trend: 'down'
        },
        lastRun: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        status: 'warning'
      },
      {
        name: 'Performance Tests',
        metrics: {
          totalTests: 30,
          passedTests: 25,
          failedTests: 4,
          skippedTests: 1,
          flakyTests: 1,
          coverage: 75,
          executionTime: 35000,
          passRate: 83.3,
          trend: 'down'
        },
        lastRun: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        status: 'error'
      },
      {
        name: 'E2E Tests',
        metrics: {
          totalTests: 60,
          passedTests: 55,
          failedTests: 3,
          skippedTests: 2,
          flakyTests: 2,
          coverage: 70,
          executionTime: 45000,
          passRate: 91.7,
          trend: 'up'
        },
        lastRun: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        status: 'success'
      },
      {
        name: 'Regression Tests',
        metrics: {
          totalTests: 90,
          passedTests: 87,
          failedTests: 2,
          skippedTests: 1,
          flakyTests: 0,
          coverage: 85,
          executionTime: 22000,
          passRate: 96.7,
          trend: 'stable'
        },
        lastRun: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        status: 'success'
      }
    ]
    setTestSuites(suites)
  }

  const loadTestTrends = async () => {
    // Simulate trend data for the last 7 days
    const trends: TestTrend[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      trends.push({
        date: date.toISOString().split('T')[0],
        passRate: 85 + Math.random() * 15, // 85-100%
        totalTests: 400 + Math.random() * 100, // 400-500
        executionTime: 120000 + Math.random() * 60000 // 2-3 minutes
      })
    }
    setTestTrends(trends)
  }

  const loadEnvironmentStatus = async () => {
    // Simulate environment status
    const envs: TestEnvironmentStatus[] = [
      {
        name: 'Development',
        status: 'healthy',
        lastDeployment: new Date(Date.now() - 2 * 60 * 60 * 1000),
        version: '1.0.0-dev',
        uptime: 99.9
      },
      {
        name: 'Staging',
        status: 'healthy',
        lastDeployment: new Date(Date.now() - 4 * 60 * 60 * 1000),
        version: '1.0.0-staging',
        uptime: 99.8
      },
      {
        name: 'Production',
        status: 'degraded',
        lastDeployment: new Date(Date.now() - 24 * 60 * 60 * 1000),
        version: '1.0.0',
        uptime: 99.5
      },
      {
        name: 'Testing',
        status: 'healthy',
        lastDeployment: new Date(Date.now() - 1 * 60 * 60 * 1000),
        version: '1.0.0-test',
        uptime: 99.7
      }
    ]
    setEnvironments(envs)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
      case 'unhealthy':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈'
      case 'down':
        return '📉'
      case 'stable':
        return '➡️'
      default:
        return '❓'
    }
  }

  // Chart data
  const passRateChartData = {
    labels: testSuites.map(suite => suite.name),
    datasets: [
      {
        label: 'Pass Rate (%)',
        data: testSuites.map(suite => suite.metrics.passRate),
        backgroundColor: testSuites.map(suite => 
          suite.metrics.passRate >= 95 ? '#10B981' : 
          suite.metrics.passRate >= 90 ? '#F59E0B' : '#EF4444'
        ),
        borderColor: testSuites.map(suite => 
          suite.metrics.passRate >= 95 ? '#059669' : 
          suite.metrics.passRate >= 90 ? '#D97706' : '#DC2626'
        ),
        borderWidth: 1
      }
    ]
  }

  const trendChartData = {
    labels: testTrends.map(trend => trend.date),
    datasets: [
      {
        label: 'Pass Rate (%)',
        data: testTrends.map(trend => trend.passRate),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Total Tests',
        data: testTrends.map(trend => trend.totalTests),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  }

  const coverageChartData = {
    labels: testSuites.map(suite => suite.name),
    datasets: [
      {
        data: testSuites.map(suite => suite.metrics.coverage),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#06B6D4'
        ],
        borderWidth: 0
      }
    ]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Test Reporting Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive test analytics and monitoring for Souk El-Syarat platform
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range as any)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedTimeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Last {range}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {testSuites.reduce((sum, suite) => sum + suite.metrics.totalTests, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(
                    testSuites.reduce((sum, suite) => sum + suite.metrics.passRate, 0) / 
                    testSuites.length
                  )}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Coverage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(
                    testSuites.reduce((sum, suite) => sum + suite.metrics.coverage, 0) / 
                    testSuites.length
                  )}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(
                    testSuites.reduce((sum, suite) => sum + suite.metrics.executionTime, 0) / 
                    testSuites.length / 1000
                  )}s
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pass Rate Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Test Suite Pass Rates
            </h3>
            <div className="h-64">
              <Bar data={passRateChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  title: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: (value) => `${value}%` }
                  }
                }
              }} />
            </div>
          </div>

          {/* Coverage Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Test Coverage Distribution
            </h3>
            <div className="h-64">
              <Doughnut data={coverageChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }} />
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Test Trends Over Time
          </h3>
          <div className="h-64">
            <Line data={trendChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  ticks: { callback: (value) => `${value}%` }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  grid: { drawOnChartArea: false }
                }
              }
            }} />
          </div>
        </div>

        {/* Test Suites Table */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Test Suite Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Suite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pass Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coverage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Run
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testSuites.map((suite) => (
                  <tr key={suite.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {suite.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(suite.status)}`}>
                        {suite.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {suite.metrics.passRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {suite.metrics.coverage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(suite.metrics.executionTime / 1000).toFixed(1)}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTrendIcon(suite.metrics.trend)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {suite.lastRun.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Environment Status */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Environment Status</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {environments.map((env) => (
                <div key={env.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{env.name}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(env.status)}`}>
                      {env.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Version: {env.version}</p>
                    <p>Uptime: {env.uptime}%</p>
                    <p>Last Deploy: {env.lastDeployment.toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestReportingDashboard