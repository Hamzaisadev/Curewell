# 0013. Unified Animated Action Primitive & Layout-Stable Button System

We decided to establish a unified, polymorphic, animated Action Primitive (`Button` and `IconButton`) across Curewell, replacing ad-hoc `<button>` elements, eliminating loading-state layout shift, and delivering tactile spring micro-interactions tailored for both web and mobile Android/PWA contexts.

## Context

Curewell is frequently operated by patients who are unwell, elderly, or navigating critical medication regimens one-handed on mobile devices.
Across the codebase, over 300 instances of raw `<button>` and ad-hoc Tailwind elements had accumulated, leading to several systematic defects:
1. **Inconsistent Tactile Feedback**: Some buttons had no tap feedback; others had basic CSS transitions; none provided a cohesive physical feel across touch and mouse interactions.
2. **Loading-State Layout Shift (Jitter)**: When a button entered `loading={true}`, replacing the label with a spinner caused the button's width and height to jump abruptly, causing nearby form fields, modals, and list items to re-flow.
3. **Misalignment of Icons & Badges**: Leading and trailing icons frequently misaligned vertically with text baselines or shrank when text flexed.
4. **Router & Link Fragmentation**: Because the existing `Button` component did not support polymorphic rendering (`asChild`), navigation triggers (such as `react-router-dom` `<Link>`) were manually re-implemented with arbitrary classes.
5. **Accessibility Inconsistencies**: Missing `aria-busy`, inconsistent `disabled` styling, and touch targets below the clinical 44px floor on mobile screens.

## Decision

1. **Physical Spring Micro-Interactions**:
   - Integrated `motion/react` spring physics (`stiffness: 500`, `damping: 30`, `mass: 0.8`) on `whileTap` (`scale: 0.96` for standard buttons, `scale: 0.92` for icon buttons).
   - Added subtle hover lift (`y: -1px`) on interactive states to convey elevation.
   - Guarded all animations with `prefers-reduced-motion` compliance to protect patients with vestibular sensitivities.
   - Added native vibration/haptic feedback trigger on touch devices (`navigator.vibrate?.(10)`).

2. **Zero-Layout-Shift Loading Architecture**:
   - Engineered a dual-layer preservation layout: when `loading={true}`, the original content is rendered with `invisible pointer-events-none` in place, ensuring the button retains its exact natural dimensions.
   - An accessible spinner is centered absolutely over the button without altering the surrounding DOM geometry.
   - When `loadingText` is supplied, an overlaid animated transition maintains visual balance.

3. **Polymorphic Navigation (`asChild`)**:
   - Integrated Radix UI's `Slot` primitive with `motion.create(Slot)`.
   - Allows buttons to wrap `<Link to="...">` or external anchors (`<a>`) while inheriting complete styling, spring animations, and accessibility semantics.

4. **Rigorous Optical Alignment**:
   - Clamped icons in dedicated `inline-flex shrink-0 items-center justify-center` containers with proportional dimensions (`sm`: 16px, `md`: 18px, `lg`: 20px).
   - Centered content with standard typography line-heights and guaranteed `min-h-[44px]` (floor touch target) on touch-relevant variants.

5. **Expanded Design System Palette**:
   - Added standard variants: `primary`, `secondary`, `subtle`, `ghost`, `danger`, and `outline`.
   - Added size scales: `xs` (compact 32px for dense data tables), `sm` (40px), `md` (44px/48px), `lg` (56px touch large), and `xl`.

## Consequences

- **Physical Tactile Confidence**: Patients receive instantaneous, physics-grounded feedback on every tap and click, reducing repeated accidental clicks during critical medication logging.
- **Flawless Layout Stability**: Forms, modal footers, and cards remain rock-solid during asynchronous mutations with zero visual jumping.
- **Consistent Codebase Architecture**: Screens and modals can use a single authoritative `Button` or `IconButton` component for all actions, links, and icon triggers.
