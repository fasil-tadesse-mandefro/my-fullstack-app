import React from "react";
import Layout from "../../layout/Layout";
import HeroSection from "./components/HeroSection";
import HowItWorks from "./components/HowItWorks";
import FeaturedTutors from "./components/FeaturedTutors";
import FeaturedCourses from "./components/FeaturedCourses";
import "./Home.css";

function Home() {
  return (
    <Layout>
      <div className="home-page">
        <HeroSection />
        <HowItWorks />
        <FeaturedTutors />
        <FeaturedCourses />
      </div>
    </Layout>
  );
}

export default Home;
