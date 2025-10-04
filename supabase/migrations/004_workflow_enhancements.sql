-- ==========================================
-- WORKFLOW ENHANCEMENTS MIGRATION
-- Adds fields for complete workflow tracking
-- ==========================================

-- Add workflow fields to vendor_applications
ALTER TABLE vendor_applications
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add workflow fields to car_listings
ALTER TABLE car_listings
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create function to send notification
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for vendor application approval
CREATE OR REPLACE FUNCTION handle_vendor_application_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Update user role to vendor
    UPDATE users 
    SET role = 'vendor', 
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- Create vendor record if not exists
    INSERT INTO vendors (
      id,
      user_id,
      company_name,
      license_number,
      verified,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      NEW.user_id,
      NEW.company_name,
      NEW.license_number,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET verified = true,
        company_name = NEW.company_name,
        license_number = NEW.license_number,
        updated_at = NOW();
    
    -- Send notification to user
    PERFORM send_notification(
      NEW.user_id,
      'vendor_approved',
      'Vendor Application Approved! 🎉',
      'Congratulations! Your vendor application has been approved. You can now access your vendor dashboard and start selling products.',
      '/vendor/dashboard',
      jsonb_build_object('application_id', NEW.id, 'company_name', NEW.company_name)
    );
    
    -- Set approval timestamp
    NEW.approved_at = NOW();
  END IF;
  
  -- If status changed to rejected
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    -- Send notification to user
    PERFORM send_notification(
      NEW.user_id,
      'vendor_rejected',
      'Vendor Application Update',
      COALESCE('Your vendor application was not approved. Reason: ' || NEW.rejection_reason, 'Your vendor application was not approved. Please contact support for more information.'),
      '/vendor/apply',
      jsonb_build_object('application_id', NEW.id, 'reason', NEW.rejection_reason)
    );
    
    -- Set rejection timestamp
    NEW.rejected_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vendor applications
DROP TRIGGER IF EXISTS vendor_application_status_change ON vendor_applications;
CREATE TRIGGER vendor_application_status_change
  BEFORE UPDATE ON vendor_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_vendor_application_approval();

-- Create trigger function for car listing approval
CREATE OR REPLACE FUNCTION handle_car_listing_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Send notification to user
    PERFORM send_notification(
      NEW.customer_id,
      'car_approved',
      'Car Listing Approved! 🚗',
      'Great news! Your car listing has been approved and is now visible in the marketplace.',
      '/marketplace',
      jsonb_build_object('listing_id', NEW.id, 'car_title', NEW.title)
    );
    
    -- Set approval timestamp
    NEW.approved_at = NOW();
  END IF;
  
  -- If status changed to rejected
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    -- Send notification to user
    PERFORM send_notification(
      NEW.customer_id,
      'car_rejected',
      'Car Listing Update',
      COALESCE('Your car listing was not approved. Reason: ' || NEW.rejection_reason, 'Your car listing was not approved. Please review and resubmit.'),
      '/sell-your-car',
      jsonb_build_object('listing_id', NEW.id, 'reason', NEW.rejection_reason)
    );
    
    -- Set rejection timestamp
    NEW.rejected_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for car listings
DROP TRIGGER IF EXISTS car_listing_status_change ON car_listings;
CREATE TRIGGER car_listing_status_change
  BEFORE UPDATE ON car_listings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_car_listing_approval();

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications (handled by triggers/functions)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id AND read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Verify columns added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendor_applications' 
    AND column_name = 'rejection_reason'
  ) THEN
    RAISE NOTICE '✅ Workflow enhancements applied successfully';
  ELSE
    RAISE EXCEPTION '❌ Migration failed - columns not added';
  END IF;
END $$;
