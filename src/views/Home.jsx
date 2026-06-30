import React from 'react';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import ServicesSection from '../components/home/ServicesSection';
import CryptoBanner from '../components/home/CryptoBanner';
import PricingSection from '../components/home/PricingSection';
import SpotlightSection from '../components/showcase/SpotlightSection';
import TestimonySection from '../components/showcase/TestimonySection';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <HeroSection />
      <ServicesSection />
      <CryptoBanner />
      <FeaturesSection />
      <SpotlightSection />
      <PricingSection />
      <TestimonySection />
    </div>
  );
};

export default Home;
