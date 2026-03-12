import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Wallet, Plus, Shield, Zap, RefreshCw, CheckCircle, IndianRupee } from 'lucide-react'
import { fetchProfile, selectUser } from '../store/slices/authSlice'
import api from '../services/api'
import toast from 'react-hot-toast'

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000]

const WalletPage = () => {
  const dispatch    = useDispatch()
  const user        = useSelector(selectUser)
  const [amount,    setAmount]    = useState('')
  const [loading,   setLoading]   = useState(false)
  const [lastTxn,   setLastTxn]   = useState(null)

  const balance = user?.wallet?.balance || 0
  const locked  = user?.wallet?.locked  || 0

  // ── Load Razorpay script dynamically ────────────────────────────────────
  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true)
      const script    = document.createElement('script')
      script.src      = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload   = () => resolve(true)
      script.onerror  = () => resolve(false)
      document.body.appendChild(script)
    })

  // ── Main payment handler ──────────────────────────────────────────────────
  const handleTopUp = async () => {
    const amt = Number(amount)
    if (!amt || amt < 100) return toast.error('Minimum top-up is ₹100')
    if (amt > 100000)      return toast.error('Maximum top-up is ₹1,00,000')

    setLoading(true)
    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpay()
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your internet.')
        return
      }

      // 2. Create order on backend
      const { data } = await api.post('/payment/create-order', { amount: amt })

      // 3. Open Razorpay checkout
      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        order_id:    data.orderId,
        name:        'HubDrive',
        description: 'Wallet Top-up',
        image:       '/logo.png',
        prefill: {
          name:    user?.name,
          email:   user?.email,
          contact: user?.phone,
        },
        theme: { color: '#E8A020' },   // brand amber

        handler: async (response) => {
          // 4. Verify payment on backend and credit wallet
          try {
            const verify = await api.post('/payment/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              amount:              data.amount,
            })

            setLastTxn({
              id:     response.razorpay_payment_id,
              amount: amt,
            })
            setAmount('')
            toast.success(verify.data.message)

            // 5. Refresh wallet in Redux + navbar
            dispatch(fetchProfile())
          } catch {
            toast.error('Payment done but wallet credit failed. Contact support.')
          }
        },

        modal: {
          ondismiss: () => {
            toast('Payment cancelled', { icon: '⚠️' })
            setLoading(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`)
        setLoading(false)
      })
      rzp.open()

    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to initiate payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-[fadeUp_0.4s_ease_forwards]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <span className="section-eyebrow">Wallet</span>
        <h1 className="font-display text-3xl sm:text-5xl text-brand-cream">
          Your <span className="text-brand-amber">Balance</span>
        </h1>
      </div>

      {/* ── Balance card ────────────────────────────────────────────────────── */}
      <div className="card p-6 border border-brand-amber/20 bg-brand-amber/5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-mono text-xs tracking-widest text-brand-muted uppercase mb-1">Available Balance</p>
            <p className="font-display text-5xl text-brand-amber">
              ₹{balance.toLocaleString('en-IN')}
            </p>
          </div>
          <Wallet size={32} className="text-brand-amber/40" />
        </div>

        {locked > 0 && (
          <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-brand-muted" />
              <span className="font-mono text-xs text-brand-muted">Security Deposit (locked)</span>
            </div>
            <span className="font-mono text-sm text-brand-muted">₹{locked.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* ── Success banner ──────────────────────────────────────────────────── */}
      {lastTxn && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20">
          <CheckCircle size={20} className="text-green-400 shrink-0" />
          <div>
            <p className="text-sm text-green-400 font-medium">
              ₹{lastTxn.amount.toLocaleString('en-IN')} added successfully!
            </p>
            <p className="font-mono text-xs text-brand-muted mt-0.5">
              Payment ID: {lastTxn.id}
            </p>
          </div>
        </div>
      )}

      {/* ── Top-up form ─────────────────────────────────────────────────────── */}
      <div className="card p-6 border border-white/8 space-y-5">
        <h2 className="font-display text-2xl text-brand-cream">Add Money</h2>

        {/* Quick amounts */}
        <div>
          <p className="font-mono text-xs tracking-widest text-brand-muted uppercase mb-3">Quick Select</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map(a => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                className={`px-3 py-1.5 font-mono text-sm border transition-colors
                  ${Number(amount) === a
                    ? 'bg-brand-amber/20 border-brand-amber text-brand-amber'
                    : 'border-white/10 text-brand-muted hover:border-white/30 hover:text-brand-cream'
                  }`}
              >
                ₹{a.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div>
          <label className="input-label">Custom Amount (₹)</label>
          <div className="relative">
            <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="100"
              max="100000"
              className="input-field pl-9"
            />
          </div>
          <p className="font-mono text-xs text-brand-muted mt-1">Min ₹100 · Max ₹1,00,000</p>
        </div>

        {/* Pay button */}
        <button
          onClick={handleTopUp}
          disabled={loading || !amount || Number(amount) < 100}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Opening Payment...
            </>
          ) : (
            <>
              <Plus size={16} />
              Pay ₹{Number(amount) ? Number(amount).toLocaleString('en-IN') : '0'} via UPI / Card
            </>
          )}
        </button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 pt-2">
          {[
            { icon: Shield, text: '100% Secure' },
            { icon: Zap,    text: 'Instant Credit' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-brand-muted">
              <Icon size={13} />
              <span className="font-mono text-xs">{text}</span>
            </div>
          ))}
          <img
            src="https://razorpay.com/favicon.ico"
            alt="Razorpay"
            className="w-4 h-4 opacity-50"
          />
        </div>
      </div>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <div className="card p-5 border border-white/8">
        <h3 className="font-display text-lg text-brand-cream mb-3">How wallet works</h3>
        <div className="space-y-2">
          {[
            { step: '01', text: 'Add money via UPI, card or netbanking' },
            { step: '02', text: `₹2,000 security deposit is locked when you book` },
            { step: '03', text: 'Deposit is returned when trip completes' },
            { step: '04', text: 'Rental cost is charged separately to vendor' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="font-display text-brand-amber text-sm shrink-0">{step}</span>
              <p className="font-mono text-xs text-brand-muted leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WalletPage