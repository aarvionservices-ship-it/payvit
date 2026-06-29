import { useState, useEffect, useRef } from "react"
import { 
    Wallet, 
    ArrowDownLeft, 
    ArrowUpRight, 
    Plus, 
    Send, 
    Search, 
    Check, 
    Loader2, 
    Calendar, 
    User, 
    ChevronLeft, 
    ChevronRight, 
    Info 
} from "lucide-react"
import toast from "react-hot-toast"
import { 
    getWalletRequest, 
    addMoneyRequest, 
    transferTokensRequest, 
    searchUserRequest 
} from "../../../api/wallet.api"

interface Transaction {
    _id: string
    type: "credit" | "debit"
    amount: number
    transactionType: "deposit" | "transfer"
    peerUserId?: string
    peerName?: string
    description: string
    status: string
    createdAt: string
}

interface WalletData {
    balance: number
    transactions: Transaction[]
    pagination: {
        total: number
        page: number
        limit: number
        pages: number
    }
}

export default function WalletPage() {
    const [wallet, setWallet] = useState<WalletData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)

    // Add money states
    const [addAmount, setAddAmount] = useState("")
    const [isAdding, setIsAdding] = useState(false)

    // Transfer states
    const [recipientInput, setRecipientInput] = useState("")
    const [transferAmount, setTransferAmount] = useState("")
    const [transferDesc, setTransferDesc] = useState("")
    const [isTransferring, setIsTransferring] = useState(false)
    
    // Recipient search states
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)

    const dropdownRef = useRef<HTMLDivElement>(null)

    // Fetch wallet details
    const fetchWallet = async (page = 1) => {
        try {
            const res = await getWalletRequest({ page, limit: 8 })
            if (res.success) {
                setWallet(res.data)
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to load wallet details")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchWallet(currentPage)
    }, [currentPage])

    // Close search dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Handle user search input
    const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setRecipientInput(val)
        setSelectedRecipient(null) // Reset selection if they edit

        if (val.length >= 3) {
            setIsSearching(true)
            setShowDropdown(true)
            try {
                const res = await searchUserRequest(val)
                if (res.success) {
                    setSearchResults(res.data)
                }
            } catch (err) {
                console.error("User search failed", err)
            } finally {
                setIsSearching(false)
            }
        } else {
            setSearchResults([])
            setShowDropdown(false)
        }
    }

    const selectRecipient = (recipient: any) => {
        setSelectedRecipient(recipient)
        setRecipientInput(`${recipient.name} (${recipient.email || recipient.phone})`)
        setShowDropdown(false)
    }

    // Add funds handler
    const handleAddMoney = async (e: React.FormEvent) => {
        e.preventDefault()
        const amount = parseFloat(addAmount)
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount greater than zero")
            return
        }

        setIsAdding(true)
        try {
            const res = await addMoneyRequest(amount)
            if (res.success) {
                toast.success(res.message || `Deposited ₹${amount} successfully!`)
                setAddAmount("")
                fetchWallet(currentPage)
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to add funds")
        } finally {
            setIsAdding(false)
        }
    }

    // Transfer handler
    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedRecipient) {
            toast.error("Please search and select a verified recipient first")
            return
        }
        
        const amount = parseFloat(transferAmount)
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid transfer amount")
            return
        }

        if (wallet && wallet.balance < amount) {
            toast.error("Insufficient wallet balance for this transfer")
            return
        }

        setIsTransferring(true)
        try {
            const res = await transferTokensRequest({
                recipient: selectedRecipient.userId,
                amount,
                description: transferDesc
            })
            if (res.success) {
                toast.success(res.message || "Transfer successful!")
                setTransferAmount("")
                setTransferDesc("")
                setRecipientInput("")
                setSelectedRecipient(null)
                fetchWallet(currentPage)
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Transfer failed")
        } finally {
            setIsTransferring(false)
        }
    }

    if (isLoading && !wallet) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-indigo-600">
                <Loader2 className="size-10 animate-spin" />
                <p className="mt-4 font-bold text-slate-500">Loading your PayVit Wallet...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 lg:space-y-8 pb-12">
            {/* Header Title */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">PayVit Digital Wallet</h1>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Manage, Load & Transfer PayVit Tokens pegged 1:1 with Indian Rupees (₹)</p>
            </div>

            {/* Top Grid: Balance and Add Money */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Large Balance Display Card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-indigo-600/20 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                    <div className="absolute -top-10 -right-10 size-40 bg-white/5 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 size-40 bg-purple-500/10 rounded-full blur-2xl"></div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                                <Wallet className="size-6 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Current Balance</p>
                                <p className="text-xs font-bold text-indigo-100/90 mt-0.5">PayVit Tokens</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/15">
                            Demo Active
                        </span>
                    </div>

                    <div className="relative z-10 my-4">
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-none">
                            {wallet?.balance.toLocaleString("en-IN") || 0} <span className="text-xl lg:text-2xl font-bold text-indigo-200">Tokens</span>
                        </h2>
                        <div className="flex items-center gap-2 mt-2 text-indigo-100 text-sm font-semibold opacity-95">
                            <span>Equivalent to:</span>
                            <span className="text-lg font-extrabold text-white">₹ {(wallet?.balance || 0).toLocaleString("en-IN")}.00</span>
                        </div>
                    </div>

                    <div className="relative z-10 pt-4 border-t border-white/10 flex items-center gap-2 text-indigo-200 text-xs">
                        <Info className="size-4 shrink-0" />
                        <span>1 Token = 1 Indian Rupee (₹). Balance is updated instantly upon transactions.</span>
                    </div>
                </div>

                {/* 2. Add Money Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mb-1">
                            <Plus className="size-5 text-indigo-600 bg-indigo-50 rounded-lg p-0.5" />
                            Load Wallet
                        </h3>
                        <p className="text-xs font-medium text-slate-400 mb-6 leading-relaxed">Top up your wallet instantly. Rs will be converted 1:1 into PayVit Tokens.</p>
                    </div>

                    <form onSubmit={handleAddMoney} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Amount in Rupees (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-base">₹</span>
                                <input 
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Enter amount"
                                    value={addAmount}
                                    onChange={(e) => setAddAmount(e.target.value)}
                                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-bold tracking-wide outline-none transition-all"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isAdding || !addAmount}
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:scale-[1.02] shadow-lg shadow-indigo-600/10 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
                        >
                            {isAdding ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" /> Load funds...
                                </>
                            ) : (
                                <>
                                    Add ₹ {addAmount || "0"} to Wallet
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Middle Grid: Send Money and Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Transfer Money Section */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-fit">
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mb-1">
                            <Send className="size-5 text-purple-600 bg-purple-50 rounded-lg p-0.5" />
                            Send Tokens
                        </h3>
                        <p className="text-xs font-medium text-slate-400 mb-6 leading-relaxed">Transfer tokens instantly to any PayVit user by their registered email or phone.</p>
                    </div>

                    <form onSubmit={handleTransfer} className="space-y-4">
                        {/* Search Recipient Box */}
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Recipient Email or Phone</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                                <input 
                                    type="text"
                                    placeholder="Search by name, email, or phone"
                                    value={recipientInput}
                                    onChange={handleSearchChange}
                                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-bold outline-none transition-all"
                                />
                                {selectedRecipient && (
                                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 size-4 bg-emerald-50 rounded-full p-0.5" />
                                )}
                                {isSearching && (
                                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 size-4 animate-spin" />
                                )}
                            </div>

                            {/* Dropdown Suggestions */}
                            {showDropdown && searchResults.length > 0 && (
                                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                                    {searchResults.map((user) => (
                                        <button
                                            type="button"
                                            key={user.userId}
                                            onClick={() => selectRecipient(user)}
                                            className="w-full text-left p-3 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                        >
                                            <div className="size-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-extrabold text-sm uppercase">
                                                {user.name?.[0]}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                                                <p className="text-[10px] font-medium text-slate-400 truncate">{user.email || user.phone}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {showDropdown && searchResults.length === 0 && recipientInput.length >= 3 && !isSearching && (
                                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-center text-xs font-bold text-slate-400">
                                    No registered user matches your search
                                </div>
                            )}
                        </div>

                        {/* Amount Box */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Token Amount to Send</label>
                            <div className="relative">
                                <input 
                                    type="number"
                                    min="1"
                                    placeholder="Number of tokens"
                                    value={transferAmount}
                                    onChange={(e) => setTransferAmount(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-bold tracking-wide outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Description Box */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Message / Note (Optional)</label>
                            <textarea 
                                placeholder="What is this for?"
                                value={transferDesc}
                                onChange={(e) => setTransferDesc(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs font-bold outline-none transition-all resize-none"
                            />
                        </div>

                        {selectedRecipient && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-800">
                                <User className="size-4 shrink-0" />
                                <div>
                                    <span className="font-bold">Recipient: </span>
                                    <span>{selectedRecipient.name}</span>
                                    <span className="text-[10px] font-bold block text-emerald-600 uppercase tracking-wide">Ready for transfer</span>
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={isTransferring || !selectedRecipient || !transferAmount}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:scale-[1.02] shadow-lg shadow-purple-600/10 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
                        >
                            {isTransferring ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" /> Transferring...
                                </>
                            ) : (
                                <>
                                    Send {transferAmount || "0"} Tokens
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* 2. Transaction Logs Section */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[480px]">
                    <div className="w-full">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                                <Calendar className="size-5 text-emerald-600 bg-emerald-50 rounded-lg p-0.5" />
                                Recent Transactions
                            </h3>
                            <span className="text-xs font-semibold text-slate-400">Total: {wallet?.pagination.total || 0}</span>
                        </div>

                        {wallet?.transactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3 border border-slate-100 shadow-inner">
                                    <Wallet className="size-8" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-700">No transactions yet</h4>
                                <p className="text-xs text-slate-400 max-w-[240px] mt-1 leading-relaxed">Deposit money or transfer tokens to populate your transaction logs.</p>
                            </div>
                        ) : (
                            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                                {wallet?.transactions.map((tx) => {
                                    const isCredit = tx.type === "credit"
                                    return (
                                        <div key={tx._id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 transition-colors">
                                            <div className="flex items-center gap-3.5 overflow-hidden">
                                                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                                    isCredit 
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5" 
                                                        : "bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-500/5"
                                                }`}>
                                                    {isCredit ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h4 className="text-xs font-extrabold text-slate-800 truncate leading-snug">
                                                        {tx.transactionType === "deposit" 
                                                            ? "Wallet Deposit" 
                                                            : isCredit 
                                                                ? `Received from ${tx.peerName || "User"}` 
                                                                : `Transferred to ${tx.peerName || "User"}`
                                                        }
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">
                                                        {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric"
                                                        })} • {new Date(tx.createdAt).toLocaleTimeString("en-IN", {
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })}
                                                    </p>
                                                    {tx.description && (
                                                        <p className="text-[10px] font-semibold text-slate-500 italic truncate mt-1">"{tx.description}"</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className={`text-sm font-black tracking-wide ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
                                                    {isCredit ? "+" : "-"} {tx.amount.toLocaleString("en-IN")}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Tokens</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {wallet && wallet.pagination.pages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Page {currentPage} of {wallet.pagination.pages}</span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-slate-200 hover:bg-slate-50 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none rounded-lg text-slate-600 transition-all cursor-pointer"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, wallet.pagination.pages))}
                                    disabled={currentPage === wallet.pagination.pages}
                                    className="p-2 border border-slate-200 hover:bg-slate-50 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none rounded-lg text-slate-600 transition-all cursor-pointer"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
