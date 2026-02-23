# PayMongo Checkout Integration - Deployment Guide

## ✅ Natapos Na (Completed)

Ang PayMongo checkout integration ay kumpleto na at ready for deployment!

## 📋 Mga Kailangan I-deploy (Deployment Requirements)

### 1. Edge Functions

Dalawang Edge Functions ang kailangan i-deploy sa Supabase:

#### A. `create-checkout` Function
- **Location**: `supabase/functions/create-checkout/index.ts`
- **Purpose**: Creates PayMongo checkout session
- **Endpoint**: `/functions/v1/create-checkout`

#### B. `paymongo-webhook` Function  
- **Location**: `supabase/functions/paymongo-webhook/index.ts`
- **Purpose**: Handles PayMongo webhook events for completed payments
- **Endpoint**: `/functions/v1/paymongo-webhook`

### 2. Environment Variables sa Supabase

Kailangan i-set sa Supabase Dashboard → Settings → Edge Functions:

```
PAYMONGO_SECRET_KEY=YOUR_PAYMONGO_SECRET_KEY
```

**Note**: Ang `SUPABASE_URL`, `SUPABASE_ANON_KEY`, at `SUPABASE_SERVICE_ROLE_KEY` ay automatic na available sa Edge Functions.

## 🚀 Deployment Steps

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (kung wala pa):
```bash
npm install -g supabase
```

2. **Login to Supabase**:
```bash
supabase login
```

3. **Link to your project**:
```bash
supabase link --project-ref jfdvbyoyvqriqhqtmyjo
```

4. **Deploy Edge Functions**:
```bash
supabase functions deploy create-checkout
supabase functions deploy paymongo-webhook
```

5. **Set Environment Secrets**:
```bash
supabase secrets set PAYMONGO_SECRET_KEY=YOUR_PAYMONGO_SECRET_KEY
```

### Option 2: Manual Deployment sa Supabase Dashboard

1. **Go to Supabase Dashboard** → Edge Functions
2. **Create new function** named `create-checkout`
3. **Copy-paste** ang code from `supabase/functions/create-checkout/index.ts`
4. **Repeat** para sa `paymongo-webhook`
5. **Set secrets** sa Settings → Edge Functions

## 🔗 PayMongo Webhook Configuration

After deploying the webhook function:

1. **Get webhook URL**: `https://jfdvbyoyvqriqhqtmyjo.supabase.co/functions/v1/paymongo-webhook`

2. **Register webhook sa PayMongo** (pwede mo i-run ang `register_webhook.js`):
```bash
node register_webhook.js
```

O manually register sa PayMongo Dashboard:
- **Webhook URL**: `https://jfdvbyoyvqriqhqtmyjo.supabase.co/functions/v1/paymongo-webhook`
- **Events to listen**: `checkout_session.payment.paid`

## ✅ Verification

### Test ang checkout flow:

1. **Open app**: http://localhost:3000
2. **Sign in** (any username/password)
3. **Add product to cart**
4. **Click checkout**
5. **Click "Initialize Payment"**
6. **PayMongo modal** dapat mag-appear
7. **Complete payment** using test payment method

### Test Cards (PayMongo Test Mode):

**Successful Payment:**
- Card: `4343434343434345`
- Expiry: Any future date
- CVC: Any 3 digits

**Failed Payment:**
- Card: `4571736000000075`

## 🎯 Current Status

✅ **Frontend**: PayMongo modal component - DONE
✅ **App Integration**: Checkout flow with PayMongo - DONE  
✅ **Edge Functions**: Created and ready - DONE
✅ **Payment Methods**: QRPh, GCash, GrabPay, Maya - ACTIVE

⏳ **Pending**: Edge Functions deployment to Supabase

## 📝 Notes

- Ang error na "Payment method is not configured" ay dahil wala pa deployed na Edge Function
- Once na-deploy na, ang checkout ay gagana agad
- Webhook ay optional pero recommended para sa automatic order creation
- Test mode muna ang ginamit - for production, i-update ang API key sa production key

## 🔧 Troubleshooting

**Kung hindi gumagana after deployment:**

1. **Check Edge Function logs** sa Supabase Dashboard
2. **Verify PAYMONGO_SECRET_KEY** na naka-set correctly
3. **Test ang function directly**:
```bash
curl -X POST https://jfdvbyoyvqriqhqtmyjo.supabase.co/functions/v1/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"items":[{"id":"1","name":"Test","price":100,"quantity":1}],"user_id":"test","username":"test"}'
```

4. **Check PayMongo Dashboard** for any account-level restrictions
