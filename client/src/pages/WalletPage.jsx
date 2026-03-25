import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Wallet, Plus, Shield, Zap, RefreshCw, CheckCircle,
  IndianRupee, ArrowDownLeft, Building, CreditCard,
  ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react'
import { fetchProfile, selectUser } from '../store/slices/authSlice'
import api from '../services/api'
import { formatINR } from '../utils/formatters'
import toast from 'react-hot-toast'

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000]

// ── Tab button ────────────────────────────────────────────────────────────────
const Tab = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={"flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-xs tracking-widest uppercase transition-colors " +
      (active ? 'bg-brand-amber text-brand-black' : 'text-brand-muted hover:text-brand-cream')}
  >
    <Icon size={14} /> {label}
  </button>
)

// ── Bank details form ─────────────────────────────────────────────────────────
const BankDetailsForm = ({ user, onSaved }) => {
  const [method,   setMethod]   = useState(user?.bankDetails?.upiId ? 'upi' : 'bank')
  const [upiId,    setUpiId]    = useState(user?.bankDetails?.upiId    || '')
  const [accName,  setAccName]  = useState(user?.bankDetails?.accountName || '')
  const [accNo,    setAccNo]    = useState(user?.bankDetails?.accountNo   || '')
  const [ifsc,     setIfsc]     = useState(user?.bankDetails?.ifsc        || '')
  const [saving,   setSaving]   = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/payment/save-bank', {
        upiId:       method === 'upi'  ? upiId   : undefined,
        accountName: method === 'bank' ? accName  : undefined,
        accountNo:   method === 'bank' ? accNo    : undefined,
        ifsc:        method === 'bank' ? ifsc     : undefined,
      })
      toast.success('Bank details saved')
      onSaved?.()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const hasSaved = user?.bankDetails?.upiId || user?.bankDetails?.accountNo

  return (
    <div className="space-y-4">
      {hasSaved && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20">
          <CheckCircle size={14} className="text-green-400 shrink-0" />
          <p className="font-mono text-xs text-green-400">
            {user.bankDetails.upiId
              ? `UPI: ${user.bankDetails.upiId}`
              : `Bank: ****${user.bankDetails.accountNo?.slice(-4)}`
            }
          </p>
        </div>
      )}

      {/* Method toggle */}
      <div className="flex bg-brand-mid/40 p-1 gap-1">
        {[['upi', 'UPI ID'], ['bank', 'Bank Account']].map(([m, label]) => (
          <button key={m} onClick={() => setMethod(m)}
            className={"flex-1 py-1.5 font-mono text-xs transition-colors " +
              (method === m ? 'bg-brand-amber/20 text-brand-amber' : 'text-brand-muted hover:text-brand-cream')}>
            {label}
          </button>
        ))}
      </div>

      {method === 'upi' ? (
        <div>
          <label className="input-label">UPI ID</label>
          <input
            value={upiId}
            onChange={e => setUpiId(e.target.value)}
            placeholder="yourname@upi"
            className="input-field font-mono"
          />
          <p className="font-mono text-[10px] text-brand-muted mt-1">
            e.g. 9876543210@paytm, name@gpay, name@ybl
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="input-label">Account Holder Name</label>
            <input value={accName} onChange={e => setAccName(e.target.value)}
              placeholder="Full name as on bank account" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Account Number</label>
              <input value={accNo} onChange={e => setAccNo(e.target.value)}
                placeholder="Account number" className="input-field font-mono" />
            </div>
            <div>
              <label className="input-label">IFSC Code</label>
              <input value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())}
                placeholder="SBIN0001234" className="input-field font-mono" />
            </div>
          </div>
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
        {saving
          ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
          : <><CheckCircle size={14} /> Save Details</>
        }
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const WalletPage = () => {
  const dispatch = useDispatch()
  const user     = useSelector(selectUser)

  const [tab,          setTab]          = useState('topup')   // 'topup' | 'withdraw'
  const [amount,       setAmount]       = useState('')
  const [loading,      setLoading]      = useState(false)
  const [lastTxn,      setLastTxn]      = useState(null)
  const [showBank,     setShowBank]     = useState(false)
  const [withdrawAmt,  setWithdrawAmt]  = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('upi')
  const [withdrawing,  setWithdrawing]  = useState(false)

  const balance = user?.wallet?.balance || 0
  const locked  = user?.wallet?.locked  || 0
  const hasBank = !!(user?.bankDetails?.upiId || user?.bankDetails?.accountNo)

  // ── Load Razorpay SDK ─────────────────────────────────────────────────────
  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) return resolve(true)
    const s   = document.createElement('script')
    s.src     = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

  // ── Top up ────────────────────────────────────────────────────────────────
  const handleTopUp = async () => {
    const amt = Number(amount)
    if (!amt || amt < 100) return toast.error('Minimum top-up is ₹100')
    if (amt > 100000)      return toast.error('Maximum top-up is ₹1,00,000')

    setLoading(true)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) { toast.error('Failed to load payment gateway'); return }

      const { data } = await api.post('/payment/create-order', { amount: amt })

      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        order_id:    data.orderId,
        name:        'HubDrive',
        description: 'Wallet Top-up',
        prefill:     { name: user?.name, email: user?.email, contact: user?.phone },
        theme:       { color: '#E8A020' },
        handler: async (response) => {
          try {
            const verify = await api.post('/payment/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              amount:              data.amount,
            })
            setLastTxn({ id: response.razorpay_payment_id, amount: amt, type: 'credit' })
            setAmount('')
            toast.success(verify.data.message)
            dispatch(fetchProfile())
          } catch {
            toast.error('Payment done but wallet credit failed. Contact support.')
          }
        },
        modal: {
          ondismiss: () => { toast('Payment cancelled', { icon: '⚠️' }); setLoading(false) },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (r) => {
        toast.error(`Payment failed: ${r.error.description}`)
        setLoading(false)
      })
      rzp.open()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to initiate payment')
    } finally {
      setLoading(false)
    }
  }

  // ── Withdraw ──────────────────────────────────────────────────────────────
  const handleWithdraw = async () => {
    const amt = Number(withdrawAmt)
    if (!amt || amt < 100)  return toast.error('Minimum withdrawal is ₹100')
    if (amt > balance)      return toast.error(`Insufficient balance (₹${balance} available)`)
    if (!hasBank)           return toast.error('Save your bank/UPI details first')

    if (!confirm(`Withdraw ₹${amt} to your ${withdrawMethod === 'upi'
      ? `UPI (${user.bankDetails.upiId})`
      : `bank account (****${user.bankDetails.accountNo?.slice(-4)})`}?`)) return

    setWithdrawing(true)
    try {
      const { data } = await api.post('/payment/withdraw', {
        amount: amt,
        method: withdrawMethod,
      })
      setLastTxn({ id: data.payoutId || 'manual', amount: amt, type: 'debit' })
      setWithdrawAmt('')
      toast.success(data.message)
      dispatch(fetchProfile())
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Withdrawal failed')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-[fadeUp_0.4s_ease_forwards]">

      {/* Header */}
      <div>
        <span className="section-eyebrow">Wallet</span>
        <h1 className="font-display text-3xl sm:text-5xl text-brand-cream">
          Your <span className="text-brand-amber">Balance</span>
        </h1>
      </div>

      {/* Balance card */}
      <div className="card p-6 border border-brand-amber/20 bg-brand-amber/5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-mono text-xs tracking-widest text-brand-muted uppercase mb-1">Available Balance</p>
            <p className="font-display text-5xl text-brand-amber">{formatINR(balance)}</p>
          </div>
          <Wallet size={32} className="text-brand-amber/40" />
        </div>
        {locked > 0 && (
          <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-brand-muted" />
              <span className="font-mono text-xs text-brand-muted">Security Deposit (locked)</span>
            </div>
            <span className="font-mono text-sm text-brand-muted">{formatINR(locked)}</span>
          </div>
        )}
      </div>

      {/* Last transaction */}
      {lastTxn && (
        <div className={"flex items-center gap-3 p-4 border " +
          (lastTxn.type === 'credit'
            ? 'bg-green-500/10 border-green-500/20'
            : 'bg-blue-500/10 border-blue-500/20')}>
          <CheckCircle size={20} className={lastTxn.type === 'credit' ? 'text-green-400' : 'text-blue-400'} />
          <div>
            <p className={"text-sm font-medium " + (lastTxn.type === 'credit' ? 'text-green-400' : 'text-blue-400')}>
              {lastTxn.type === 'credit'
                ? `₹${lastTxn.amount.toLocaleString('en-IN')} added successfully!`
                : `₹${lastTxn.amount.toLocaleString('en-IN')} withdrawal initiated!`
              }
            </p>
            {lastTxn.id !== 'manual' && (
              <p className="font-mono text-xs text-brand-muted mt-0.5">ID: {lastTxn.id}</p>
            )}
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex bg-brand-mid/40 p-1">
        <Tab active={tab === 'topup'}    onClick={() => setTab('topup')}    icon={Plus}          label="Add Money"  />
        <Tab active={tab === 'withdraw'} onClick={() => setTab('withdraw')} icon={ArrowDownLeft} label="Withdraw"   />
      </div>

      {/* ── Top-up tab ───────────────────────────────────────────────────── */}
      {tab === 'topup' && (
        <div className="card p-6 border border-white/8 space-y-5">
          <h2 className="font-display text-2xl text-brand-cream">Add Money</h2>

          {/* Quick amounts */}
          <div>
            <p className="font-mono text-xs tracking-widest text-brand-muted uppercase mb-3">Quick Select</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className={"px-3 py-1.5 font-mono text-sm border transition-colors " +
                    (Number(amount) === a
                      ? 'bg-brand-amber/20 border-brand-amber text-brand-amber'
                      : 'border-white/10 text-brand-muted hover:border-white/30 hover:text-brand-cream')}>
                  ₹{a.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Custom Amount (₹)</label>
            <div className="relative">
              <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount" min="100" max="100000"
                className="input-field pl-9" />
            </div>
            <p className="font-mono text-xs text-brand-muted mt-1">Min ₹100 · Max ₹1,00,000</p>
          </div>

          <button onClick={handleTopUp} disabled={loading || !amount || Number(amount) < 100}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {loading
              ? <><RefreshCw size={16} className="animate-spin" /> Opening Payment...</>
              : <><Plus size={16} /> Pay ₹{Number(amount) ? Number(amount).toLocaleString('en-IN') : '0'} via UPI / Card</>
            }
          </button>

          <div className="flex items-center justify-center gap-6 pt-2">
            {[{ icon: Shield, text: '100% Secure' }, { icon: Zap, text: 'Instant Credit' }].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-brand-muted">
                <Icon size={13} /><span className="font-mono text-xs">{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Withdraw tab ─────────────────────────────────────────────────── */}
      {tab === 'withdraw' && (
        <div className="space-y-4">

          {/* Bank details section */}
          <div className="card border border-white/8 overflow-hidden">
            <button
              onClick={() => setShowBank(!showBank)}
              className="w-full flex items-center justify-between p-5 hover:bg-white/3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building size={18} className="text-brand-amber" />
                <div className="text-left">
                  <p className="text-sm font-medium text-brand-cream">Bank / UPI Details</p>
                  <p className="font-mono text-xs text-brand-muted mt-0.5">
                    {hasBank
                      ? (user.bankDetails.upiId || `****${user.bankDetails.accountNo?.slice(-4)}`)
                      : 'Not configured — required for withdrawal'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasBank
                  ? <CheckCircle size={16} className="text-green-400" />
                  : <AlertTriangle size={16} className="text-brand-red" />
                }
                {showBank ? <ChevronUp size={16} className="text-brand-muted" /> : <ChevronDown size={16} className="text-brand-muted" />}
              </div>
            </button>

            {showBank && (
              <div className="px-5 pb-5 border-t border-white/8">
                <BankDetailsForm
                  user={user}
                  onSaved={() => { dispatch(fetchProfile()); setShowBank(false) }}
                />
              </div>
            )}
          </div>

          {/* Withdraw form */}
          <div className="card p-5 border border-white/8 space-y-4">
            <h2 className="font-display text-2xl text-brand-cream">Withdraw to Bank</h2>

            {!hasBank && (
              <div className="flex items-start gap-2 p-3 bg-brand-red/5 border border-brand-red/20">
                <AlertTriangle size={14} className="text-brand-red shrink-0 mt-0.5" />
                <p className="font-mono text-xs text-brand-red">
                  Add your UPI ID or bank account above before withdrawing.
                </p>
              </div>
            )}

            {/* Withdraw method */}
            {hasBank && (
              <div className="flex bg-brand-mid/40 p-1 gap-1">
                {user?.bankDetails?.upiId && (
                  <button onClick={() => setWithdrawMethod('upi')}
                    className={"flex-1 py-1.5 font-mono text-xs transition-colors " +
                      (withdrawMethod === 'upi' ? 'bg-brand-amber/20 text-brand-amber' : 'text-brand-muted hover:text-brand-cream')}>
                    UPI — {user.bankDetails.upiId}
                  </button>
                )}
                {user?.bankDetails?.accountNo && (
                  <button onClick={() => setWithdrawMethod('bank')}
                    className={"flex-1 py-1.5 font-mono text-xs transition-colors " +
                      (withdrawMethod === 'bank' ? 'bg-brand-amber/20 text-brand-amber' : 'text-brand-muted hover:text-brand-cream')}>
                    Bank ****{user.bankDetails.accountNo.slice(-4)}
                  </button>
                )}
              </div>
            )}

            <div>
              <label className="input-label">Amount (₹)</label>
              <div className="relative">
                <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input type="number" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)}
                  placeholder="Enter amount" min="100" max={balance}
                  className="input-field pl-9" />
              </div>
              <p className="font-mono text-xs text-brand-muted mt-1">
                Available: {formatINR(balance)} · Min ₹100
              </p>
            </div>

            {/* Quick withdraw */}
            <div className="flex gap-2 flex-wrap">
              {[500, 1000, 2000].filter(a => a <= balance).map(a => (
                <button key={a} onClick={() => setWithdrawAmt(String(a))}
                  className="px-3 py-1 font-mono text-xs border border-white/10 text-brand-muted hover:border-white/30 hover:text-brand-cream transition-colors">
                  ₹{a.toLocaleString('en-IN')}
                </button>
              ))}
              {balance >= 100 && (
                <button onClick={() => setWithdrawAmt(String(balance))}
                  className="px-3 py-1 font-mono text-xs border border-white/10 text-brand-muted hover:border-white/30 hover:text-brand-cream transition-colors">
                  All ({formatINR(balance)})
                </button>
              )}
            </div>

            <button
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawAmt || Number(withdrawAmt) < 100 || !hasBank || Number(withdrawAmt) > balance}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40"
            >
              {withdrawing
                ? <><RefreshCw size={16} className="animate-spin" /> Processing...</>
                : <><ArrowDownLeft size={16} /> Withdraw ₹{Number(withdrawAmt) ? Number(withdrawAmt).toLocaleString('en-IN') : '0'}</>
              }
            </button>

            <p className="font-mono text-[10px] text-brand-muted text-center leading-relaxed">
              UPI: Instant · Bank (NEFT): 1–3 business days
            </p>
          </div>

          {/* How it works */}
          <div className="card p-5 border border-white/8">
            <h3 className="font-display text-lg text-brand-cream mb-3">How wallet works</h3>
            <div className="space-y-2">
              {[
                { step: '01', text: 'Add money via UPI, card or netbanking' },
                { step: '02', text: `Security deposit is locked when you book` },
                { step: '03', text: 'Deposit returned automatically when trip completes' },
                { step: '04', text: 'Withdraw anytime to your UPI or bank account' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="font-display text-brand-amber text-sm shrink-0">{step}</span>
                  <p className="font-mono text-xs text-brand-muted leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletPage