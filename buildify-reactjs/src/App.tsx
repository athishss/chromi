import { Routes, Route, Navigate } from "react-router-dom";
import LenisScroll from "./components/lenis";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import ProtectedRoute from "./components/protected-route";
import ChatSidebar from "./components/ChatSidebar";
import DailyClaimModal from "./components/DailyClaimModal";

// Landing page sections
import HeroSection from "./sections/hero-section";
import StatsSection from "./sections/stats-section";
import FeaturesSection from "./sections/features-section";
import HowItWorksSection from "./sections/how-it-works-section";
import FaqSection from "./sections/faq-section";
import CtaSection from "./sections/cta-section";

// App pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import OfferService from "./pages/OfferService";
import Browse from "./pages/Browse";
import ExchangeDetail from "./pages/ExchangeDetail";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import CreditWallet from "./pages/CreditWallet";
import Community from "./pages/Community";
import Analytics from "./pages/Analytics";
import Disputes from "./pages/Disputes";
import Schedule from "./pages/Schedule";
import Rewards from "./pages/Rewards";
import PublicProfile from "./pages/PublicProfile";

function LandingPage() {
    return (
        <>
            <HeroSection />
            <StatsSection />
            <FeaturesSection />
            <HowItWorksSection />
            <FaqSection />
            <CtaSection />
        </>
    );
}

export default function App() {
    return (
        <div>
            <LenisScroll />
            <Navbar />
            <ChatSidebar />
            <DailyClaimModal />
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/offer" element={<ProtectedRoute><OfferService /></ProtectedRoute>} />
                <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
                <Route path="/exchange/:exchangeId" element={<ProtectedRoute><ExchangeDetail /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/profile/:userId" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute><CreditWallet /></ProtectedRoute>} />
                <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
                <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/disputes" element={<ProtectedRoute><Disputes /></ProtectedRoute>} />
                <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
        </div>
    )
}