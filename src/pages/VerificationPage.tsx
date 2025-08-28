import React from 'react';
import RealtimeVerification from '@/components/realtime/RealtimeVerification';
import RealtimeRecommendations from '@/components/realtime/RealtimeRecommendations';
import { useAuthStore } from '@/stores/authStore';

const VerificationPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12">
          🔄 Real-time System Verification
        </h1>
        
        {/* System Verification */}
        <RealtimeVerification />
        
        {/* Real-time AI Recommendations */}
        {user && (
          <div className="mt-12">
            <RealtimeRecommendations userId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationPage;