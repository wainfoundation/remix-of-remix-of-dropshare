# Glassmorphism Quick Reference

## 🚀 Quick Start

```bash
# Visit the demo page
/glass-design
```

## 📦 Import Components

```tsx
// Import individual components
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";

// Or import all at once
import { 
  GlassCard, 
  GlassButton, 
  GlassInput,
  GlassmorphicProfileCard 
} from "@/components/glass-components";
```

## 🎨 CSS Classes

| Class | Effect |
|-------|--------|
| `glass` | Standard glassmorphism |
| `glass-strong` | Enhanced opacity |
| `glass-subtle` | Light transparency |
| `glass-card` | Pre-styled card |
| `glass-card-strong` | Strong card variant |
| `glass-card-subtle` | Subtle card variant |
| `glass-gradient-border` | Gradient border effect |

## ⚡ One-Liners

```tsx
// Card
<div className="glass-card p-6">Content</div>

// Button
<button className="glass p-4 rounded-lg hover:glass-strong">Click</button>

// Input
<input className="glass p-3 rounded-lg text-white" placeholder="Search..." />

// Badge
<span className="glass px-3 py-1 rounded-full text-sm">Badge</span>

// Modal Backdrop
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
```

## 🎯 Component Examples

### GlassCard
```tsx
<GlassCard variant="strong" withGradientBorder>
  <h3>Title</h3>
  <p>Content</p>
</GlassCard>
```

### GlassButton
```tsx
<GlassButton variant="strong" onClick={() => {}}>
  Click Me
</GlassButton>
```

### GlassInput
```tsx
<GlassInput 
  variant="default" 
  type="text" 
  placeholder="Enter text..."
/>
```

## 🎨 Best Background

```tsx
<div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
  {/* Your glass components here */}
</div>
```

## 🌙 Dark Mode

All glass effects automatically adapt to dark/light themes!

## 📄 Files

- **CSS**: `src/index.css` (lines 105-200)
- **Components**: `src/components/ui/glass-*.tsx`
- **Demo**: `src/components/GlassmorphismShowcase.tsx`
- **Full Guide**: `GLASSMORPHISM_GUIDE.md`
