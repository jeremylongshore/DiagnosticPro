# COMPREHENSIVE PAYMENT FLOW TESTING PLAN

## ✅ PRE-FLIGHT CHECKLIST

### 1. **Edge Function Secrets Verification**
- [x] STRIPE_WEBHOOK_SECRET - ✅ Configured
- [x] STRIPE_SECRET_KEY - ✅ Configured  
- [x] OPENAI_API_KEY - ✅ Configured
- [x] RESEND_API_KEY - ✅ Configured
- [x] HTMLCSS_API_KEY - ✅ Configured
- [x] SUPABASE_SERVICE_ROLE_KEY - ✅ Configured

### 2. **Database Tables Status**
- [x] diagnostic_submissions - ✅ Ready
- [x] orders - ✅ Ready  
- [x] email_logs - ✅ Ready

## 🔄 COMPLETE FLOW TEST PLAN

### PHASE 1: Submit Test Diagnostic
1. **Action**: Fill out diagnostic form on website
2. **Data**: Use test equipment info (different from your real Nissan)
3. **Email**: Use a test email you can access
4. **Expected**: Form submission creates diagnostic_submissions record

### PHASE 2: Payment Processing
1. **Action**: Complete Stripe payment ($29.99)
2. **Expected**: 
   - Stripe checkout session completes
   - Webhook receives `checkout.session.completed` event
   - Order record created in `orders` table with status 'paid'
   - Diagnostic submission updated with payment_status 'paid'

### PHASE 3: AI Analysis Trigger
1. **Expected**: Webhook automatically invokes `analyze-diagnostic` function
2. **Verification**: 
   - OpenAI API called with diagnostic data
   - Comprehensive analysis generated
   - Order record updated with analysis_completed_at timestamp

### PHASE 4: Email & PDF Generation
1. **Expected**: Webhook automatically invokes `send-diagnostic-email` function
2. **Verification**:
   - PDF report generated using HTMLCSS.to
   - Email sent via Resend API with PDF attachment
   - Email_logs record created with status 'sent'

### PHASE 5: Notifications
1. **Expected**: Slack notification sent (optional)
2. **Verification**: Sales team notified of payment

## 🚨 MONITORING POINTS

### Real-Time Monitoring During Test:
1. **Webhook Logs**: Monitor stripe-webhook function logs
2. **Analysis Logs**: Monitor analyze-diagnostic function logs  
3. **Email Logs**: Monitor send-diagnostic-email function logs
4. **Database**: Watch orders and email_logs tables

### Failure Points to Watch:
- [ ] Webhook signature verification
- [ ] Order/submission ID matching
- [ ] OpenAI API rate limits/errors
- [ ] PDF generation failures
- [ ] Email delivery issues

## 🔧 DEBUGGING TOOLS READY

### If Something Fails:
1. **Edge Function Logs**: Check each function's logs in Supabase
2. **Database Queries**: Verify record creation/updates
3. **Stripe Dashboard**: Confirm webhook delivery
4. **Manual Triggers**: Backup manual function calls if needed

## ⚡ CONFIDENCE LEVEL: HIGH

**Why I'm Confident This Will Work:**
- All secrets properly configured
- Database schema matches function expectations
- Error handling in place for each step
- Webhook properly structured to handle checkout.session.completed
- Functions tested individually

## 🎯 TEST PROCEDURE

1. **Start Test**: Submit diagnostic with test data
2. **Monitor**: Watch logs in real-time during payment
3. **Verify**: Check email delivery within 2-3 minutes
4. **Validate**: Confirm PDF attachment and analysis quality

**Ready when you are!** 🚀