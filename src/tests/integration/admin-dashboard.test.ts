import { AdminService } from '@/services/admin.service';

// Test the real AdminService functionality
describe('AdminService Integration', () => {
  it('should have all required methods', () => {
    expect(AdminService.getAdminStats).toBeDefined();
    expect(AdminService.subscribeToAnalytics).toBeDefined();
    expect(AdminService.subscribeToApplications).toBeDefined();
    expect(AdminService.subscribeToVendors).toBeDefined();
    expect(AdminService.processVendorApplication).toBeDefined();
    expect(AdminService.toggleVendorStatus).toBeDefined();
  });

  it('should handle real-time subscriptions', () => {
    const unsubscribe = AdminService.subscribeToAnalytics(() => {});
    expect(typeof unsubscribe).toBe('function');
  });
});
