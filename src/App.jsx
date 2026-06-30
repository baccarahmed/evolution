import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PriceTicker from './components/layout/PriceTicker';
import NavBar from './components/layout/NavBar';
import AppFooter from './components/layout/AppFooter';
import ElectroBackground from './components/ui/electro-background/ElectroBackground';
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';
import Home from './views/Home';
import Formations from './views/Formations';
import FormationDetail from './views/FormationDetail';
import FormationCourse from './views/FormationCourse';
import Lives from './views/Lives';
import Dashboard from './views/Dashboard';
import Certificates from './views/Certificates';
import AdminDashboard from './views/AdminDashboard';
import Community from './views/Community';
import Contact from './views/Contact';
import Login from './views/Login';
import Register from './views/Register';
import FAQ from './views/FAQ';
import Chat from './views/Chat';
import './App.css';
import './styles/forms.css';

function App() {
  return (
    <div id="app" className="relative min-h-screen">
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <ElectroBackground />
      </div>
      <div className="relative z-10">
        <PriceTicker />
        <NavBar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/formations" element={<Formations />} />
            <Route path="/formations/:id" element={<FormationDetail />} />
            <Route
              path="/formations/:id/course"
              element={
                <PrivateRoute>
                  <FormationCourse />
                </PrivateRoute>
              }
            />
            <Route path="/lives" element={<Lives />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/certificates"
              element={
                <PrivateRoute>
                  <Certificates />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route path="/community" element={<Community />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <Chat />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
        <AppFooter />
      </div>
    </div>
  );
}

export default App;
