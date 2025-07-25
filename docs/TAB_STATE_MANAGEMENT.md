# Tab State Management System

## Overview

The Tab State Management System prevents unwanted redirects and preserves user state when switching between browser tabs. This is particularly important for single-page applications where users might have forms filled out or be in the middle of a workflow.

## Problem Solved

Previously, when users switched tabs and returned to Nestie, the application would:
- Automatically redirect to the dashboard regardless of current page
- Lose form input data
- Reset search filters and results
- Lose scroll position
- Interrupt user workflows

## Solution Components

### 1. Session State Manager (`lib/sessionStateManager.ts`)

The core system that manages tab visibility and state preservation:

- **Tab Activity Tracking**: Monitors when tabs become active/inactive
- **Redirect Prevention**: Blocks automatic redirects for 2 seconds after tab activation
- **State Persistence**: Saves form data, scroll position, and component state
- **Automatic Restoration**: Restores saved state when returning to the tab

### 2. Enhanced Router (`useStateAwareRouter`)

A wrapper around Next.js router that respects tab state:

```typescript
const router = useStateAwareRouter()
// This will be blocked if tab just became active
router.push('/dashboard') 
```

### 3. Session State Hook (`useSessionState`)

React hook for components to manage their state:

```typescript
const { isTabActive, restoreState, saveCurrentState, shouldPreventRedirect } = useSessionState('my-component')
```

## Implementation

### Updated Components

1. **Landing Page (`app/page.tsx`)**
   - Uses session state to prevent auto-redirects on tab focus
   - Only redirects on actual auth events, not token refreshes

2. **Protected Route (`components/ProtectedRoute.tsx`)**
   - Respects tab state when checking authentication
   - Prevents redirect loops during tab switching

3. **Dashboard Pages**
   - Preserve search queries, filters, and form data
   - Restore state when returning to tab
   - Maintain scroll position

### Key Features

- **Automatic State Saving**: Forms and component state saved when tab becomes inactive
- **Smart Restoration**: State restored when tab becomes active again
- **Redirect Protection**: 2-second grace period prevents unwanted redirects
- **Persistent Storage**: Uses sessionStorage for cross-tab-switch persistence
- **Debounced Saving**: Efficient state saving with debouncing

## Usage Examples

### Basic Component State Management

```typescript
import { useSessionState } from '@/lib/sessionStateManager'

function MyComponent() {
  const { isTabActive, restoreState, saveCurrentState } = useSessionState('my-component')
  
  useEffect(() => {
    // Restore state on mount
    restoreState()
  }, [restoreState])
  
  // State is automatically saved when tab becomes inactive
  return <div>My Component</div>
}
```

### Form State Preservation

```typescript
function SearchForm() {
  const [query, setQuery] = useState('')
  const { saveCurrentState } = useSessionState('search-form')
  
  useEffect(() => {
    // Save state when query changes
    if (query) {
      saveCurrentState()
    }
  }, [query, saveCurrentState])
  
  return (
    <input 
      name="searchQuery"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  )
}
```

### Protected Navigation

```typescript
import { useStateAwareRouter } from '@/lib/sessionStateManager'

function NavigationComponent() {
  const router = useStateAwareRouter()
  
  const handleNavigation = () => {
    // This respects tab state and won't redirect if tab just became active
    router.push('/dashboard')
  }
  
  return <button onClick={handleNavigation}>Go to Dashboard</button>
}
```

## Configuration

### State Keys

Each component should use a unique state key:
- `'landing-page'` - Main landing page
- `'dashboard-search'` - Tenant dashboard search
- `'agent-dashboard'` - Agent dashboard
- `'protected-route'` - Protected route component

### Timing Settings

- **Redirect Protection**: 2 seconds after tab becomes active
- **State Save Debounce**: 300ms delay for form state saving
- **Restoration Delay**: 200ms delay for form data restoration
- **Auto-save Interval**: Every 10 seconds while tab is active

## Benefits

1. **Better User Experience**: No more lost work when switching tabs
2. **Preserved Context**: Users return to exactly where they left off
3. **Reduced Frustration**: No unexpected redirects or lost form data
4. **Improved Workflow**: Seamless multi-tab usage
5. **Performance**: Efficient state management with minimal overhead

## Testing

To test the system:

1. Fill out a form or search query
2. Switch to another tab
3. Return to the Nestie tab
4. Verify that:
   - No unwanted redirect occurred
   - Form data is preserved
   - Scroll position is maintained
   - Component state is intact

## Debug Mode

Add the `TabStateIndicator` component to see tab state in real-time:

```typescript
import { TabStateIndicator } from '@/components/TabStateIndicator'

function MyPage() {
  return (
    <div>
      <TabStateIndicator showIndicator={true} />
      {/* Your page content */}
    </div>
  )
}
```

This will show a small indicator in the top-right corner showing tab status and protection state.