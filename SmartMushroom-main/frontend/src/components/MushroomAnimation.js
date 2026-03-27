import React from 'react';

const MushroomAnimation = () => {
    return (
        <div className="relative w-full h-[400px] flex items-center justify-center overflow-hidden">
            <style>{`
        @keyframes drift {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(52, 211, 153, 0.4)); }
          50% { filter: drop-shadow(0 0 25px rgba(52, 211, 153, 0.8)); }
        }
        @keyframes breath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes spore-float {
          0% { transform: translate(0, 0) opacity(0); }
          50% { opacity: 0.8; }
          100% { transform: translate(var(--tw-translate-x), var(--tw-translate-y)) opacity(0); }
        }
        .mushroom-main {
          animation: drift 6s ease-in-out infinite, pulse-glow 4s ease-in-out infinite;
        }
        .mushroom-cap {
          animation: breath 3s ease-in-out infinite;
        }
        .spore {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #34d399;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
        }
      `}</style>

            {/* Spores around the mushroom */}
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="spore"
                    style={{
                        left: `${Math.random() * 60 + 20}%`,
                        top: `${Math.random() * 60 + 20}%`,
                        '--tw-translate-x': `${(Math.random() - 0.5) * 100}px`,
                        '--tw-translate-y': `${(Math.random() - 1) * 150}px`,
                        animation: `spore-float ${2 + Math.random() * 4}s linear infinite`,
                        animationDelay: `${Math.random() * 5}s`
                    }}
                />
            ))}

            <svg
                viewBox="0 0 200 200"
                className="w-64 h-64 mushroom-main"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Shadow */}
                <ellipse cx="100" cy="180" rx="40" ry="10" fill="rgba(0,0,0,0.1)" />

                {/* Stem */}
                <path
                    d="M85 180 Q100 170 115 180 L110 110 Q100 105 90 110 Z"
                    fill="#ECFDF5"
                    stroke="#D1FAE5"
                    strokeWidth="1"
                />

                {/* Cap */}
                <g className="mushroom-cap">
                    <path
                        d="M40 110 Q40 40 100 40 Q160 40 160 110 Q160 130 100 130 Q40 130 40 110 Z"
                        fill="url(#capGradient)"
                    />

                    {/* Decorative Spots */}
                    <circle cx="70" cy="75" r="5" fill="rgba(255,255,255,0.4)" />
                    <circle cx="100" cy="65" r="7" fill="rgba(255,255,255,0.4)" />
                    <circle cx="130" cy="80" r="4" fill="rgba(255,255,255,0.4)" />
                    <circle cx="105" cy="95" r="6" fill="rgba(255,255,255,0.4)" />
                    <circle cx="85" cy="105" r="4" fill="rgba(255,255,255,0.4)" />
                </g>

                <defs>
                    <linearGradient id="capGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#065F46', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
            </svg>

            {/* Ambient particles background effect */}
            <div className="absolute inset-0 z-[-1]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-400 opacity-10 blur-3xl rounded-full"></div>
            </div>
        </div>
    );
};

export default MushroomAnimation;
