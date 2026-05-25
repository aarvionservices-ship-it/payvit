import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  Scale, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../../../components/shared/SEO';

const SECTIONS = [
  {
    id: 'terms',
    title: 'Terms of Use',
    icon: FileText,
    content: "By accessing and using PayVit, you agree to comply with and be bound by the following terms and conditions. Our platform provides a marketplace for financial products including loans and insurance. We do not provide financial advice directly but act as an intermediary between you and our partner banks."
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    icon: Lock,
    content: "Your privacy is our priority. We collect personal data such as name, contact information, and financial history only to facilitate your loan applications. We use bank-grade 256-bit encryption to protect your data. We do not sell your personal information to third-party marketing companies."
  },
  {
    id: 'data',
    title: 'Data Protection',
    icon: ShieldCheck,
    content: "We adhere to international and local data protection laws (including GDPR and IT Act 2000). You have the right to request access to your data, correction of inaccuracies, and deletion of your profile where applicable under local regulations."
  },
  {
    id: 'compliance',
    title: 'Legal Compliance',
    icon: Scale,
    content: "PayVit is a regulated entity. We operate under the licenses required for financial intermediation. All transactions and applications are subject to the verification processes of our partner financial institutions."
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    icon: ShieldAlert,
    content: "Loan approvals and interest rates are determined solely by the partner banks based on your credit profile. PayVit does not guarantee approval for any financial product. Any information provided on this platform is for educational purposes only."
  }
];

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <SEO 
        title="Privacy Policy & Terms - PayVit Legal"
        description="Read our comprehensive company policy, terms of use, and data protection guidelines. We are committed to transparency and security."
      />
      
      {/* Header */}
      <section className="py-24 px-6 lg:px-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-12">
           <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                <ShieldCheck size={14} />
                Legal Transparency
              </div>
              <h1 className="text-4xl lg:text-6xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                Company <br />
                <span className="text-primary italic">Policies.</span>
              </h1>
           </div>
           <div className="flex-1 max-w-xl">
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                At PayVit, we believe in radical transparency. Our policies are designed to protect you and ensure you have the best experience while managing your finances.
              </p>
           </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 px-6 lg:px-20 max-w-5xl mx-auto">
        <div className="space-y-12">
          {SECTIONS.map((section, idx) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white dark:bg-slate-900 rounded-[3rem] p-12 border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-900/5"
            >
              <div className="flex items-center gap-6 mb-8">
                 <div className="size-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary shadow-inner">
                    <section.icon size={28} />
                 </div>
                 <h2 className="text-2xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white">
                   {section.title}
                 </h2>
              </div>
              
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-slate-400 font-bold leading-loose text-lg">
                  {section.content}
                </p>
                <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="flex gap-3 text-slate-400 italic text-sm font-medium">
                    <Info size={18} className="shrink-0" />
                    <span>Last updated: July 2024. This policy is subject to change at any time to comply with evolving financial regulations.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Grievance Redressal */}
      <section className="py-24 px-6 lg:px-20 bg-slate-900">
         <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-8">Grievance Redressal</h3>
            <p className="text-slate-400 font-bold leading-relaxed mb-12">
              For any concerns or disputes related to our services or data usage, you can contact our Grievance Officer at:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
               <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Email Support</p>
                  <p className="text-xl font-bold text-white italic">legal@payvit.com</p>
               </div>
               <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Nodal Officer</p>
                  <p className="text-xl font-bold text-white italic">nodal.officer@payvit.com</p>
               </div>
            </div>
         </div>
      </section>

      {/* Bottom Legal bar */}
      <section className="py-12 bg-white dark:bg-slate-950 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
            PayVit Fintech Solutions © 2024 • All Rights Reserved
         </p>
      </section>
    </div>
  );
}

