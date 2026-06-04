import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";

// Mock analytics data - in a real app, this would come from analytics service or database
const MOCK_ANALYTICS = {
  users: {
    total: 1247,
    activeToday: 89,
    activeWeek: 456,
    activeMonth: 1102,
    growthRate: 12.5
  },
  consultations: {
    total: 3421,
    today: 67,
    week: 298,
    month: 2105,
    avgPerUser: 2.7
  },
  emergencyCards: {
    generated: 892,
    today: 12,
    week: 67
  },
  appointments: {
    booked: 456,
    today: 23,
    week: 89
  },
  topSpecialties: [
    { name: "Medicina General", count: 892 },
    { name: "Pediatría", count: 654 },
    { name: "Ginecología", count: 423 },
    { name: "Psicología", count: 389 },
    { name: "Dermatología", count: 256 }
  ],
  recentActivity: [
    {
      id: "1",
      type: "consulta",
      description: "Usuario realizó consulta sobre síntomas respiratorios",
      time: "2 horas atrás",
      icon: "message-square"
    },
    {
      id: "2",
      type: "usuario",
      description: "Nuevo usuario registrado: María González",
      time: "4 horas atrás",
      icon: "user-plus"
    },
    {
      id: "3",
      type: "tarjeta",
      description: "Tarjeta de emergencia generada para Juan Pérez",
      time: "6 horas atrás",
      icon: "credit-card"
    },
    {
      id: "4",
      type: "cita",
      description: "Cita agendada con Dr. López para mañana",
      time: "8 horas atrás",
      icon: "calendar"
    }
  ]
};

const AnalyticsView: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500">{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500 dark:text-slate-400">{t('accessDenied')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('analytics')}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t('lastUpdated')}: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('totalUsers')}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{MOCK_ANALYTICS.users.total}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center space-x-2 text-xs">
            {MOCK_ANALYTICS.users.growthRate >= 0 ? (
              <span className="text-green-600">↑ {MOCK_ANALYTICS.users.growthRate}%</span>
            ) : (
              <span className="text-red-600">↓ {Math.abs(MOCK_ANALYTICS.users.growthRate)}%</span>
            )}
            <span className="text-slate-500">{t('thisMonth')}</span>
          </div>
        </div>

        {/* Total Consultations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('totalConsultations')}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{MOCK_ANALYTICS.consultations.total}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.304-.273-2.585-.802-3.758z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center space-x-2 text-xs">
            <span className="text-blue-600">↑ {MOCK_ANALYTICS.consultations.today} {t('today')}</span>
          </div>
        </div>

        {/* Emergency Cards */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('emergencyCardsGenerated')}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{MOCK_ANALYTICS.emergencyCards.generated}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center space-x-2 text-xs">
            <span className="text-orange-600">↑ {MOCK_ANALYTICS.emergencyCards.today} {t('today')}</span>
          </div>
        </div>

        {/* Appointments Booked */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('appointmentsBooked')}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{MOCK_ANALYTICS.appointments.booked}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.657 16.657L13.414 20.9l-5.001-5.001 1.414-1.414L11 16.586V6h4v10.586l1.243-1.243z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center space-x-2 text-xs">
            <span className="text-pink-600">↑ {MOCK_ANALYTICS.appointments.today} {t('today')}</span>
          </div>
        </div>
      </div>

      {/* Consultations Trend */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('consultationsTrend')}</h3>
        </div>
        <div className="px-6 py-4">
          {/* Mock chart - in real app would use charting library */}
          <div className="h-96 w-full relative">
            <div className="absolute inset-0 pointer-events-none">
              {/* Grid lines */}
              <div className="flex items-start justify-between h-full">
                {[0, 20, 40, 60, 80, 100].map((percent, index) => (
                  <div key={index} className="flex h-[calc(100%_-_1px)] items-center">
                    <div className="w-full border-b border-slate-200 dark:border-slate-800" />
                    <div className="ml-1 text-xs text-slate-400 dark:text-slate-500">{percent}%</div>
                  </div>
                ))}
              </div>
              <div className="flex items-end justify-between w-full">
                {[0, 1, 2, 3, 4, 5].map((day, index) => (
                  <div key={index} className="flex items-end w-[calc(100%_/_6)]">
                    <div className="border-l border-slate-200 dark:border-slate-800 h-[calc(100%_+_1px)]" />
                    <div className="mb-1 text-xs text-slate-400 dark:text-slate-500 w-[40px] text-center">
                      {'Mon,Tue,Wed,Thu,Fri,Sat'.split(',')[index]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Chart bars */}
            <div className="absolute bottom-0 left-0 h-[60%] w-full flex items-end justify-around pb-4">
              {[4, 8, 15, 10, 18, 12].map((height, index) => (
                <div key={index} className="flex-1 flex items-end justify-center">
                  <div className="w-[70%] h-[calc(100%_*_0.1)] bg-blue-500 dark:bg-blue-400 rounded-t-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Specialties */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('topSpecialties')}</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          {MOCK_ANALYTICS.topSpecialties.map((specialty, index) => (
            <div key={index} className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-slate-900 dark:text-white">{specialty.name}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('consultationsCount', { count: specialty.count })}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('recentActivity')}</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          {MOCK_ANALYTICS.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
              <div className="w-10 h-10 flex-shrink-0 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                {/* In real app, would use proper icon based on activity.type */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-slate-900 dark:text-white">{activity.description}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{activity.time}</p>
              </div>
            </div>
          ))}
          {MOCK_ANALYTICS.recentActivity.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
              <p>{t('noRecentActivity')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;