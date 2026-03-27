import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Box, Leaf, Coffee, Play } from "lucide-react";

import MushroomAnimation from "../components/MushroomAnimation";

function Home() {
  const navigate = useNavigate();
  const [currentPhoto, setCurrentPhoto] = React.useState(0);

  const productPhotos = [
    "https://www.shutterstock.com/image-photo/beautiful-texture-pattern-on-underside-260nw-2438261583.jpg",
    "https://farmm2home.com/wp-content/uploads/2022/12/img_7518-scaled-768x1152.jpeg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS29G31QwET3BFThaTxxzt1Y1MlTDl0NOBIUQ&s",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhoto((prev) => (prev + 1) % productPhotos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="font-sans text-gray-800 bg-[#f8fcf9] min-h-screen">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        .glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
      `}</style>

      {/* HERO SECTION */}
      <section className="pt-24 pb-16 px-6 relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          {/* Left Column: Animation & Text */}
          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-emerald-700 uppercase bg-emerald-100 rounded-full animate-fade-in">
              Premium Gourmet Selection
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight text-gray-900 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Fresh <span className="text-emerald-600">Mushrooms</span> <br />
              Grown with Care
            </h1>
            <p className="text-xl mb-10 text-gray-600 max-w-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Experience the pinnacle of flavor and nutrition. Our sustainably harvested mushrooms are delivered from our farm to your table, ensuring unparalleled freshness.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <button
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-10 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl shadow-emerald-200"
                onClick={() => navigate("/products")}
              >
                Explore Shop
              </button>
              <button
                className="bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-bold py-4 px-10 rounded-2xl transition-all duration-300 transform hover:scale-105"
                onClick={() => navigate("/orders")}
              >
                Quick Order
              </button>
            </div>

            <div className="mt-12 hidden md:block">
              <MushroomAnimation />
            </div>
          </div>

          {/* Right Column: Photo Slider */}
          <div className="flex-1 w-full max-w-xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {/* SVG ClipPath Definition - Organic Shape */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
              <defs>
                <clipPath id="organicClip" clipPathUnits="objectBoundingBox">
                  <path d="M0.5,0 C0.8,0 1,0.2 1,0.5 C1,0.8 0.8,1 0.5,1 C0.2,1 0,0.8 0,0.5 C0,0.2 0.2,0 0.5,0" />
                </clipPath>
              </defs>
            </svg>

            <div
              className="relative aspect-square group cursor-pointer overflow-hidden transition-all duration-700"
              style={{
                clipPath: 'url(#organicClip)',
                filter: 'drop-shadow(0 20px 40px rgba(45,106,79,0.15))'
              }}
            >
              {productPhotos.map((photo, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentPhoto ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                >
                  <img src={photo} alt="Mushroom" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent" />
                </div>
              ))}

              {/* Slider Indicators */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3">
                {productPhotos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentPhoto(idx); }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentPhoto ? 'bg-white w-6' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </div>

            {/* Mobile Animation */}
            <div className="mt-8 md:hidden">
              <MushroomAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Specialty Items</h2>
              <p className="text-gray-500 max-w-lg">From fresh harvests to artisanal pickles, discover our curated collection.</p>
            </div>
            <button onClick={() => navigate("/products")} className="text-emerald-600 font-bold hover:underline">View All Collection &rarr;</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<ShoppingCart className="w-6 h-6 text-emerald-600" />}
              title="Fresh Oyster"
              desc="Premium quality, freshly harvested daily."
              image="https://thumbs.dreamstime.com/z/oyster-mushrooms-closeup-background-banner-texture-fresh-raw-back-view-310799384.jpg"
              price="₹249"
            />
            <FeatureCard
              icon={<Box className="w-6 h-6 text-emerald-600" />}
              title="Mushroom Pickle"
              desc="Tangy condiment with probiotic benefits."
              image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
              price="₹180"
            />
            <FeatureCard
              icon={<Leaf className="w-6 h-6 text-emerald-600" />}
              title="Dried Selection"
              desc="Perfect for soups and long-term storage."
              image="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
              price="₹320"
            />
            <FeatureCard
              icon={<Coffee className="w-6 h-6 text-emerald-600" />}
              title="Gourmet Powder"
              desc="Nutritional booster for your favorite dishes."
              image="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
              price="₹210"
            />
          </div>
        </div>
      </section>

      {/* VIDEO EXPERIENCE */}
      <section className="py-24 px-6 bg-[#064e3b] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-emerald-500 opacity-20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-teal-500 opacity-20 blur-[120px] rounded-full"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Watch Our <span className="text-emerald-400">Harvest Journey</span></h2>
          <p className="text-emerald-100 text-lg mb-12 max-w-2xl mx-auto opacity-80">Take a peek behind the scenes and see how we grow the most beautiful mushrooms in the region.</p>

          <div className="relative aspect-[9/16] max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 glass p-2">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/OC9vBqS-6xw"
              title="Harvest Journey"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="rounded-2xl"
            ></iframe>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-emerald-600 rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 relative z-10">Ready to Elevate Your Cooking?</h2>
            <p className="text-emerald-50 text-xl mb-12 max-w-xl mx-auto relative z-10">Join our community of gourmet enthusiasts and get fresh mushrooms delivered to your doorstep.</p>
            <div className="relative z-10">
              <button
                className="bg-white text-emerald-700 hover:bg-emerald-50 font-extrabold py-5 px-12 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl text-lg"
                onClick={() => navigate("/products")}
              >
                Join the Movement
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* FEATURE CARD */
function FeatureCard({ icon, title, desc, image, price }) {
  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-100 hover:-translate-y-2">
      <div className="relative h-48 overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-emerald-800">{price}</div>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed mb-4">{desc}</p>
        <button className="text-emerald-600 font-bold text-sm flex items-center gap-2 group/btn">
          Add to Cart <span className="group-hover/btn:translate-x-1 transition-transform">&rarr;</span>
        </button>
      </div>
    </div>
  );
}

export default Home;

