# Glassmorphism Design System

A comprehensive glassmorphism UI implementation for modern, elegant interfaces.

## ✨ Features

- **Multiple Variants**: Default, Strong, and Subtle glass effects
- **Responsive**: Works seamlessly across all devices
- **Dark Mode Support**: Automatically adapts to dark/light themes
- **Reusable Components**: Pre-built UI components ready to use
- **Customizable**: Easy to extend and modify

## 🎨 Utility Classes

### Basic Glass Effects

```html
<!-- Default glassmorphism -->
<div class="glass">...</div>

<!-- Strong opacity variant -->
<div class="glass-strong">...</div>

<!-- Subtle transparency variant -->
<div class="glass-subtle">...</div>
```

### Pre-styled Cards

```html
<!-- Card with glass effect, rounded corners, and shadow -->
<div class="glass-card">...</div>

<!-- Strong variant card -->
<div class="glass-card-strong">...</div>

<!-- Subtle variant card -->
<div class="glass-card-subtle">...</div>
```

### Special Effects

```html
<!-- Glass with gradient border overlay -->
<div class="glass-gradient-border rounded-xl">...</div>
```

## 🧩 React Components

### GlassCard

```tsx
import { GlassCard } from "@/components/ui/glass-card";

// Default variant
<GlassCard>
  <h3>Card Title</h3>
  <p>Card content</p>
</GlassCard>

// Strong variant
<GlassCard variant="strong">
  <h3>Strong Glass Card</h3>
</GlassCard>

// Subtle variant
<GlassCard variant="subtle">
  <h3>Subtle Glass Card</h3>
</GlassCard>

// With gradient border
<GlassCard withGradientBorder>
  <h3>Gradient Border Card</h3>
</GlassCard>
```

**Props:**
- `variant`: "default" | "strong" | "subtle"
- `withGradientBorder`: boolean
- All standard HTML div attributes

### GlassButton

```tsx
import { GlassButton } from "@/components/ui/glass-button";

// Default variant
<GlassButton>Click Me</GlassButton>

// Strong variant
<GlassButton variant="strong">
  Submit
</GlassButton>

// Subtle variant
<GlassButton variant="subtle">
  Cancel
</GlassButton>
```

**Props:**
- `variant`: "default" | "strong" | "subtle"
- All standard HTML button attributes

### GlassInput

```tsx
import { GlassInput } from "@/components/ui/glass-input";

// Default variant
<GlassInput type="text" placeholder="Enter text..." />

// Strong variant
<GlassInput variant="strong" type="email" placeholder="Email..." />

// Subtle variant
<GlassInput variant="subtle" type="search" placeholder="Search..." />
```

**Props:**
- `variant`: "default" | "strong" | "subtle"
- All standard HTML input attributes

## 🎯 Usage Examples

### Navigation Menu

```tsx
<nav className="glass-card p-4">
  <div className="space-y-2">
    <button className="w-full glass-subtle hover:glass p-3 rounded-lg">
      Home
    </button>
    <button className="w-full glass-subtle hover:glass p-3 rounded-lg">
      Profile
    </button>
    <button className="w-full glass-subtle hover:glass p-3 rounded-lg">
      Settings
    </button>
  </div>
</nav>
```

### Form Card

```tsx
<div className="glass-card p-6">
  <h2 className="text-2xl font-bold text-white mb-4">Login</h2>
  <form className="space-y-4">
    <GlassInput type="email" placeholder="Email" />
    <GlassInput type="password" placeholder="Password" />
    <GlassButton variant="strong" className="w-full">
      Sign In
    </GlassButton>
  </form>
</div>
```

### Stats Dashboard

```tsx
<div className="glass-card p-6">
  <h3 className="text-xl font-bold text-white mb-4">Analytics</h3>
  <div className="grid grid-cols-2 gap-4">
    <div className="glass-strong p-4 rounded-lg">
      <p className="text-white/70 text-sm">Views</p>
      <p className="text-3xl font-bold text-white">12.5K</p>
    </div>
    <div className="glass-strong p-4 rounded-lg">
      <p className="text-white/70 text-sm">Likes</p>
      <p className="text-3xl font-bold text-white">3.2K</p>
    </div>
  </div>
</div>
```

### Modal/Dialog

```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
  <div className="glass-card max-w-md w-full p-6">
    <h3 className="text-2xl font-bold text-white mb-4">Confirm Action</h3>
    <p className="text-white/80 mb-6">Are you sure you want to proceed?</p>
    <div className="flex gap-3">
      <GlassButton variant="subtle" className="flex-1">
        Cancel
      </GlassButton>
      <GlassButton variant="strong" className="flex-1">
        Confirm
      </GlassButton>
    </div>
  </div>
</div>
```

## 🎨 Best Practices

### 1. Use with Vibrant Backgrounds
Glassmorphism looks best against colorful gradients or images:

```tsx
<div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
  <GlassCard>
    Your content here
  </GlassCard>
</div>
```

### 2. Layer Appropriately
Use different variants to create visual hierarchy:

```tsx
<div className="glass-card p-6">
  <h3 className="text-xl font-bold mb-4">Parent</h3>
  <div className="glass-subtle p-4 rounded-lg">
    Nested child element
  </div>
</div>
```

### 3. Combine with Shadows
Add depth with shadow utilities:

```tsx
<div className="glass shadow-2xl rounded-xl p-6">
  Enhanced depth
</div>
```

### 4. Use Hover States
Create interactive feedback:

```tsx
<button className="glass hover:glass-strong transition-all p-4 rounded-lg">
  Hover me
</button>
```

## 🌙 Dark Mode

All glass effects automatically adapt to dark mode:

```tsx
// Light mode: rgba(255, 255, 255, 0.1)
// Dark mode: rgba(0, 0, 0, 0.3)
<div className="glass">
  Automatically adapts to theme
</div>
```

## 📱 Responsive Design

All components are fully responsive:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <GlassCard>Card 1</GlassCard>
  <GlassCard>Card 2</GlassCard>
  <GlassCard>Card 3</GlassCard>
</div>
```

## 🔧 Customization

### Custom Glass Effect

You can create custom glass effects by combining Tailwind utilities:

```tsx
<div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl p-6">
  Custom glass effect
</div>
```

### Extend Tailwind Config

Add custom blur values in `tailwind.config.ts`:

```typescript
backdropBlur: {
  xs: '2px',
  '3xl': '64px',
}
```

## 📄 View Demo

Visit the demo page to see all glassmorphism components in action:

```tsx
import { GlassmorphismShowcase } from "@/components/GlassmorphismShowcase";

function App() {
  return <GlassmorphismShowcase />;
}
```

Or navigate to `/glass-design` in your application.

## 🎓 CSS Technical Details

The glassmorphism effect is achieved through:

1. **Semi-transparent background**: `rgba()` with low alpha
2. **Backdrop filter**: CSS `backdrop-filter: blur()`
3. **Border**: Semi-transparent border for definition
4. **Shadow**: For depth and elevation

```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* Safari support */
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

## 🌐 Browser Support

- ✅ Chrome/Edge 76+
- ✅ Safari 9+
- ✅ Firefox 103+
- ⚠️ Fallback styles for older browsers (no blur, higher opacity)

## 📚 Resources

- [View Showcase Component](../components/GlassmorphismShowcase.tsx)
- [GlassCard Component](../components/ui/glass-card.tsx)
- [GlassButton Component](../components/ui/glass-button.tsx)
- [GlassInput Component](../components/ui/glass-input.tsx)
- [CSS Styles](../index.css)

---

**Note**: Glassmorphism works best with vibrant backgrounds. Ensure sufficient contrast for text readability.
