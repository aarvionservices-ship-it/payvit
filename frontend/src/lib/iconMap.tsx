import { 
  ShieldCheck, 
  Briefcase, 
  Plane, 
  ShoppingBag, 
  Fuel, 
  Coffee, 
  Utensils, 
  Crown, 
  Globe, 
  Star,
  Gift,
  Zap,
  TrendingUp,
  Award,
  BadgePercent,
  Tickets,
  Smartphone,
  ShieldAlert,
  Sparkles
} from "lucide-react";

export const getFeatureIcon = (feature: string) => {
  const f = feature.toLowerCase();
  
  if (f.includes('lounge')) return Plane;
  if (f.includes('forex') || f.includes('markup')) return Globe;
  if (f.includes('reward')) return Star;
  if (f.includes('cashback') || f.includes('savings')) return BadgePercent;
  if (f.includes('fuel') || f.includes('surcharge')) return Fuel;
  if (f.includes('dining') || f.includes('zomato') || f.includes('swiggy')) return Utensils;
  if (f.includes('movie') || f.includes('tickets')) return Tickets;
  if (f.includes('welcome')) return Gift;
  if (f.includes('milestone')) return Award;
  if (f.includes('insurance')) return ShieldCheck;
  if (f.includes('waiver')) return Zap;
  if (f.includes('limit')) return TrendingUp;
  if (f.includes('concierge')) return Briefcase;
  if (f.includes('golf')) return Crown;
  if (f.includes('travel')) return Plane;
  if (f.includes('lifestyle')) return Coffee;
  if (f.includes('shopping')) return ShoppingBag;
  if (f.includes('amazon') || f.includes('flipkart') || f.includes('myntra')) return ShoppingBag;
  if (f.includes('mobile') || f.includes('recharge') || f.includes('bill')) return Smartphone;
  if (f.includes('safe') || f.includes('secure')) return ShieldAlert;
  if (f.includes('sparkle') || f.includes('premium')) return Sparkles;
  
  return Star;
};

export const getFeatureColor = (feature: string) => {
  const f = feature.toLowerCase();
  
  if (f.includes('lounge') || f.includes('travel')) return "bg-blue-50 text-blue-600 border-blue-100";
  if (f.includes('forex') || f.includes('markup') || f.includes('global')) return "bg-violet-50 text-violet-600 border-violet-100";
  if (f.includes('reward') || f.includes('points')) return "bg-amber-50 text-amber-600 border-amber-100";
  if (f.includes('cashback') || f.includes('savings')) return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (f.includes('fuel') || f.includes('surcharge')) return "bg-orange-50 text-orange-600 border-orange-100";
  if (f.includes('dining') || f.includes('food')) return "bg-red-50 text-red-600 border-red-100";
  if (f.includes('movie') || f.includes('tickets')) return "bg-rose-50 text-rose-600 border-rose-100";
  if (f.includes('welcome') || f.includes('gift')) return "bg-pink-50 text-pink-600 border-pink-100";
  if (f.includes('milestone') || f.includes('award')) return "bg-indigo-50 text-indigo-600 border-indigo-100";
  if (f.includes('concierge') || f.includes('premium')) return "bg-slate-900/5 text-slate-900 border-slate-200";
  
  return "bg-slate-50 text-slate-600 border-slate-100";
};

