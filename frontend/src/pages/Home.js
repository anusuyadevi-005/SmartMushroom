import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="font-sans text-gray-800 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
      {/* HERO SECTION */}
      <section className="min-h-screen bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 text-white flex items-center justify-center px-6 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Mushroom Cultivation <br />
            Powered by <span className="text-yellow-300 animate-pulse">Smart Harvest</span>
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-green-100 max-w-2xl mx-auto">
            Professional mushroom farming platform designed for harvesters.
            Track batches, monitor environments, predict yields, and maximize harvests.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="bg-yellow-400 hover:bg-yellow-500 text-green-800 font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
              onClick={() => navigate("/dashboard")}
            >
              View Dashboard
            </button>
            <button
              className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-green-800 font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate("/batch")}
            >
              Create Batch
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Powerful Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon="🌱"
              title="Batch Management"
              desc="Create, track and manage cultivation batches with real-time status."
            />
            <FeatureCard
              icon="🌡️"
              title="Environment Monitoring"
              desc="Monitor expiry, safety status and environment health instantly."
            />
            <FeatureCard
              icon="🛒"
              title="Smart Orders"
              desc="Place and manage mushroom orders with live tracking."
            />
            <FeatureCard
              icon="📊"
              title="Analytics Dashboard"
              desc="Visual insights for batches, orders and expiry trends."
            />
          </div>
        </div>
      </section>

      {/* WHY AGROSENSE */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-100 to-blue-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-gray-800">Why AgroSense?</h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            AgroSense helps farmers and agri-businesses reduce waste,
            improve productivity and make data-driven decisions with cutting-edge technology.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="font-bold text-lg mb-2 text-green-600">Efficiency</h3>
              <p className="text-gray-600">Streamline operations and reduce manual work.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="font-bold text-lg mb-2 text-blue-600">Sustainability</h3>
              <p className="text-gray-600">Minimize waste and optimize resource usage.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="font-bold text-lg mb-2 text-purple-600">Insights</h3>
              <p className="text-gray-600">Data-driven decisions for better outcomes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">Ready to Grow Smarter?</h2>
          <p className="text-xl mb-10 text-green-100">Join thousands of farmers using AgroSense to revolutionize their agriculture.</p>
          <button
            className="bg-yellow-400 hover:bg-yellow-500 text-green-800 font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
            onClick={() => navigate("/dashboard")}
          >
            Get Started Today
          </button>
        </div>
      </section>
    </div>
  );
}

/* FEATURE CARD */
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-gray-800">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}

export default Home;

