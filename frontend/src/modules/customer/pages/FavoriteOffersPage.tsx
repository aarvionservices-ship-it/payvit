import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Landmark, Percent, Banknote, Loader2 } from 'lucide-react';
import { getLoans } from '../../../api/loan.api';
import type { LoanModel } from '../../../types';
import { useAuthStore } from '../../../store/auth.store';
import { getProfileRequest, updateProfileRequest } from '../../../api/user.api';
import { toast } from 'react-hot-toast';

export default function FavoriteOffersPage() {
  const { user: authUser, setUser } = useAuthStore();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [allLoans, setAllLoans] = useState<LoanModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLoans, setLoadingLoans] = useState(true);

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
        try {
            setLoading(true);
            const profile = await getProfileRequest();
            const loadedFavs = profile.data?.favoriteOffers || profile.favoriteOffers || [];
            setFavorites(loadedFavs);
            if(authUser) {
                setUser({ ...authUser, favoriteOffers: loadedFavs });
            }
        } catch(err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
    
    if (authUser?.favoriteOffers) {
        setFavorites(authUser.favoriteOffers);
        setLoading(false);
    } else {
        fetchFavoriteStatus();
    }
  }, [authUser]);

  useEffect(() => {
    let isMounted = true;
    async function fetchAllLoans() {
      try {
        const response = await getLoans();
        if (response.success && isMounted) {
          const loansData = response.data?.data || (Array.isArray(response.data) ? response.data : []);
          setAllLoans(loansData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoadingLoans(false);
      }
    }
    fetchAllLoans();
    return () => { isMounted = false; };
  }, []);

  const removeFavorite = async (offerId: string) => {
    let newFavs = favorites.filter(id => id !== offerId);
    
    setFavorites(newFavs);
    if (authUser) {
        setUser({ ...authUser, favoriteOffers: newFavs });
    }

    try {
        await updateProfileRequest({ favoriteOffers: newFavs });
        toast.success("Removed from favorites");
    } catch(err) {
        toast.error('Could not update favorites');
        setFavorites(favorites);
        if (authUser) {
            setUser({ ...authUser, favoriteOffers: favorites });
        }
    }
  }

  const favoriteOffersList = allLoans.filter(offer => favorites.includes(offer._id!));

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-rose-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="size-12 bg-gradient-to-br from-rose-400 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <Heart className="size-6 fill-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Saved Offers</h1>
              <p className="text-slate-500 font-medium text-sm">Your favorite financial products</p>
            </div>
          </div>
        </div>

        {loading || loadingLoans ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-10 animate-spin text-rose-500" />
          </div>
        ) : favoriteOffersList.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
               <Heart className="size-10" />
             </div>
             <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">No saved offers</h3>
             <p className="text-sm font-medium text-slate-400">You haven't added any financial products to your favorites yet.</p>
             <Link to="/customer/offers" className="mt-6 px-6 py-2.5 bg-rose-500 text-white font-bold rounded-xl shadow-sm hover:bg-rose-600 transition-colors">
               Browse Offers
             </Link>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteOffersList.map((offer) => {
              const bgClass = offer.gradient || 'from-slate-500 to-slate-700';

              return (
              <div key={offer._id} className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col relative group">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${bgClass}`}></div>
                <button 
                  onClick={() => removeFavorite(offer._id!)}
                  className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors z-10 shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100" 
                  title="Remove Favorite"
                >
                  <Trash2 className="size-4" />
                </button>
                <div className="p-6 flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className={`size-14 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl border border-slate-200 flex items-center justify-center font-black text-slate-600 text-sm shadow-inner`}>
                      {offer.bankName?.substring(0, 4) || 'BANK'}
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate`}>{offer.loanName}</h3>
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <Landmark className="size-3.5" /> 
                      {offer.bankName}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Percent className="size-3" /> Rate</p>
                      <p className={`font-bold text-slate-900 text-lg leading-tight`}>{offer.interestRate?.min || 'Varies'}%</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Banknote className="size-3" /> Max Limit</p>
                      <p className="font-bold text-slate-900 text-lg leading-tight">₹{(offer.loanAmount?.max / 100000).toFixed(0)} L</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                  <Link to={`/customer/offers/${offer._id}`} className="flex-1 text-center py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                    View Details
                  </Link>
                  <Link to={`/customer/apply/${offer._id}`} className={`flex-1 text-center py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl transition-all shadow-md`}>
                    Apply Now
                  </Link>
                </div>
              </div>
            )})}
          </div>
        )}
      </main>
    </div>
  );
}

