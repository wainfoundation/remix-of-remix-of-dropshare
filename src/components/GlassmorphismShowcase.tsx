import { Bell, Heart, MessageCircle, Search, Settings, Share2, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function GlassmorphismShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Glassmorphism Design System
          </h1>
          <p className="text-xl text-white/90 drop-shadow">
            Modern, frosted glass UI components
          </p>
        </div>

        {/* Glass Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Basic Glass Card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Basic Glass</h3>
            </div>
            <p className="text-white/90">
              Standard glassmorphism effect with balanced transparency and blur.
            </p>
            <div className="mt-4 flex gap-2">
              <Button className="glass hover:glass-strong transition-all">
                Action
              </Button>
            </div>
          </div>

          {/* Strong Glass Card */}
          <div className="glass-card-strong p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Strong Glass</h3>
            </div>
            <p className="text-white/90">
              Enhanced opacity and stronger blur for prominent elements.
            </p>
            <div className="mt-4 space-y-2">
              <div className="glass-subtle p-3 rounded-lg text-white/80 text-sm">
                Nested glass element
              </div>
            </div>
          </div>

          {/* Subtle Glass Card */}
          <div className="glass-card-subtle p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Subtle Glass</h3>
            </div>
            <p className="text-white/90">
              Light transparency for background elements and overlays.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="px-3 py-1 glass rounded-full text-sm text-white">
                Tag 1
              </span>
              <span className="px-3 py-1 glass rounded-full text-sm text-white">
                Tag 2
              </span>
            </div>
          </div>

        </div>

        {/* Interactive Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Navigation Card */}
          <div className="glass-card p-6">
            <h3 className="text-2xl font-semibold text-white mb-6">Glass Navigation</h3>
            <nav className="space-y-2">
              {[
                { icon: <User />, label: "Profile" },
                { icon: <Settings />, label: "Settings" },
                { icon: <Bell />, label: "Notifications" },
                { icon: <Share2 />, label: "Share" },
              ].map((item, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 p-3 glass-subtle hover:glass transition-all rounded-lg text-white"
                >
                  <span className="w-5 h-5">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Form Card */}
          <div className="glass-card p-6">
            <h3 className="text-2xl font-semibold text-white mb-6">Glass Form</h3>
            <div className="space-y-4">
              <div className="glass p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-white/60" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/60"
                  />
                </div>
              </div>
              
              <div className="glass p-3 rounded-lg">
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/60"
                />
              </div>

              <button className="w-full glass-strong hover:glass-gradient-border transition-all p-3 rounded-lg text-white font-semibold">
                Submit
              </button>
            </div>
          </div>

        </div>

        {/* Feature Cards with Gradient Border */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-gradient-border rounded-xl p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 glass-strong rounded-full mb-4">
                <Heart className="w-8 h-8 text-white" fill="white" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Modern</h4>
              <p className="text-white/80 text-sm">
                Cutting-edge design trends for contemporary interfaces
              </p>
            </div>
          </div>

          <div className="glass-gradient-border rounded-xl p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 glass-strong rounded-full mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Elegant</h4>
              <p className="text-white/80 text-sm">
                Sophisticated aesthetics with attention to detail
              </p>
            </div>
          </div>

          <div className="glass-gradient-border rounded-xl p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 glass-strong rounded-full mb-4">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Responsive</h4>
              <p className="text-white/80 text-sm">
                Adaptable components that work on any device
              </p>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="glass-card p-8">
          <h3 className="text-2xl font-semibold text-white mb-6">Glass Dashboard</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: "24.5K", change: "+12%" },
              { label: "Active Now", value: "1,234", change: "+5%" },
              { label: "Engagement", value: "89%", change: "+3%" },
              { label: "Revenue", value: "$12.4K", change: "+18%" },
            ].map((stat, i) => (
              <div key={i} className="glass-strong p-4 rounded-lg">
                <p className="text-white/70 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-green-300 text-sm">{stat.change}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Guide */}
        <div className="glass-card p-8">
          <h3 className="text-2xl font-semibold text-white mb-4">How to Use</h3>
          <div className="space-y-4 text-white/90">
            <div className="glass-subtle p-4 rounded-lg">
              <code className="text-sm">className="glass"</code>
              <p className="mt-2 text-sm">Basic glassmorphism effect</p>
            </div>
            <div className="glass-subtle p-4 rounded-lg">
              <code className="text-sm">className="glass-strong"</code>
              <p className="mt-2 text-sm">Enhanced opacity variant</p>
            </div>
            <div className="glass-subtle p-4 rounded-lg">
              <code className="text-sm">className="glass-subtle"</code>
              <p className="mt-2 text-sm">Light transparency variant</p>
            </div>
            <div className="glass-subtle p-4 rounded-lg">
              <code className="text-sm">className="glass-card"</code>
              <p className="mt-2 text-sm">Pre-styled card with rounded corners and shadow</p>
            </div>
            <div className="glass-subtle p-4 rounded-lg">
              <code className="text-sm">className="glass-gradient-border"</code>
              <p className="mt-2 text-sm">Glass effect with gradient border overlay</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
