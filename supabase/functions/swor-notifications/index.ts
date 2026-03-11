import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// PATCH v1.7.1: Added Access-Control-Allow-Methods to fix CORS preflight blocking
const VERSION = '1.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

// v1.7.0: Production domain and sender address
const VERIFIED_DOMAIN = 'smallworldofrugby.com';
const FROM_ADDRESS = `SWOR <noreply@${VERIFIED_DOMAIN}>`;
const PRODUCTION_BASE_URL = 'https://smallworldofrugby.com';

const GLOBAL_STEWARD_EMAILS = [
  'alun@adesignbranding.co.za',
  'steward@swor.com',
  'admin@swor.com',
  'test@example.com'
];

async function sendEmail(to: string, subject: string, htmlContent: string): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html: htmlContent })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Email] Resend API error:', response.status, errorText);
      return { success: false, error: `Resend API error: ${response.status} - ${errorText}` };
    }
    const result = await response.json();
    console.log('[Email] Sent successfully:', result.id);
    return { success: true };
  } catch (err) {
    console.error('[Email] Exception:', err);
    return { success: false, error: err.message };
  }
}

async function writeAuditLog(supabase: any, entry: {
  action_type: string;
  actor_user_id?: string | null;
  actor_email: string;
  scope_type: string;
  target_id?: string | null;
  target_label?: string | null;
  details_json?: any;
}): Promise<void> {
  try {
    const { error } = await supabase.from('steward_audit_log').insert({
      action_type: entry.action_type,
      actor_user_id: entry.actor_user_id || null,
      actor_email: entry.actor_email,
      scope_type: entry.scope_type,
      target_id: entry.target_id || null,
      target_label: entry.target_label || null,
      details_json: entry.details_json || null,
    });
    if (error) console.error('[AuditLog] Write failed:', error);
  } catch (err) {
    console.error('[AuditLog] Exception:', err);
  }
}

async function verifyStewardFromRequest(req: any, supabase: any): Promise<{
  authenticated: boolean;
  user_id: string | null;
  email: string | null;
  is_steward: boolean;
  error?: string;
}> {
  try {
    const authHeader = req?.headers?.get ? req.headers.get('authorization') : null;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, user_id: null, email: null, is_steward: false, error: 'No authorization header' };
    }
    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) {
      return { authenticated: false, user_id: null, email: null, is_steward: false, error: error?.message || 'Invalid token' };
    }
    const email = user.email?.toLowerCase() || null;
    const userId = user.id;
    if (email && GLOBAL_STEWARD_EMAILS.includes(email)) {
      return { authenticated: true, user_id: userId, email, is_steward: true };
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', userId).single();
    if (profile && (profile.role === 'steward' || profile.role === 'admin')) {
      return { authenticated: true, user_id: userId, email, is_steward: true };
    }
    const { data: roles } = await supabase.from('roles').select('role').eq('user_id', userId).eq('role', 'global_steward').limit(1);
    if (roles && roles.length > 0) {
      return { authenticated: true, user_id: userId, email, is_steward: true };
    }
    return { authenticated: true, user_id: userId, email, is_steward: false, error: 'User is not a steward' };
  } catch (err) {
    console.error('[verifySteward] Exception:', err);
    return { authenticated: false, user_id: null, email: null, is_steward: false, error: err.message || 'Header access failed' };
  }
}

async function getUserNotificationPreferences(supabase: any, userId: string): Promise<any> {
  const defaults = { email_on_approval: true, email_on_rejection: true, email_digest_weekly: false, email_commendation_submitted: true, email_commendation_approved: true, email_commendation_rejected: true, email_profile_submitted: true, email_profile_approved: true, email_profile_needs_changes: true, email_contact_message: true, email_steward_assigned: true, email_steward_deactivated: true };
  if (!userId) return defaults;
  try {
    const { data, error } = await supabase.from('notification_preferences').select('*').eq('user_id', userId).single();
    if (error || !data) return defaults;
    return { ...defaults, ...data };
  } catch (err) { return defaults; }
}

async function getUserEmail(supabase: any, userId: string): Promise<string | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase.from('users').select('email').eq('id', userId).single();
    if (error || !data) return null;
    return data.email;
  } catch (err) { return null; }
}

function generateTestEmailHtml(stewardEmail: string): string {
  const timestamp = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Georgia, serif; background-color: #F5F1E8; padding: 40px 20px; margin: 0;"><div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><div style="background-color: #1A2332; padding: 24px 32px;"><h1 style="color: #F5F1E8; font-size: 20px; margin: 0; font-weight: normal;">Small World of Rugby</h1></div><div style="padding: 32px;"><h2 style="color: #1A2332; font-size: 18px; margin: 0 0 16px 0; font-weight: normal;">Test email from SWOR</h2><p style="color: #1A2332; opacity: 0.8; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">This is a test email sent from the SWOR steward dashboard to confirm that the email delivery system is working correctly.</p><div style="background-color: #F5F1E8; border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="color: #1A2332; font-size: 14px; margin: 0 0 8px 0;"><strong>Sent to:</strong> ${stewardEmail}</p><p style="color: #1A2332; font-size: 14px; margin: 0 0 8px 0;"><strong>Sent at:</strong> ${timestamp}</p><p style="color: #1A2332; font-size: 14px; margin: 0;"><strong>Sender:</strong> noreply@${VERIFIED_DOMAIN}</p></div><p style="color: #1A2332; opacity: 0.6; font-size: 13px; line-height: 1.5; margin: 16px 0 0 0;">If you received this email, your email configuration is working. No action is required.</p></div><div style="background-color: #F5F1E8; padding: 16px 32px; border-top: 1px solid rgba(26,35,50,0.1);"><p style="color: #1A2332; opacity: 0.5; font-size: 12px; margin: 0; text-align: center;">This is a test message from the SWOR steward dashboard.</p></div></div></body></html>`;
}

function generateContactMessageEmailHtml(senderName: string, senderEmail: string, subject: string, message: string, timestamp: string, dashboardUrl: string): string {
  const formattedDate = new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Georgia, serif; background-color: #F5F1E8; padding: 40px 20px; margin: 0;"><div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><div style="background-color: #1A2332; padding: 24px 32px;"><h1 style="color: #F5F1E8; font-size: 20px; margin: 0; font-weight: normal;">Small World of Rugby</h1></div><div style="padding: 32px;"><h2 style="color: #1A2332; font-size: 18px; margin: 0 0 16px 0; font-weight: normal;">New message received</h2><p style="color: #1A2332; opacity: 0.8; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">A new contact message has been received and is awaiting your attention.</p><div style="background-color: #F5F1E8; border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="color: #1A2332; font-size: 14px; margin: 0 0 8px 0;"><strong>From:</strong> ${senderName}</p><p style="color: #1A2332; font-size: 14px; margin: 0 0 8px 0;"><strong>Email:</strong> ${senderEmail}</p><p style="color: #1A2332; font-size: 14px; margin: 0 0 8px 0;"><strong>Subject:</strong> ${subject}</p><p style="color: #1A2332; font-size: 14px; margin: 0;"><strong>Received:</strong> ${formattedDate}</p></div><div style="background-color: #ffffff; border: 1px solid rgba(26,35,50,0.1); border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="color: #1A2332; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">Message:</p><p style="color: #1A2332; opacity: 0.8; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p></div><a href="${dashboardUrl}" style="display: inline-block; background-color: #8B9D83; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; margin-top: 8px;">View in Dashboard</a></div><div style="background-color: #F5F1E8; padding: 16px 32px; border-top: 1px solid rgba(26,35,50,0.1);"><p style="color: #1A2332; opacity: 0.5; font-size: 12px; margin: 0; text-align: center;">You are receiving this because you are a steward. Manage preferences in settings.</p></div></div></body></html>`;
}

function generateProfileApprovedEmailHtml(profileName: string, profileUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Georgia, serif; background-color: #F5F1E8; padding: 40px 20px; margin: 0;"><div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><div style="background-color: #1A2332; padding: 24px 32px;"><h1 style="color: #F5F1E8; font-size: 20px; margin: 0; font-weight: normal;">Small World of Rugby</h1></div><div style="padding: 32px;"><h2 style="color: #1A2332; font-size: 18px; margin: 0 0 16px 0; font-weight: normal;">Your profile has been approved</h2><p style="color: #1A2332; opacity: 0.8; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Your profile <strong>"${profileName}"</strong> has been reviewed and approved by a steward. It is now visible according to your visibility settings.</p><a href="${profileUrl}" style="display: inline-block; background-color: #8B9D83; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px;">View Your Profile</a><p style="color: #1A2332; opacity: 0.5; font-size: 13px; line-height: 1.5; margin: 32px 0 0 0;">Thank you for contributing to the preservation of rugby's stories and memories.</p></div><div style="background-color: #F5F1E8; padding: 16px 32px; border-top: 1px solid rgba(26,35,50,0.1);"><p style="color: #1A2332; opacity: 0.5; font-size: 12px; margin: 0; text-align: center;">This is an automated message from SWOR.</p></div></div></body></html>`;
}

function generateProfileNeedsChangesEmailHtml(profileName: string, stewardNote: string | null, profileUrl: string): string {
  const noteSection = stewardNote ? `<div style="background-color: #FEF3C7; border-left: 3px solid #F59E0B; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;"><p style="color: #92400E; font-size: 14px; margin: 0;"><strong>Feedback from your steward:</strong></p><p style="color: #92400E; font-size: 14px; margin: 8px 0 0 0; font-style: italic;">"${stewardNote}"</p></div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Georgia, serif; background-color: #F5F1E8; padding: 40px 20px; margin: 0;"><div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><div style="background-color: #1A2332; padding: 24px 32px;"><h1 style="color: #F5F1E8; font-size: 20px; margin: 0; font-weight: normal;">Small World of Rugby</h1></div><div style="padding: 32px;"><h2 style="color: #1A2332; font-size: 18px; margin: 0 0 16px 0; font-weight: normal;">Your profile needs some changes</h2><p style="color: #1A2332; opacity: 0.8; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Your profile <strong>"${profileName}"</strong> has been reviewed by a steward who has requested some changes before it can be approved.</p>${noteSection}<p style="color: #1A2332; opacity: 0.7; font-size: 14px; line-height: 1.6; margin: 16px 0 24px 0;">Take your time making the requested changes. There is no deadline.</p><a href="${profileUrl}" style="display: inline-block; background-color: #B8826D; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px;">Edit Your Profile</a></div><div style="background-color: #F5F1E8; padding: 16px 32px; border-top: 1px solid rgba(26,35,50,0.1);"><p style="color: #1A2332; opacity: 0.5; font-size: 12px; margin: 0; text-align: center;">This is an automated message from SWOR.</p></div></div></body></html>`;
}

function generateProfileSubmittedEmailHtml(profileName: string, country: string | null, dashboardUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Georgia, serif; background-color: #F5F1E8; padding: 40px 20px; margin: 0;"><div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><div style="background-color: #1A2332; padding: 24px 32px;"><h1 style="color: #F5F1E8; font-size: 20px; margin: 0; font-weight: normal;">Small World of Rugby</h1></div><div style="padding: 32px;"><h2 style="color: #1A2332; font-size: 18px; margin: 0 0 16px 0; font-weight: normal;">New profile awaiting review</h2><p style="color: #1A2332; opacity: 0.8; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">A new profile has been submitted and requires your review.</p><div style="background-color: #F5F1E8; border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="color: #1A2332; font-size: 14px; margin: 0 0 8px 0;"><strong>Profile:</strong> ${profileName}</p>${country ? `<p style="color: #1A2332; font-size: 14px; margin: 0;"><strong>Country:</strong> ${country}</p>` : ''}</div><a href="${dashboardUrl}" style="display: inline-block; background-color: #8B9D83; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px;">Review Profile</a></div><div style="background-color: #F5F1E8; padding: 16px 32px; border-top: 1px solid rgba(26,35,50,0.1);"><p style="color: #1A2332; opacity: 0.5; font-size: 12px; margin: 0; text-align: center;">You are receiving this because you are a steward.</p></div></div></body></html>`;
}

function generateStewardAssignedEmailHtml(stewardName: string, profileName: string, profileUrl: string, stewardAreaUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Georgia, serif; background-color: #F5F1E8; padding: 40px 20px; margin: 0;"><div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><div style="background-color: #1A2332; padding: 24px 32px;"><h1 style="color: #F5F1E8; font-size: 20px; margin: 0; font-weight: normal;">Small World of Rugby</h1></div><div style="padding: 32px;"><h2 style="color: #1A2332; font-size: 18px; margin: 0 0 16px 0; font-weight: normal;">You have been assigned as a steward</h2><p style="color: #1A2332; opacity: 0.8; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hello ${stewardName},</p><p style="color: #1A2332; opacity: 0.8; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">You have been assigned as a steward for the profile <strong>"${profileName}"</strong>.</p><p style="color: #1A2332; opacity: 0.7; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">You can take your time. Nothing goes live without approval.</p><div style="display: flex; gap: 12px; flex-wrap: wrap;"><a href="${profileUrl}" style="display: inline-block; background-color: #8B9D83; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; margin-right: 12px;">View Profile</a><a href="${stewardAreaUrl}" style="display: inline-block; background-color: #1A2332; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px;">Steward Dashboard</a></div></div><div style="background-color: #F5F1E8; padding: 16px 32px; border-top: 1px solid rgba(26,35,50,0.1);"><p style="color: #1A2332; opacity: 0.5; font-size: 12px; margin: 0; text-align: center;">This is an automated message from SWOR.</p></div></div></body></html>`;
}

function generateStewardDeactivatedEmailHtml(stewardName: string, profileName: string, profileUrl: string, note: string | null): string {
  const noteSection = note ? `<div style="background-color: #F5F1E8; border-radius: 8px; padding: 12px 16px; margin: 16px 0;"><p style="color: #1A2332; opacity: 0.7; font-size: 14px; margin: 0;"><strong>Note:</strong> ${note}</p></div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Georgia, serif; background-color: #F5F1E8; padding: 40px 20px; margin: 0;"><div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><div style="background-color: #1A2332; padding: 24px 32px;"><h1 style="color: #F5F1E8; font-size: 20px; margin: 0; font-weight: normal;">Small World of Rugby</h1></div><div style="padding: 32px;"><h2 style="color: #1A2332; font-size: 18px; margin: 0 0 16px 0; font-weight: normal;">Steward assignment update</h2><p style="color: #1A2332; opacity: 0.8; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hello ${stewardName},</p><p style="color: #1A2332; opacity: 0.8; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Your steward assignment for <strong>"${profileName}"</strong> has been deactivated.</p>${noteSection}<p style="color: #1A2332; opacity: 0.7; font-size: 14px; line-height: 1.6; margin: 16px 0 0 0;">You can take your time. Nothing goes live without approval.</p></div><div style="background-color: #F5F1E8; padding: 16px 32px; border-top: 1px solid rgba(26,35,50,0.1);"><p style="color: #1A2332; opacity: 0.5; font-size: 12px; margin: 0; text-align: center;">This is an automated message from SWOR.</p></div></div></body></html>`;
}

function generateApprovalEmailHtml(itemType: string, journeyTitle: string, journeyUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Georgia, serif; background-color: #F5F1E8; padding: 40px 20px; margin: 0;"><div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;"><div style="background-color: #1A2332; padding: 24px 32px;"><h1 style="color: #F5F1E8; font-size: 20px; margin: 0; font-weight: normal;">Small World of Rugby</h1></div><div style="padding: 32px;"><h2 style="color: #1A2332; font-size: 18px; margin: 0 0 16px 0; font-weight: normal;">Your contribution has been approved</h2><p style="color: #1A2332; opacity: 0.8; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Your ${itemType} for <strong>"${journeyTitle}"</strong> has been reviewed and approved.</p><a href="${journeyUrl}" style="display: inline-block; background-color: #8B9D83; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px;">View Journey</a></div></div></body></html>`;
}

function generateRejectionEmailHtml(itemType: string, journeyTitle: string, journeyUrl: string, rejectionNote: string | null): string {
  const noteSection = rejectionNote ? `<div style="background-color: #FEF3C7; border-left: 3px solid #F59E0B; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;"><p style="color: #92400E; font-size: 14px; margin: 0; font-style: italic;">"${rejectionNote}"</p></div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Georgia, serif; background-color: #F5F1E8; padding: 40px 20px; margin: 0;"><div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;"><div style="background-color: #1A2332; padding: 24px 32px;"><h1 style="color: #F5F1E8; font-size: 20px; margin: 0; font-weight: normal;">Small World of Rugby</h1></div><div style="padding: 32px;"><h2 style="color: #1A2332; font-size: 18px; margin: 0 0 16px 0; font-weight: normal;">Your contribution was not approved</h2><p style="color: #1A2332; opacity: 0.8; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Your ${itemType} for <strong>"${journeyTitle}"</strong> was not approved at this time.</p>${noteSection}<a href="${journeyUrl}" style="display: inline-block; background-color: #B8826D; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px;">View Journey</a></div></div></body></html>`;
}

function generateCommendationSubmittedEmailHtml(commenderName: string, recipientName: string, relationshipContext: string, dashboardUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Georgia, serif; background-color: #F5F1E8; padding: 40px 20px; margin: 0;"><div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;"><div style="background-color: #1A2332; padding: 24px 32px;"><h1 style="color: #F5F1E8; font-size: 20px; margin: 0; font-weight: normal;">Small World of Rugby</h1></div><div style="padding: 32px;"><h2 style="color: #1A2332; font-size: 18px; margin: 0 0 16px 0; font-weight: normal;">New commendation awaiting review</h2><div style="background-color: #F5F1E8; border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="color: #1A2332; font-size: 14px; margin: 0 0 8px 0;"><strong>From:</strong> ${commenderName}</p><p style="color: #1A2332; font-size: 14px; margin: 0 0 8px 0;"><strong>For:</strong> ${recipientName}</p><p style="color: #1A2332; font-size: 14px; margin: 0;"><strong>Relationship:</strong> ${relationshipContext}</p></div><a href="${dashboardUrl}" style="display: inline-block; background-color: #8B9D83; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px;">Review Commendation</a></div></div></body></html>`;
}

function generateCommendationApprovedEmailHtml(commenderName: string, relationshipContext: string, profileUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Georgia, serif; background-color: #F5F1E8; padding: 40px 20px; margin: 0;"><div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;"><div style="background-color: #1A2332; padding: 24px 32px;"><h1 style="color: #F5F1E8; font-size: 20px; margin: 0; font-weight: normal;">Small World of Rugby</h1></div><div style="padding: 32px;"><h2 style="color: #1A2332; font-size: 18px; margin: 0 0 16px 0; font-weight: normal;">Someone has written a commendation for you</h2><div style="background-color: #F5F1E8; border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="color: #1A2332; font-size: 14px; margin: 0 0 8px 0;"><strong>From:</strong> ${commenderName}</p><p style="color: #1A2332; font-size: 14px; margin: 0;"><strong>Relationship:</strong> ${relationshipContext}</p></div><a href="${profileUrl}" style="display: inline-block; background-color: #8B9D83; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px;">View Your Profile</a></div></div></body></html>`;
}

function generateCommendationRejectedEmailHtml(recipientName: string, rejectionReason: string | null): string {
  const reasonSection = rejectionReason ? `<div style="background-color: #FEF3C7; border-left: 3px solid #F59E0B; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;"><p style="color: #92400E; font-size: 14px; margin: 0;"><strong>Feedback:</strong></p><p style="color: #92400E; font-size: 14px; margin: 8px 0 0 0; font-style: italic;">"${rejectionReason}"</p></div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Georgia, serif; background-color: #F5F1E8; padding: 40px 20px; margin: 0;"><div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;"><div style="background-color: #1A2332; padding: 24px 32px;"><h1 style="color: #F5F1E8; font-size: 20px; margin: 0; font-weight: normal;">Small World of Rugby</h1></div><div style="padding: 32px;"><h2 style="color: #1A2332; font-size: 18px; margin: 0 0 16px 0; font-weight: normal;">Your commendation was not approved</h2><p style="color: #1A2332; opacity: 0.8; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Your commendation for <strong>${recipientName}</strong> was not approved at this time.</p>${reasonSection}</div></div></body></html>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {

      case 'write_audit_entry': {
        const p = payload || {};
        const { action_type, scope_type, target_label, details_json } = p;
        if (!action_type) {
          return new Response(JSON.stringify({ success: false, error: 'validation_error', detail: 'action_type is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        if (!scope_type) {
          return new Response(JSON.stringify({ success: false, error: 'validation_error', detail: 'scope_type is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        const stewardCheck = await verifyStewardFromRequest(req, supabase);
        let actor_user_id = stewardCheck.user_id || p.actor_user_id || null;
        let actor_email = stewardCheck.email || p.actor_email || 'unknown@system';
        if (stewardCheck.authenticated && !stewardCheck.is_steward) {
          return new Response(JSON.stringify({ success: false, error: 'forbidden', detail: 'Only stewards can write audit entries' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        if (!stewardCheck.authenticated) {
          const payloadEmail = (p.actor_email || '').toLowerCase();
          if (payloadEmail && GLOBAL_STEWARD_EMAILS.includes(payloadEmail)) {
            actor_email = payloadEmail;
            actor_user_id = p.actor_user_id || null;
          }
        }
        try {
          const { error: insertError } = await supabase.from('steward_audit_log').insert({
            action_type, actor_user_id: actor_user_id || null, actor_email, scope_type, target_id: p.target_id || null, target_label: target_label || null, details_json: details_json || null,
          });
          if (insertError) {
            return new Response(JSON.stringify({ success: false, error: 'insert_failed', detail: insertError.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
          }
          return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        } catch (insertErr) {
          return new Response(JSON.stringify({ success: false, error: 'internal_error', detail: insertErr.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
      }

      case 'send_test_email': {
        const { to_email, actor_user_id, actor_email } = payload || {};
        if (!to_email) {
          return new Response(JSON.stringify({ success: false, error: 'missing_email', detail: 'to_email is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        const emailHtml = generateTestEmailHtml(to_email);
        const result = await sendEmail(to_email, 'SWOR Test Email', emailHtml);
        await writeAuditLog(supabase, {
          action_type: result.success ? 'email.test_sent' : 'email.test_sent.failed',
          actor_user_id: actor_user_id || null, actor_email: actor_email || to_email, scope_type: 'system', target_label: to_email, details_json: { success: result.success, error: result.error || null, version: VERSION, sender_domain: VERIFIED_DOMAIN }
        });
        if (result.success) {
          return new Response(JSON.stringify({ success: true, message: 'Test email sent', version: VERSION, sender_domain: VERIFIED_DOMAIN }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        } else {
          return new Response(JSON.stringify({ success: false, error: 'send_failed', detail: result.error, version: VERSION, sender_domain: VERIFIED_DOMAIN }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
      }

      case 'get_steward_audit_log': {
        const { limit = 50, offset = 0, action_type_filter, date_from, date_to, search_query, scope_type_filter } = payload || {};
        let query = supabase.from('steward_audit_log').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
        if (action_type_filter && action_type_filter !== 'all') query = query.eq('action_type', action_type_filter);
        if (scope_type_filter && scope_type_filter !== 'all') query = query.eq('scope_type', scope_type_filter);
        if (date_from) query = query.gte('created_at', date_from);
        if (date_to) query = query.lte('created_at', date_to);
        if (search_query) query = query.or(`actor_email.ilike.%${search_query}%,target_label.ilike.%${search_query}%`);
        const { data, error, count } = await query;
        if (error) {
          return new Response(JSON.stringify({ success: false, error: 'query_failed', detail: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        return new Response(JSON.stringify({ success: true, entries: data || [], total: count || 0, version: VERSION }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'steward_assigned': {
        const { steward_email, steward_name, profile_name, profile_id, profile_url } = payload || {};
        if (!steward_email) {
          return new Response(JSON.stringify({ success: false, error: 'missing_email' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        let emailSent = false;
        let emailError = null;
        const stewardAreaUrl = `${PRODUCTION_BASE_URL}/steward`;
        const resolvedProfileUrl = profile_url || `${PRODUCTION_BASE_URL}/people/${profile_id}`;
        const resolvedName = steward_name || steward_email;

        let shouldSend = true;
        const { data: userProfile } = await supabase.from('profiles').select('user_id').eq('email', steward_email.toLowerCase()).single();
        if (userProfile?.user_id) {
          const prefs = await getUserNotificationPreferences(supabase, userProfile.user_id);
          shouldSend = prefs.email_steward_assigned !== false;
        }

        if (shouldSend) {
          try {
            const emailHtml = generateStewardAssignedEmailHtml(resolvedName, profile_name || 'a profile', resolvedProfileUrl, stewardAreaUrl);
            const r = await sendEmail(steward_email, `You have been assigned as a steward for "${profile_name || 'a profile'}"`, emailHtml);
            emailSent = r.success;
            if (!r.success) emailError = r.error;
          } catch (err) { emailError = err.message; }
        }

        await writeAuditLog(supabase, {
          action_type: emailSent ? 'notify.steward_assigned.sent' : 'notify.steward_assigned.failed',
          actor_user_id: null, actor_email: `system@${VERIFIED_DOMAIN}`, scope_type: 'system', target_id: profile_id || null, target_label: profile_name || null,
          details_json: { steward_email, steward_name: resolvedName, success: emailSent, error_code: emailError, preferences_checked: !!userProfile }
        });
        return new Response(JSON.stringify({ success: true, email_sent: emailSent }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'steward_deactivated': {
        const { steward_email, steward_name, profile_name, profile_id, profile_url, note } = payload || {};
        if (!steward_email) {
          return new Response(JSON.stringify({ success: false, error: 'missing_email' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        let emailSent = false;
        let emailError = null;
        const resolvedProfileUrl = profile_url || `${PRODUCTION_BASE_URL}/people/${profile_id}`;
        const resolvedName = steward_name || steward_email;

        let shouldSend = true;
        const { data: userProfile } = await supabase.from('profiles').select('user_id').eq('email', steward_email.toLowerCase()).single();
        if (userProfile?.user_id) {
          const prefs = await getUserNotificationPreferences(supabase, userProfile.user_id);
          shouldSend = prefs.email_steward_deactivated !== false;
        }

        if (shouldSend) {
          try {
            const emailHtml = generateStewardDeactivatedEmailHtml(resolvedName, profile_name || 'a profile', resolvedProfileUrl, note || null);
            const r = await sendEmail(steward_email, `Steward assignment update for "${profile_name || 'a profile'}"`, emailHtml);
            emailSent = r.success;
            if (!r.success) emailError = r.error;
          } catch (err) { emailError = err.message; }
        }

        await writeAuditLog(supabase, {
          action_type: emailSent ? 'notify.steward_deactivated.sent' : 'notify.steward_deactivated.failed',
          actor_user_id: null, actor_email: `system@${VERIFIED_DOMAIN}`, scope_type: 'system', target_id: profile_id || null, target_label: profile_name || null,
          details_json: { steward_email, steward_name: resolvedName, success: emailSent, error_code: emailError, note: note || null }
        });
        return new Response(JSON.stringify({ success: true, email_sent: emailSent }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'get_steward_activity_summary': {
        const { window_days = 30 } = payload || {};
        const windowDate = new Date();
        windowDate.setDate(windowDate.getDate() - window_days);
        const windowISO = windowDate.toISOString();

        const { data: entries, error: entriesError } = await supabase
          .from('steward_audit_log')
          .select('actor_email, action_type, created_at')
          .gte('created_at', windowISO)
          .in('action_type', ['profile.approved', 'profile.needs_changes', 'commendation.approved', 'commendation.rejected']);

        if (entriesError) {
          return new Response(JSON.stringify({ success: false, error: 'query_failed', detail: entriesError.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        const { data: allRecentEntries } = await supabase
          .from('steward_audit_log')
          .select('actor_email, created_at')
          .order('created_at', { ascending: false })
          .limit(500);

        const metricsMap: Record<string, { profiles_reviewed: number; commendations_processed: number; last_active: string | null }> = {};

        for (const entry of (entries || [])) {
          const email = (entry.actor_email || '').toLowerCase();
          if (!email || email === `system@${VERIFIED_DOMAIN}` || email === 'system@swor.rugby' || email === 'unknown@system') continue;
          if (!metricsMap[email]) metricsMap[email] = { profiles_reviewed: 0, commendations_processed: 0, last_active: null };
          if (entry.action_type === 'profile.approved' || entry.action_type === 'profile.needs_changes') {
            metricsMap[email].profiles_reviewed++;
          }
          if (entry.action_type === 'commendation.approved' || entry.action_type === 'commendation.rejected') {
            metricsMap[email].commendations_processed++;
          }
        }

        const lastActiveMap: Record<string, string> = {};
        for (const entry of (allRecentEntries || [])) {
          const email = (entry.actor_email || '').toLowerCase();
          if (!email || email === `system@${VERIFIED_DOMAIN}` || email === 'system@swor.rugby' || email === 'unknown@system') continue;
          if (!lastActiveMap[email]) lastActiveMap[email] = entry.created_at;
        }

        for (const email of Object.keys(lastActiveMap)) {
          if (!metricsMap[email]) metricsMap[email] = { profiles_reviewed: 0, commendations_processed: 0, last_active: null };
          metricsMap[email].last_active = lastActiveMap[email];
        }

        const { data: activeAssignments } = await supabase
          .from('steward_assignments')
          .select('steward_email')
          .eq('is_active', true);

        for (const a of (activeAssignments || [])) {
          const email = (a.steward_email || '').toLowerCase();
          if (email && !metricsMap[email]) {
            metricsMap[email] = { profiles_reviewed: 0, commendations_processed: 0, last_active: lastActiveMap[email] || null };
          }
        }

        const summary = Object.entries(metricsMap).map(([email, metrics]) => ({
          steward_email: email,
          ...metrics,
        }));

        return new Response(JSON.stringify({ success: true, summary, window_days, version: VERSION }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'contact_message_received': {
        const { message_id, sender_name, sender_email, subject, message, timestamp } = payload;
        const dashboardUrl = `${PRODUCTION_BASE_URL}/steward`;
        let emailsSent = 0; let emailsFailed = 0;
        const { data: globalStewards } = await supabase.from('roles').select('user_id').eq('role', 'global_steward');
        for (const steward of globalStewards || []) {
          try {
            const prefs = await getUserNotificationPreferences(supabase, steward.user_id);
            if (prefs.email_contact_message) {
              const email = await getUserEmail(supabase, steward.user_id);
              if (email) { const r = await sendEmail(email, `New contact message: ${subject}`, generateContactMessageEmailHtml(sender_name, sender_email, subject, message, timestamp || new Date().toISOString(), dashboardUrl)); if (r.success) emailsSent++; else emailsFailed++; }
            }
          } catch (err) { emailsFailed++; }
        }
        const { data: adminProfiles } = await supabase.from('profiles').select('user_id').in('role', ['admin', 'steward']);
        const notifiedUserIds = new Set((globalStewards || []).map((s: any) => s.user_id));
        for (const admin of adminProfiles || []) {
          if (notifiedUserIds.has(admin.user_id)) continue;
          try {
            const prefs = await getUserNotificationPreferences(supabase, admin.user_id);
            if (prefs.email_contact_message) {
              const email = await getUserEmail(supabase, admin.user_id);
              if (email) { const r = await sendEmail(email, `New contact message: ${subject}`, generateContactMessageEmailHtml(sender_name, sender_email, subject, message, timestamp || new Date().toISOString(), dashboardUrl)); if (r.success) emailsSent++; else emailsFailed++; }
            }
          } catch (err) { emailsFailed++; }
        }
        await writeAuditLog(supabase, { action_type: emailsSent > 0 ? 'notify.contact_message.sent' : 'notify.contact_message.failed', actor_user_id: null, actor_email: sender_email || `system@${VERIFIED_DOMAIN}`, scope_type: 'contact', target_id: message_id || null, target_label: subject, details_json: { to_stewards: emailsSent, failed: emailsFailed, sender_name, sender_email } });
        return new Response(JSON.stringify({ success: true, message: 'Stewards notified', emails_sent: emailsSent }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'profile_submitted': {
        const { profile_id, profile_name, country, stewards_to_notify } = payload;
        const dashboardUrl = `${PRODUCTION_BASE_URL}/steward`;
        let emailsSent = 0; let emailsFailed = 0;
        for (const steward of stewards_to_notify || []) {
          if (steward.email) { try { const r = await sendEmail(steward.email, `New profile "${profile_name}" awaiting review`, generateProfileSubmittedEmailHtml(profile_name, country, dashboardUrl)); if (r.success) emailsSent++; else emailsFailed++; } catch (err) { emailsFailed++; } }
        }
        const { data: globalStewards } = await supabase.from('roles').select('user_id').eq('role', 'global_steward');
        for (const steward of globalStewards || []) {
          try { const prefs = await getUserNotificationPreferences(supabase, steward.user_id); if (prefs.email_profile_submitted) { const email = await getUserEmail(supabase, steward.user_id); if (email) { const r = await sendEmail(email, `New profile "${profile_name}" awaiting review`, generateProfileSubmittedEmailHtml(profile_name, country, dashboardUrl)); if (r.success) emailsSent++; else emailsFailed++; } } } catch (err) { emailsFailed++; }
        }
        await writeAuditLog(supabase, { action_type: emailsSent > 0 ? 'notify.profile_submitted.sent' : 'notify.profile_submitted.failed', actor_user_id: null, actor_email: `system@${VERIFIED_DOMAIN}`, scope_type: 'profile', target_id: profile_id || null, target_label: profile_name, details_json: { to_stewards: emailsSent, failed: emailsFailed, country } });
        return new Response(JSON.stringify({ success: true, emails_sent: emailsSent }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'profile_approved': {
        const { profile_id, profile_name, owner_user_id } = payload;
        let emailSent = false; let emailError = null;
        if (owner_user_id) {
          try { const prefs = await getUserNotificationPreferences(supabase, owner_user_id); if (prefs.email_profile_approved) { const email = await getUserEmail(supabase, owner_user_id); if (email) { const r = await sendEmail(email, `Your profile "${profile_name}" has been approved`, generateProfileApprovedEmailHtml(profile_name, `${PRODUCTION_BASE_URL}/people/${profile_id}`)); emailSent = r.success; if (!r.success) emailError = r.error; } } } catch (err) { emailError = err.message; }
        }
        await writeAuditLog(supabase, { action_type: emailSent ? 'notify.profile_approved.sent' : 'notify.profile_approved.failed', actor_user_id: null, actor_email: `system@${VERIFIED_DOMAIN}`, scope_type: 'profile', target_id: profile_id || null, target_label: profile_name, details_json: { to_user: owner_user_id, success: emailSent, error_code: emailError } });
        return new Response(JSON.stringify({ success: true, email_sent: emailSent }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'profile_needs_changes': {
        const { profile_id, profile_name, owner_user_id, steward_note } = payload;
        let emailSent = false; let emailError = null;
        if (owner_user_id) {
          try { const prefs = await getUserNotificationPreferences(supabase, owner_user_id); if (prefs.email_profile_needs_changes) { const email = await getUserEmail(supabase, owner_user_id); if (email) { const r = await sendEmail(email, `Your profile "${profile_name}" needs some changes`, generateProfileNeedsChangesEmailHtml(profile_name, steward_note, `${PRODUCTION_BASE_URL}/profile-builder`)); emailSent = r.success; if (!r.success) emailError = r.error; } } } catch (err) { emailError = err.message; }
        }
        await writeAuditLog(supabase, { action_type: emailSent ? 'notify.profile_needs_changes.sent' : 'notify.profile_needs_changes.failed', actor_user_id: null, actor_email: `system@${VERIFIED_DOMAIN}`, scope_type: 'profile', target_id: profile_id || null, target_label: profile_name, details_json: { to_user: owner_user_id, success: emailSent, error_code: emailError, has_steward_note: !!steward_note } });
        return new Response(JSON.stringify({ success: true, email_sent: emailSent }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'contribution_submitted': {
        const { journey_id, contributor_name, item_type } = payload;
        const { data: stewards } = await supabase.from('roles').select('user_id, users(email)').eq('scope_id', journey_id).in('role', ['owner', 'steward']);
        const { data: globalStewards } = await supabase.from('roles').select('user_id, users(email)').eq('role', 'global_steward');
        const allStewards = [...(stewards || []), ...(globalStewards || [])];
        for (const steward of allStewards) { await supabase.from('notifications').insert({ user_id: steward.user_id, type: 'contribution_submitted', payload: { journey_id, contributor_name, item_type, message: `${contributor_name} has submitted a ${item_type} for review.` }, status: 'pending' }); }
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'commendation_submitted': {
        const { profile_id, commender_name, commender_email, recipient_name, relationship_context, commendation_id } = payload;
        const { data: profileStewards } = await supabase.from('steward_assignments').select('steward_user_id, steward_email, steward_name').eq('profile_id', profile_id).eq('is_active', true);
        const { data: globalStewards } = await supabase.from('roles').select('user_id').eq('role', 'global_steward');
        const stewardUserIds = new Set<string>(); const stewardEmails: string[] = [];
        for (const s of profileStewards || []) { if (s.steward_user_id) stewardUserIds.add(s.steward_user_id); if (s.steward_email) stewardEmails.push(s.steward_email); }
        for (const s of globalStewards || []) { if (s.user_id) stewardUserIds.add(s.user_id); }
        for (const userId of stewardUserIds) { await supabase.from('notifications').insert({ user_id: userId, type: 'commendation_submitted', payload: { profile_id, commendation_id, commender_name, recipient_name, relationship_context }, status: 'pending' }); }
        let emailsSent = 0; let emailsFailed = 0; const dashboardUrl = `${PRODUCTION_BASE_URL}/steward`;
        for (const userId of stewardUserIds) {
          try { const prefs = await getUserNotificationPreferences(supabase, userId); if (prefs.email_commendation_submitted) { const email = await getUserEmail(supabase, userId); if (email) { const r = await sendEmail(email, `New commendation for ${recipient_name}`, generateCommendationSubmittedEmailHtml(commender_name, recipient_name, relationship_context, dashboardUrl)); if (r.success) emailsSent++; else emailsFailed++; } } } catch (err) { emailsFailed++; }
        }
        for (const email of stewardEmails) { try { const r = await sendEmail(email, `New commendation for ${recipient_name}`, generateCommendationSubmittedEmailHtml(commender_name, recipient_name, relationship_context, dashboardUrl)); if (r.success) emailsSent++; else emailsFailed++; } catch (err) { emailsFailed++; } }
        await writeAuditLog(supabase, { action_type: emailsSent > 0 ? 'notify.commendation_submitted.sent' : 'notify.commendation_submitted.failed', actor_user_id: null, actor_email: commender_email || `system@${VERIFIED_DOMAIN}`, scope_type: 'commendation', target_id: commendation_id || null, target_label: recipient_name, details_json: { commender_name, to_stewards: emailsSent, failed: emailsFailed } });
        return new Response(JSON.stringify({ success: true, stewards_notified: stewardUserIds.size, emails_sent: emailsSent }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'commendation_approved': {
        const { profile_id, recipient_user_id, recipient_name, commender_name, relationship_context, commendation_id } = payload;
        if (recipient_user_id) { await supabase.from('notifications').insert({ user_id: recipient_user_id, type: 'commendation_approved', payload: { profile_id, commendation_id, commender_name, relationship_context }, status: 'pending' }); }
        let emailSent = false; let emailError = null;
        if (recipient_user_id) {
          try { const prefs = await getUserNotificationPreferences(supabase, recipient_user_id); if (prefs.email_commendation_approved) { const email = await getUserEmail(supabase, recipient_user_id); if (email) { const r = await sendEmail(email, 'Someone has written a commendation for you', generateCommendationApprovedEmailHtml(commender_name, relationship_context, `${PRODUCTION_BASE_URL}/people/${profile_id}`)); emailSent = r.success; if (!r.success) emailError = r.error; } } } catch (err) { emailError = err.message; }
        }
        await writeAuditLog(supabase, { action_type: emailSent ? 'notify.commendation_approved.sent' : 'notify.commendation_approved.failed', actor_user_id: null, actor_email: `system@${VERIFIED_DOMAIN}`, scope_type: 'commendation', target_id: commendation_id || null, target_label: recipient_name, details_json: { commender_name, to_user: recipient_user_id, success: emailSent, error_code: emailError } });
        return new Response(JSON.stringify({ success: true, email_sent: emailSent }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'commendation_rejected': {
        const { commender_user_id, commender_email, recipient_name, rejection_reason, commendation_id } = payload;
        if (commender_user_id) { await supabase.from('notifications').insert({ user_id: commender_user_id, type: 'commendation_rejected', payload: { commendation_id, recipient_name, rejection_reason }, status: 'pending' }); }
        let emailSent = false; let emailError = null;
        if (commender_user_id) {
          try { const prefs = await getUserNotificationPreferences(supabase, commender_user_id); if (prefs.email_commendation_rejected) { const email = await getUserEmail(supabase, commender_user_id); if (email) { const r = await sendEmail(email, `Your commendation for ${recipient_name} was not approved`, generateCommendationRejectedEmailHtml(recipient_name, rejection_reason)); emailSent = r.success; if (!r.success) emailError = r.error; } } } catch (err) { emailError = err.message; }
        }
        if (!emailSent && commender_email) { try { const r = await sendEmail(commender_email, `Your commendation for ${recipient_name} was not approved`, generateCommendationRejectedEmailHtml(recipient_name, rejection_reason)); emailSent = r.success; if (!r.success) emailError = r.error; } catch (err) { emailError = err.message; } }
        await writeAuditLog(supabase, { action_type: emailSent ? 'notify.commendation_rejected.sent' : 'notify.commendation_rejected.failed', actor_user_id: null, actor_email: `system@${VERIFIED_DOMAIN}`, scope_type: 'commendation', target_id: commendation_id || null, target_label: recipient_name, details_json: { commender_email, rejection_reason, success: emailSent, error_code: emailError } });
        return new Response(JSON.stringify({ success: true, email_sent: emailSent }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'legacy_mode_request': {
        const { journey_id, requester_email, requester_name, relationship } = payload;
        const { data: existingRequest } = await supabase.from('legacy_mode_requests').select('*').eq('journey_id', journey_id).eq('requester_email', requester_email).gte('cooldown_until', new Date().toISOString()).single();
        if (existingRequest) { return new Response(JSON.stringify({ success: false, message: 'A request is already pending.', cooldown_until: existingRequest.cooldown_until }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } }); }
        const cooldownDate = new Date(); cooldownDate.setDate(cooldownDate.getDate() + 14);
        const { data: newRequest, error } = await supabase.from('legacy_mode_requests').insert({ journey_id, requester_email, requester_name, relationship_to_person: relationship, cooldown_until: cooldownDate.toISOString(), status: 'pending' }).select().single();
        if (error) throw error;
        const { data: globalStewards } = await supabase.from('roles').select('user_id').eq('role', 'global_steward');
        for (const steward of globalStewards || []) { await supabase.from('notifications').insert({ user_id: steward.user_id, type: 'legacy_mode_request', payload: { request_id: newRequest.id, journey_id, requester_name, requester_email, relationship }, status: 'pending' }); }
        return new Response(JSON.stringify({ success: true, request_id: newRequest.id }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'approval_required': {
        const { journey_id, item_id, item_type } = payload;
        const { data: globalStewards } = await supabase.from('roles').select('user_id').eq('role', 'global_steward');
        for (const steward of globalStewards || []) { await supabase.from('notifications').insert({ user_id: steward.user_id, type: 'approval_required', payload: { journey_id, item_id, item_type }, status: 'pending' }); }
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'item_approved': {
        const { user_id, item_type, journey_title, journey_id, journey_slug } = payload;
        await supabase.from('notifications').insert({ user_id, type: 'item_approved', payload: { item_type, journey_title, journey_id }, status: 'pending' });
        let emailSent = false;
        try { const prefs = await getUserNotificationPreferences(supabase, user_id); if (prefs.email_on_approval) { const userEmail = await getUserEmail(supabase, user_id); if (userEmail) { const journeyUrl = journey_slug ? `${PRODUCTION_BASE_URL}/journeys/${journey_slug}` : `${PRODUCTION_BASE_URL}/journeys/${journey_id}`; const r = await sendEmail(userEmail, `Your contribution to "${journey_title}" has been approved`, generateApprovalEmailHtml(item_type, journey_title, journeyUrl)); emailSent = r.success; } } } catch (err) { console.error('[item_approved] Error:', err); }
        return new Response(JSON.stringify({ success: true, email_sent: emailSent }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'item_rejected': {
        const { user_id, item_type, journey_title, journey_id, journey_slug, rejection_note } = payload;
        await supabase.from('notifications').insert({ user_id, type: 'item_rejected', payload: { item_type, journey_title, journey_id, rejection_note }, status: 'pending' });
        let emailSent = false;
        try { const prefs = await getUserNotificationPreferences(supabase, user_id); if (prefs.email_on_rejection) { const userEmail = await getUserEmail(supabase, user_id); if (userEmail) { const journeyUrl = journey_slug ? `${PRODUCTION_BASE_URL}/journeys/${journey_slug}` : `${PRODUCTION_BASE_URL}/journeys/${journey_id}`; const r = await sendEmail(userEmail, `Update on your contribution to "${journey_title}"`, generateRejectionEmailHtml(item_type, journey_title, journeyUrl, rejection_note)); emailSent = r.success; } } } catch (err) { console.error('[item_rejected] Error:', err); }
        return new Response(JSON.stringify({ success: true, email_sent: emailSent }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'update_preferences': {
        const { user_id, ...prefs } = payload;
        if (!user_id) { return new Response(JSON.stringify({ success: false, error: 'user_id_required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }); }
        const { data, error } = await supabase.from('notification_preferences').upsert({ user_id, ...prefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select().single();
        if (error) { return new Response(JSON.stringify({ success: false, error: 'database_error', detail: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }); }
        return new Response(JSON.stringify({ success: true, data }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'get_preferences': {
        const { user_id } = payload;
        if (!user_id) { return new Response(JSON.stringify({ success: false, error: 'user_id_required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }); }
        const prefs = await getUserNotificationPreferences(supabase, user_id);
        return new Response(JSON.stringify({ success: true, preferences: prefs }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      default:
        return new Response(JSON.stringify({
          success: false, error: 'unknown_action', detail: `Unknown action: ${action}`, version: VERSION,
          available_actions: ['write_audit_entry', 'send_test_email', 'get_steward_audit_log', 'steward_assigned', 'steward_deactivated', 'get_steward_activity_summary', 'contribution_submitted', 'legacy_mode_request', 'approval_required', 'item_approved', 'item_rejected', 'commendation_submitted', 'commendation_approved', 'commendation_rejected', 'profile_submitted', 'profile_approved', 'profile_needs_changes', 'contact_message_received', 'update_preferences', 'get_preferences']
        }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
  } catch (error) {
    console.error('Notification error:', error);
    return new Response(JSON.stringify({ success: false, error: 'internal_error', detail: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});