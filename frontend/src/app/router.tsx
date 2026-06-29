import { Routes, Route, Navigate } from "react-router-dom"

// Layouts
import AdminLayout from "../layouts/AdminLayout"
import EmployeeLayout from "../layouts/EmployeeLayout"
import CustomerLayout from "../layouts/CustomerLayout"
import PublicLayout from "../modules/public/components/PublicLayout"

// Guards
import AuthGuard from "./guards/AuthGuard"
import AdminGuard from "./guards/AdminGuard"
import EmployeeGuard from "./guards/EmployeeGuard"
import CustomerGuard from "./guards/CustomerGuard"
import GuestGuard from "./guards/GuestGuard"

// Common Pages
import UnauthorizedPage from "../pages/UnauthorizedPage"
import OfflinePage from "../pages/OfflinePage"

// Public Pages
import LandingPage from "../modules/public/pages/LandingPage"
import LoginPage from "../modules/public/pages/LoginPage"
import AdminLoginPage from "../modules/public/pages/AdminLoginPage"
import EmployeeLoginPage from "../modules/public/pages/EmployeeLoginPage"
import RegisterPage from "../modules/public/pages/RegisterPage"
import PublicOffersPage from "../modules/public/pages/OffersPage"
import PublicOfferDetailsPage from "../modules/public/pages/OfferDetailsPage"
import ForgotPasswordPage from "../modules/public/pages/ForgotPasswordPage"
import ResetPasswordPage from "../modules/public/pages/ResetPasswordPage"
import CardPage from "../pages/CardPage"
import { CategoryPage } from "../pages/CategoryPage"
import { CardDetailsPage } from "../pages/CardDetailsPage"
import LoanPage from "../pages/LoanPage"
import LoanDetailsPage from "../pages/LoanDetailsPage"
import LoanComparePage from "../modules/public/pages/LoanComparePage"
import CardComparePage from "../modules/public/pages/CardComparePage"
import CalculatorsPage from "../modules/public/pages/calculators/CalculatorsPage"
import EmiCalculator from "../modules/public/pages/calculators/EmiCalculator"
import CreditCardCalculator from "../modules/public/pages/calculators/CreditCardCalculator"
import SipCalculator from "../modules/public/pages/calculators/SipCalculator"
import LoanEligibilityCalculator from "../modules/public/pages/calculators/LoanEligibilityCalculator"
import RechargePage from "../modules/public/pages/RechargePage"
import BillPaymentPage from "../modules/public/pages/BillPaymentPage"
import TicketBookingPage from "../modules/public/pages/TicketBookingPage"
import AboutPage from "../modules/public/pages/AboutPage"
import PolicyPage from "../modules/public/pages/PolicyPage"
import BlogListPage from "../modules/public/pages/BlogListPage"
import BlogDetailsPage from "../modules/public/pages/BlogDetailsPage"

// Admin Pages
import AdminDashboardPage from "../modules/admin/pages/AdminDashboardPage"
import AdminAnalyticsPage from "../modules/admin/pages/AnalyticsPage"
import AdminEmployeesPage from "../modules/admin/pages/EmployeesPage"
import AdminEmployeeRegisterPage from "../modules/admin/pages/EmployeeRegisterPage"
import AdminEmployeeDetailsPage from "../modules/admin/pages/EmployeeDetailsPage"
import AdminCustomersPage from "../modules/admin/pages/CustomersPage"
import AdminCustomerDetailsPage from "../modules/admin/pages/CustomerDetailsPage"
import AdminLeadsPage from "../modules/admin/pages/LeadsPage"
import AdminLeadDetailsPage from "../modules/admin/pages/LeadDetailsPage"
import AdminLoansPage from "../modules/admin/pages/LoansPage"
import AdminCreateLoanPage from "../modules/admin/pages/CreateLoanPage"
import AdminEditLoanPage from "../modules/admin/pages/EditLoanPage"
import AdminProfilePage from "../modules/admin/pages/ProfilePage"
import AdminSettingsPage from "../modules/admin/pages/SettingsPage"
import AdminCardsPage from "../modules/admin/pages/CardsPage"
import AdminCreateCardPage from "../modules/admin/pages/CreateCardPage"
import AdminBlogsPage from "../modules/admin/pages/BlogsPage"
import AdminCreateBlogPage from "../modules/admin/pages/CreateBlogPage"
import AdminEmailTemplatesPage from "../modules/admin/pages/EmailTemplatesPage"

// Employee Pages
import EmployeeDashboardPage from "../modules/employee/pages/EmployeeDashboardPage"
import EmployeeLeadsPage from "../modules/employee/pages/LeadsPage"
import EmployeeLeadDetailsPage from "../modules/employee/pages/LeadDetailsPage"
import EmployeeCallHistoryPage from "../modules/employee/pages/CallHistoryPage"
import EmployeePerformancePage from "../modules/employee/pages/MyPerformancePage"
import EmployeeProfilePage from "../modules/employee/pages/ProfilePage"
import EmployeeCreateLeadPage from "../modules/employee/pages/CreateLeadPage"

// Customer Pages
import CustomerDashboardPage from "../modules/customer/pages/CustomerDashboardPage"
import CustomerOffersPage from "../modules/customer/pages/OffersPage"
import CustomerOfferDetailsPage from "../modules/customer/pages/OfferDetailsPage"
import CustomerFavoriteOffersPage from "../modules/customer/pages/FavoriteOffersPage"
import CustomerApplicationsPage from "../modules/customer/pages/MyApplicationsPage"
import CustomerApplicationDetailsPage from "../modules/customer/pages/ApplicationDetailsPage"
import CustomerProfilePage from "../modules/customer/pages/ProfilePage"
import CustomerApplyLoanPage from "../modules/customer/pages/ApplyLoanPage"
import CompleteProfilePage from "../modules/customer/pages/CompleteProfilePage"
import UtilityServicesPage from "../modules/customer/pages/UtilityServicesPage"

export default function AppRouter() {
    return (
        <Routes>
            {/* PUBLIC ROUTES */}
            <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/offers" element={<PublicOffersPage />} />
                <Route path="/offers/:id" element={<PublicOfferDetailsPage />} />
                <Route path="/cards" element={<CardPage />} />
                <Route path="/cards/compare" element={<CardComparePage />} />
                <Route path="/cards/:categoryId" element={<CategoryPage />} />
                <Route path="/card/:cardId" element={<CardDetailsPage />} />
                <Route path="/loans" element={<LoanPage />} />
                <Route path="/loans/compare" element={<LoanComparePage />} />
                <Route path="/loan/:loanId" element={<LoanDetailsPage />} />
                
                {/* Calculator Routes */}
                <Route path="/calculators" element={<CalculatorsPage />} />
                <Route path="/calculators/emi" element={<EmiCalculator />} />
                <Route path="/calculators/credit-card" element={<CreditCardCalculator />} />
                <Route path="/calculators/sip" element={<SipCalculator />} />
                <Route path="/calculators/loan-eligibility" element={<LoanEligibilityCalculator />} />
                <Route path="/recharge" element={<RechargePage />} />
                <Route path="/bills" element={<BillPaymentPage />} />
                <Route path="/tickets" element={<TicketBookingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/policy" element={<PolicyPage />} />
                <Route path="/blog" element={<BlogListPage />} />
                <Route path="/blog/:slug" element={<BlogDetailsPage />} />
            </Route>

            <Route path="/offline" element={<OfflinePage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* GUEST ROUTES */}
            <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
            <Route path="/admin/login" element={<GuestGuard><AdminLoginPage /></GuestGuard>} />
            <Route path="/employee/login" element={<GuestGuard><EmployeeLoginPage /></GuestGuard>} />
            <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
            <Route path="/forgot-password" element={<GuestGuard><ForgotPasswordPage /></GuestGuard>} />
            <Route path="/reset-password" element={<GuestGuard><ResetPasswordPage /></GuestGuard>} />

            {/* ADMIN ROUTES */}
            <Route
                path="/admin"
                element={
                    <AuthGuard>
                        <AdminGuard>
                            <AdminLayout />
                        </AdminGuard>
                    </AuthGuard>
                }
            >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                <Route path="employees" element={<AdminEmployeesPage />} />
                <Route path="employees/register" element={<AdminEmployeeRegisterPage />} />
                <Route path="employees/edit/:id" element={<AdminEmployeeRegisterPage />} />
                <Route path="employees/:id" element={<AdminEmployeeDetailsPage />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="customers/:id" element={<AdminCustomerDetailsPage />} />
                <Route path="leads" element={<AdminLeadsPage />} />
                <Route path="leads/:id" element={<AdminLeadDetailsPage />} />
                <Route path="loans" element={<AdminLoansPage />} />
                <Route path="loans/create" element={<AdminCreateLoanPage />} />
                <Route path="loans/edit/:id" element={<AdminEditLoanPage />} />
                <Route path="cards" element={<AdminCardsPage />} />
                <Route path="cards/create" element={<AdminCreateCardPage />} />
                <Route path="cards/edit/:id" element={<AdminCreateCardPage />} />
                <Route path="blogs" element={<AdminBlogsPage />} />
                <Route path="blogs/create" element={<AdminCreateBlogPage />} />
                <Route path="blogs/edit/:id" element={<AdminCreateBlogPage />} />
                <Route path="email-templates" element={<AdminEmailTemplatesPage />} />
                <Route path="profile" element={<AdminProfilePage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* EMPLOYEE ROUTES */}
            <Route
                path="/employee"
                element={
                    <AuthGuard>
                        <EmployeeGuard>
                            <EmployeeLayout />
                        </EmployeeGuard>
                    </AuthGuard>
                }
            >
                <Route index element={<Navigate to="/employee/dashboard" replace />} />
                <Route path="dashboard" element={<EmployeeDashboardPage />} />
                <Route path="leads" element={<EmployeeLeadsPage />} />
                <Route path="leads/create" element={<EmployeeCreateLeadPage />} />
                <Route path="leads/:id" element={<EmployeeLeadDetailsPage />} />
                <Route path="call-history" element={<EmployeeCallHistoryPage />} />
                <Route path="performance" element={<EmployeePerformancePage />} />
                <Route path="profile" element={<EmployeeProfilePage />} />
            </Route>


            {/* CUSTOMER ROUTES */}
            <Route
                path="/customer"
                element={
                    <AuthGuard>
                        <CustomerGuard>
                            <CustomerLayout />
                        </CustomerGuard>
                    </AuthGuard>
                }
            >
                <Route index element={<CustomerDashboardPage />} />
                <Route path="offers" element={<CustomerOffersPage />} />
                <Route path="offers/:id" element={<CustomerOfferDetailsPage />} />
                <Route path="apply/:id" element={<CustomerApplyLoanPage />} />
                <Route path="favorites" element={<CustomerFavoriteOffersPage />} />
                <Route path="applications" element={<CustomerApplicationsPage />} />
                <Route path="applications/:id" element={<CustomerApplicationDetailsPage />} />
                <Route path="profile" element={<CustomerProfilePage />} />
                <Route path="services" element={<UtilityServicesPage />} />
                <Route path="complete-profile" element={<CompleteProfilePage />} />
            </Route>

            {/* 404 - Redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
