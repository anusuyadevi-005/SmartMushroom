import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Box, Leaf, Coffee } from "lucide-react";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="font-sans text-gray-800 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
      {/* HERO SECTION */}
      <section style={{backgroundImage: 'url(https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80), linear-gradient(to right, #16a085, #27ae60, #2ecc71)', backgroundSize: 'cover', backgroundPosition: 'center'}} className="min-h-screen text-white flex items-center justify-center px-6 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Fresh Premium <br />
            Mushrooms <span className="text-yellow-300 animate-pulse">Delivered Daily</span>
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-green-100 max-w-2xl mx-auto">
            Discover the finest selection of gourmet mushrooms. From oyster to shiitake,
            we bring you nature's most nutritious treasures, freshly harvested and sustainably grown.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="bg-yellow-400 hover:bg-yellow-500 text-green-800 font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg animate-bounce"
              onClick={() => navigate("/products")}
            >
              Shop Now
            </button>
            <button
              className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-green-800 font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 animate-bounce"
              onClick={() => navigate("/orders")}
            >
              Place Order
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* OYSTER MUSHROOM PRODUCTS */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800 animate-fade-in">Our Oyster Mushroom Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<ShoppingCart className="w-8 h-8" />}
              title="Fresh Oyster Mushrooms"
              desc="Premium quality, freshly harvested oyster mushrooms. Perfect for cooking, rich in nutrients and flavor."
              image="https://www.pepcare.co.in/product/31944247/Mushroom---Oysterhttps://thumbs.dreamstime.com/z/oyster-mushrooms-closeup-background-banner-texture-fresh-raw-back-view-310799384.jpg?ct=jpeg"
            />
            <FeatureCard
              icon={<Box className="w-8 h-8" />}
              title="Oyster Mushroom Pickle"
              desc="Tangy and crunchy pickled oyster mushrooms. A delicious condiment with probiotic benefits."
              image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
            />
            <FeatureCard
              icon={<Leaf className="w-8 h-8" />}
              title="Dried Oyster Mushrooms"
              desc="Convenient dried mushrooms that retain all nutrients. Perfect for soups, stews, and long-term storage."
              image="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
            />
            <FeatureCard
              icon={<Coffee className="w-8 h-8" />}
              title="Oyster Mushroom Powder"
              desc="Finely ground mushroom powder for seasoning, smoothies, and nutritional supplements."
              image="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
            />
          </div>
        </div>
      </section>

      {/* WHY CHOOSE OUR MUSHROOMS */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-100 to-blue-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-gray-800 animate-fade-in">Why Choose Our Mushrooms?</h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Experience the difference with our premium, sustainably grown mushrooms.
            From farm to table, we ensure exceptional quality, nutrition, and taste in every bite.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 animate-bounce-in">
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Freshness" className="w-full h-32 object-cover rounded-lg mb-4" />
              <h3 className="font-bold text-lg mb-2 text-green-600">Farm Fresh</h3>
              <p className="text-gray-600">Harvested daily and delivered fresh to preserve maximum nutrition and flavor.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 animate-bounce-in">
              <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Nutrition" className="w-full h-32 object-cover rounded-lg mb-4" />
              <h3 className="font-bold text-lg mb-2 text-blue-600">Nutrient Rich</h3>
              <p className="text-gray-600">Packed with vitamins, minerals, and antioxidants for optimal health benefits.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 animate-bounce-in">
              <img src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Quality" className="w-full h-32 object-cover rounded-lg mb-4" />
              <h3 className="font-bold text-lg mb-2 text-purple-600">Premium Quality</h3>
              <p className="text-gray-600">Carefully cultivated using sustainable practices for the finest gourmet experience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MUSHROOM RECIPES VIDEO */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-gray-800 animate-fade-in">Delicious Mushroom Recipes</h2>
          <p className="text-xl text-gray-600 mb-10">Discover creative ways to cook with our fresh mushrooms and elevate your culinary experience.</p>
          <div className="relative w-full max-w-2xl mx-auto">
            <iframe
              width="100%"
              height="315"
              src="https://www.youtube.com/embed/8Z6Qf5n8Z6Q"
              title="Mushroom Recipe Ideas"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg shadow-lg"
            ></iframe>
          </div>
        </div>
      </section>

      {/* PRODUCT GALLERY */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-gray-800 animate-fade-in">Our Oyster Mushroom Collection</h2>
          <p className="text-xl text-gray-600 mb-10">Explore our premium oyster mushroom products, from fresh to processed, all made with care and quality.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <img src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Fresh Oyster Mushrooms" className="w-full h-64 object-cover rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300" />
            <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Oyster Mushroom Pickles" className="w-full h-64 object-cover rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300" />
            <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Dried Oyster Mushrooms" className="w-full h-64 object-cover rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300" />
          </div>
          <div className="relative w-full max-w-2xl mx-auto">
            <iframe
              width="100%"
              height="315"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Oyster Mushroom Recipes"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg shadow-lg"
            ></iframe>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">Ready to Order Fresh Mushrooms?</h2>
          <p className="text-xl mb-10 text-green-100">Join thousands of satisfied customers enjoying our premium, farm-fresh mushrooms delivered daily.</p>
          <button
            className="bg-yellow-400 hover:bg-yellow-500 text-green-800 font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
            onClick={() => navigate("/products")}
          >
            Order Now
          </button>
        </div>
      </section>
    </div>
  );
}

/* FEATURE CARD */
function FeatureCard({ icon, title, desc, image }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 animate-slide-in">
      <img src={image} alt={title} className="w-full h-32 object-cover rounded-lg mb-4" />
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-gray-800">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}

export default Home;

