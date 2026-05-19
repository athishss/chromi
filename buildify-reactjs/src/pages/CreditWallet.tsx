import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AnimatedContent from '../components/animated-content';
import SectionTitle from '../components/section-title';
import type { ICreditData, ICreditTransaction, IStakedDeposit } from '../../types';
import { WalletIcon, ArrowUpIcon, ArrowDownIcon, LockIcon, UnlockIcon, AlertTriangleIcon, GiftIcon, TrendingUpIcon, FlameIcon, ShieldAlertIcon, PiggyBankIcon, ArrowRightIcon, UserPlusIcon } from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: typeof ArrowUpIcon; color: string; label: string }> = {
    earn: { icon: ArrowUpIcon, color: 'text-[var(--success-text)]', label: 'Earned' },
    spend: { icon: ArrowDownIcon, color: 'text-[var(--error-text)]', label: 'Spent' },
    escrow_lock: { icon: LockIcon, color: 'text-amber-400', label: 'Escrow Locked' },
    escrow_release: { icon: UnlockIcon, color: 'text-blue-400', label: 'Escrow Released' },
    penalty: { icon: AlertTriangleIcon, color: 'text-[var(--error-text)]', label: 'Penalty' },
    bonus: { icon: GiftIcon, color: 'text-[var(--success-text)]', label: 'Bonus' },
    borrow: { icon: TrendingUpIcon, color: 'text-violet-400', label: 'Borrowed' },
    STAKE_DEPOSIT: { icon: LockIcon, color: 'text-amber-400', label: 'Staked' },
    STAKE_WITHDRAWAL: { icon: UnlockIcon, color: 'text-emerald-400', label: 'Stake Matured' },
    STAKE_SLASHED: { icon: ShieldAlertIcon, color: 'text-red-500', label: 'Slashed' },
};



export default function CreditWallet() {
    const [data, setData] = useState<ICreditData | null>(null);
    const [stakes, setStakes] = useState<IStakedDeposit[]>([]);
    const [loading, setLoading] = useState(true);
    const [borrowAmount, setBorrowAmount] = useState(1);
    const [borrowing, setBorrowing] = useState(false);
    
    // Staking State
    const [stakeAmount, setStakeAmount] = useState(1);
    const [lockPeriod, setLockPeriod] = useState<'1_week'|'1_month'>('1_week');
    const [autoCompound, setAutoCompound] = useState(false);
    const [staking, setStaking] = useState(false);
    const [withdrawingStakeId, setWithdrawingStakeId] = useState<string | null>(null);

    const [error, setError] = useState('');
    const { getAccessToken, user } = useAuth();

    useEffect(() => { load(); }, []);

    async function load() {
        try { 
            const [d, s] = await Promise.all([
                api.getCredits(getAccessToken),
                api.getStakes(getAccessToken).catch(() => [])
            ]);
            setData(d); 
            setStakes(s);
        }
        catch { /* ignore */ }
        finally { setLoading(false); }
    }

    async function handleBorrow() {
        setBorrowing(true); setError('');
        try {
            await api.borrowCredits(borrowAmount, getAccessToken);
            await load();
        } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Borrow failed'); }
        finally { setBorrowing(false); }
    }

    async function handleStake() {
        setStaking(true); setError('');
        try {
            await api.stakeCredits({ amount: stakeAmount, lock_period: lockPeriod, auto_compound: autoCompound }, getAccessToken);
            setStakeAmount(1);
            await load();
        } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Staking failed'); }
        finally { setStaking(false); }
    }

    async function handleWithdrawStake(stakeId: string) {
        setWithdrawingStakeId(stakeId); setError('');
        try {
            await api.withdrawStake(stakeId, getAccessToken);
            await load();
        } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Withdrawal failed'); }
        finally { setWithdrawingStakeId(null); }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen pt-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent)]" /></div>;

    return (
        <section className="px-4 md:px-16 lg:px-24 xl:px-32 pt-24 pb-16">
            <div className="max-w-4xl mx-auto">
                <SectionTitle dir="left" icon={WalletIcon} title="Credit Wallet" subtitle="Manage your time credits, view transactions, and borrow." />

                {error && <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-xl p-3 mt-4 text-[var(--error-text)] text-sm">{error}</div>}

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <AnimatedContent className="bg-[var(--accent)] rounded-2xl p-6 text-center">
                        <p className="text-xs uppercase tracking-widest text-[var(--accent-text)]/60 font-semibold mb-1">Available Balance</p>
                        <p className="font-urbanist text-4xl font-bold text-[var(--accent-text)]">
                            {(data?.balance ?? 0).toFixed(1)} <span className="text-lg">hrs</span>
                        </p>
                    </AnimatedContent>
                    <AnimatedContent delay={0.06} className="bg-[var(--bg-card)] rounded-2xl p-6 text-center border border-[var(--border)]">
                        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-1">Locked in Escrow</p>
                        <p className="font-urbanist text-4xl font-bold text-amber-400">
                            {(data?.locked_in_escrow ?? 0).toFixed(1)} <span className="text-lg">hrs</span>
                        </p>
                    </AnimatedContent>
                    <AnimatedContent delay={0.12} className="bg-[var(--bg-card)] rounded-2xl p-6 text-center border border-[var(--border)]">
                        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-1">Spending Power</p>
                        <p className="font-urbanist text-4xl font-bold">
                            {(data?.available_to_spend ?? 0).toFixed(1)} <span className="text-lg">hrs</span>
                        </p>
                    </AnimatedContent>
                </div>



                {/* Invite Friends Section */}
                <AnimatedContent className="mt-8 p-5 rounded-xl border border-[var(--border)] bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-muted)]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <h3 className="font-urbanist text-lg font-semibold mb-2 flex items-center gap-2">
                                <UserPlusIcon size={18} className="text-[var(--accent)]" /> Invite to Earn
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] mb-2">
                                Invite friends and earn <span className="font-bold text-[var(--accent)]">1.0 hour</span> for every 5 friends who complete their first exchange!
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                                <div className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono truncate">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${user?.id}` : ''}
                                </div>
                                <button onClick={(e) => {
                                    const link = `${window.location.origin}/signup?ref=${user?.id}`;
                                    navigator.clipboard.writeText(link);
                                    const btn = e.currentTarget;
                                    const oldHtml = btn.innerHTML;
                                    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>';
                                    setTimeout(() => btn.innerHTML = oldHtml, 2000);
                                }} className="p-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0" title="Copy Link">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                </button>
                            </div>
                        </div>
                        <div className="w-full md:w-48 shrink-0 bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)] text-center shadow-inner">
                            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Progress</p>
                            <p className="font-urbanist text-3xl font-bold text-[var(--text-primary)]">
                                {(data?.successful_referrals || 0) % 5} <span className="text-lg text-[var(--text-muted)]">/ 5</span>
                            </p>
                            <div className="w-full bg-[var(--bg-muted)] h-2 rounded-full mt-3 overflow-hidden">
                                <div className="bg-[var(--accent)] h-full transition-all duration-500" style={{ width: `${(((data?.successful_referrals || 0) % 5) / 5) * 100}%` }}></div>
                            </div>
                            <p className="text-[10px] text-[var(--text-secondary)] mt-2">Total Referrals: {data?.successful_referrals || 0}</p>
                        </div>
                    </div>
                </AnimatedContent>

                {/* Borrow & Stake Sections */}
                
                {/* Borrow Credits */}
                {data?.negative_allowed && (
                    <AnimatedContent className="mt-6 p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                        <h3 className="font-urbanist text-lg font-semibold mb-3 flex items-center gap-2">
                            <TrendingUpIcon size={18} className="text-violet-400" /> Borrow Credits
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">Need help now? You can borrow up to {Math.abs(data.max_negative || 5)}h against future earnings.</p>
                        <div className="flex gap-3 mt-auto">
                            <div className="flex items-center bg-[var(--bg-input)] border border-[var(--border)] rounded-xl overflow-hidden h-[44px]">
                                <button onClick={() => setBorrowAmount(Math.max(0.5, borrowAmount - 0.5))} className="px-3 hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-colors h-full flex items-center justify-center font-bold">
                                    -
                                </button>
                                <input type="number" min={0.5} max={Math.abs(data.max_negative || 5)} step={0.5} value={borrowAmount}
                                    onChange={e => setBorrowAmount(Math.max(0.5, Number(e.target.value)))}
                                    className="w-12 text-center bg-transparent text-[var(--text-primary)] font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                <button onClick={() => setBorrowAmount(Math.min(Math.abs(data.max_negative || 5), borrowAmount + 0.5))} className="px-3 hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-colors h-full flex items-center justify-center font-bold">
                                    +
                                </button>
                            </div>
                            <button onClick={handleBorrow} disabled={borrowing}
                                className="flex-1 py-2.5 px-6 bg-[var(--accent)] text-[var(--accent-text)] rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer h-[44px]">
                                {borrowing ? 'Borrowing...' : 'Borrow'}
                            </button>
                        </div>
                    </AnimatedContent>
                )}

                {/* Staking & Liquidity Pools */}
                <AnimatedContent delay={0.05} className="mt-6 p-6 rounded-xl border border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <PiggyBankIcon size={120} />
                    </div>
                    <h3 className="font-urbanist text-xl font-semibold mb-3 flex items-center gap-2 text-amber-500">
                        <FlameIcon size={20} /> Liquidity Staking
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6 relative z-10 max-w-xl">
                        Stake your idle credits to earn yields. Early unstaking incurs a 10% penalty on your principal.
                    </p>
                    
                    <div className="space-y-4 relative z-10 max-w-xl">
                        <div className="flex gap-2">
                            <button onClick={() => setLockPeriod('1_week')}
                                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${lockPeriod === '1_week' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)] hover:border-amber-500/50'}`}>
                                1 Week (7%)
                            </button>
                            <button onClick={() => setLockPeriod('1_month')}
                                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${lockPeriod === '1_month' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)] hover:border-amber-500/50'}`}>
                                1 Month (15%)
                            </button>
                        </div>

                        <div className="flex gap-3 items-center">
                            <div className="flex items-center bg-[var(--bg-input)] border border-amber-500/30 rounded-xl overflow-hidden h-[46px]">
                                <button onClick={() => setStakeAmount(Math.max(1, stakeAmount - 1))} className="px-3 hover:bg-amber-500/10 text-amber-500 transition-colors h-full flex items-center justify-center font-bold">
                                    -
                                </button>
                                <input type="number" min={1} step={1} value={stakeAmount}
                                    onChange={e => setStakeAmount(Math.max(1, Number(e.target.value)))}
                                    className="w-12 text-center bg-transparent text-[var(--text-primary)] font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                <button onClick={() => setStakeAmount(Math.min(data?.balance || 1, stakeAmount + 1))} className="px-3 hover:bg-amber-500/10 text-amber-500 transition-colors h-full flex items-center justify-center font-bold">
                                    +
                                </button>
                            </div>
                            
                            <button onClick={handleStake} disabled={staking || stakeAmount > (data?.balance || 0) || stakeAmount < 1}
                                className="flex-1 py-3 px-6 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20 h-[46px]">
                                {staking ? 'Staking...' : 'Stake Credits'}
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 p-4 rounded-xl bg-[var(--bg-input)]/50 border border-amber-500/10">
                            <div>
                                <p className="text-sm font-semibold text-amber-500/90">Auto-Compound Yields</p>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Automatically reinvest your principal and interest upon maturity.</p>
                            </div>
                            <button onClick={() => setAutoCompound(!autoCompound)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoCompound ? 'bg-amber-500' : 'bg-[var(--border)]'}`}
                                role="switch" aria-checked={autoCompound}>
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoCompound ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </AnimatedContent>

                {/* Active Stakes Dashboard */}
                {stakes.length > 0 && (
                    <div className="mt-8">
                        <h2 className="font-urbanist text-xl font-semibold mb-4 flex items-center gap-2">
                            <LockIcon size={20} className="text-amber-500" /> Active Stakes
                        </h2>
                        <div className="space-y-3">
                            {stakes.filter(s => s.status === 'active').map((stake, i) => {
                                const unlocksAt = new Date(stake.unlocks_at);
                                const isMatured = new Date() > unlocksAt;
                                
                                return (
                                    <AnimatedContent key={stake.id} delay={i * 0.05}
                                        className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="font-semibold text-lg flex items-center gap-2">
                                                {stake.amount}h <ArrowRightIcon size={14} className="text-[var(--text-muted)]" /> {(stake.amount + stake.expected_yield).toFixed(2)}h
                                            </p>
                                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                                Unlocks: <span className="font-medium text-[var(--text-primary)]">{unlocksAt.toLocaleDateString()}</span>
                                                {stake.auto_compound && <span className="ml-2 text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Auto-Compounding</span>}
                                            </p>
                                        </div>

                                        <div className="flex-shrink-0">
                                            {isMatured ? (
                                                <button onClick={() => handleWithdrawStake(stake.id)} disabled={withdrawingStakeId === stake.id}
                                                    className="w-full sm:w-auto py-2 px-5 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/20">
                                                    {withdrawingStakeId === stake.id ? 'Claiming...' : 'Claim Yield'}
                                                </button>
                                            ) : (
                                                <button onClick={() => {
                                                    if(confirm('WARNING: Emergency withdrawal incurs a 10% penalty on your principal and forfeits all interest. Are you sure?')) {
                                                        handleWithdrawStake(stake.id);
                                                    }
                                                }} disabled={withdrawingStakeId === stake.id}
                                                    className="w-full sm:w-auto py-2 px-4 border border-red-500/50 text-red-500 rounded-full text-xs font-semibold hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 cursor-pointer">
                                                    {withdrawingStakeId === stake.id ? 'Slashing...' : 'Emergency Withdraw (-10%)'}
                                                </button>
                                            )}
                                        </div>
                                    </AnimatedContent>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Transaction History */}
                <div className="mt-8">
                    <h2 className="font-urbanist text-xl font-semibold mb-4">Transaction History</h2>
                    {!data?.transactions?.length ? (
                        <p className="text-[var(--text-secondary)] text-sm py-8 text-center">No transactions yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {data.transactions.map((tx: ICreditTransaction, i: number) => {
                                let config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.earn;
                                
                                // Override UI for staking events (since we bypass the enum constraint)
                                if (tx.description.includes('Staked')) {
                                    config = { icon: LockIcon, color: 'text-amber-400', label: 'Staked' };
                                } else if (tx.description.includes('Emergency unstaked')) {
                                    config = { icon: ShieldAlertIcon, color: 'text-red-500', label: 'Slashed' };
                                } else if (tx.description.includes('Stake matured')) {
                                    config = { icon: UnlockIcon, color: 'text-emerald-400', label: 'Stake Matured' };
                                }

                                const Icon = config.icon;
                                return (
                                    <AnimatedContent key={tx.id} delay={i * 0.03}
                                        className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] flex items-center gap-4">
                                        <div className={`p-2 rounded-lg bg-[var(--bg-muted)] ${config.color}`}><Icon size={18} /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{tx.description}</p>
                                            <p className="text-xs text-[var(--text-muted)]">{new Date(tx.created_at).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`text-sm font-bold ${tx.amount >= 0 ? 'text-[var(--success-text)]' : 'text-[var(--error-text)]'}`}>
                                                {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(1)}h
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">{config.label}</p>
                                        </div>
                                    </AnimatedContent>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

